package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/cinema"
	cinemastore "github.com/StartLivin/screek/backend/internal/cinema/store"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var _ bookings.BookingsRepository = (*Store)(nil)

var (
	ErrSeatAlreadyTaken    = errors.New("uma ou mais cadeiras já foram compradas ou estão no carrinho de outra pessoa")
	ErrTransactionNotFound = errors.New("transação pendente não encontrada ou você não tem permissão")
	ErrTicketNotFound      = errors.New("ingresso não encontrado ou já cancelado")
	ErrTxNotFound          = errors.New("transação não encontrada")
	ErrNotTicketOwner      = errors.New("você não é o dono deste ingresso")
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*cinema.Cinema, error) {
	var record cinemastore.CinemaRecord
	if err := s.db.WithContext(ctx).Preload("Rooms.Seats").First(&record, id).Error; err != nil {
		return nil, err
	}
	return cinemastore.ToCinemaDomain(&record), nil
}

func (s *Store) GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error) {
	var moviesList []movies.Movie

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}
	endOfDay := parsedDate.Add(24 * time.Hour)

	query := `
		SELECT DISTINCT m.* 
		FROM movies m
		JOIN sessions s ON s.movie_id = m.id
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE c.city ILIKE ? 
		  AND s.start_time >= ? 
		  AND s.start_time < ?
	`
	err = s.db.WithContext(ctx).Preload("Genres").Raw(query, city, parsedDate, endOfDay).Find(&moviesList).Error
	if err != nil {
		return nil, err
	}
	return moviesList, nil
}

func (s *Store) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]cinema.Session, error) {
	var records []cinemastore.SessionRecord

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}
	endOfDay := parsedDate.Add(24 * time.Hour)

	query := `
		SELECT s.* 
		FROM sessions s
		JOIN rooms r ON r.id = s.room_id
		JOIN cinemas c ON c.id = r.cinema_id
		WHERE s.movie_id = ? 
		  AND c.city ILIKE ? 
		  AND s.start_time >= ? 
		  AND s.start_time < ?
	`
	err = s.db.WithContext(ctx).Preload("Room.Cinema").Raw(query, movieID, city, parsedDate, endOfDay).Find(&records).Error
	if err != nil {
		return nil, err
	}
	return cinemastore.ToSessionList(records), nil
}

func (s *Store) GetSeatsBySession(ctx context.Context, sessionID int) ([]cinema.Seat, error) {
	var records []cinemastore.SeatRecord
	var roomID int

	if err := s.db.WithContext(ctx).Model(&cinemastore.SessionRecord{}).Select("room_id").Where("id = ?", sessionID).Scan(&roomID).Error; err != nil {
		return nil, err
	}

	query := `
		SELECT 
			s.*, 
			CASE WHEN t.id IS NOT NULL THEN true ELSE false END as is_occupied
		FROM seats s
		LEFT JOIN tickets t ON t.seat_id = s.id 
			AND t.session_id = ? 
			AND t.status != 'CANCELLED'
		WHERE s.room_id = ?
		ORDER BY s.row, s.number
	`
	err := s.db.WithContext(ctx).Raw(query, sessionID, roomID).Scan(&records).Error
	if err != nil {
		return nil, err
	}

	return cinemastore.ToSeatList(records), nil
}

func (s *Store) GetSessionByID(ctx context.Context, sessionID int) (*cinema.Session, error) {
	var record cinemastore.SessionRecord
	if err := s.db.WithContext(ctx).Preload("Room.Cinema").First(&record, sessionID).Error; err != nil {
		return nil, err
	}
	return cinemastore.ToSessionDomain(&record), nil
}

func (s *Store) CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, ticketsToCreate []bookings.Ticket, totalAmount int) (*bookings.Transaction, error) {
	var transactionRecord TransactionRecord

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var seatIDs []int
		for _, t := range ticketsToCreate {
			if t.SeatID != nil {
				seatIDs = append(seatIDs, *t.SeatID)
			}
		}

		if len(seatIDs) > 0 {
			var occupiedCount int64
			if err := tx.Model(&TicketRecord{}).Where("seat_id IN ? AND session_id = ? AND status != 'CANCELLED'", seatIDs, sessionID).Count(&occupiedCount).Error; err != nil {
				return err
			}
			if occupiedCount > 0 {
				return ErrSeatAlreadyTaken
			}
		}

		transactionRecord = TransactionRecord{
			ID:            uuid.New(),
			UserID:        userID,
			TotalAmount:   totalAmount,
			Status:        TicketStatus(bookings.TicketStatusPending),
			PaymentMethod: "NONE",
			CreatedAt:     time.Now(),
		}
		if err := tx.Create(&transactionRecord).Error; err != nil {
			return err
		}

		for _, t := range ticketsToCreate {
			ticketRecord := TicketRecord{
				ID:            uuid.New(),
				TransactionID: transactionRecord.ID,
				SessionID:     sessionID,
				SeatID:        t.SeatID,
				Status:        TicketStatus(bookings.TicketStatusPending),
				Type:          TicketType(t.Type),
				PricePaid:     t.PricePaid,
				QRCode:        "",
			}
			if err := tx.Create(&ticketRecord).Error; err != nil {
				return err
			}
			transactionRecord.Tickets = append(transactionRecord.Tickets, ticketRecord)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return ToTransactionDomain(&transactionRecord), nil
}

func (s *Store) GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*bookings.Transaction, error) {
	var record TransactionRecord
	if err := s.db.WithContext(ctx).Preload("Tickets").Where("id = ? AND user_id = ?", transactionID, userID).First(&record).Error; err != nil {
		return nil, ErrTxNotFound
	}
	return ToTransactionDomain(&record), nil
}

func (s *Store) PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&TransactionRecord{}).
			Where("id = ? AND user_id = ? AND status = ?", transactionID, userID, TicketStatus(bookings.TicketStatusPending)).
			Updates(map[string]interface{}{
				"status":         TicketStatus(bookings.TicketStatusPaid),
				"payment_method": method,
				"payment_id":     paymentID,
			})

		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrTransactionNotFound
		}

		var tickets []TicketRecord
		if err := tx.Where("transaction_id = ?", transactionID).Find(&tickets).Error; err != nil {
			return err
		}

		for _, ticket := range tickets {
			qrCode := fmt.Sprintf("SCREEK-TX%s-TK%s-%d", transactionID.String()[:8], ticket.ID.String()[:8], time.Now().UnixNano())

			err := tx.Model(&TicketRecord{}).Where("id = ?", ticket.ID).Updates(map[string]interface{}{
				"status":  TicketStatus(bookings.TicketStatusPaid),
				"qr_code": qrCode,
			}).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var ticket TicketRecord
		if err := tx.Where("id = ? AND status != ?", ticketID, TicketStatus(bookings.TicketStatusCancelled)).First(&ticket).Error; err != nil {
			return ErrTicketNotFound
		}

		var transaction TransactionRecord
		if err := tx.First(&transaction, ticket.TransactionID).Error; err != nil {
			return ErrTxNotFound
		}

		if transaction.UserID != userID {
			return ErrNotTicketOwner
		}

		var session cinemastore.SessionRecord
		if err := tx.First(&session, ticket.SessionID).Error; err == nil {
			if time.Now().After(session.StartTime.Add(-2 * time.Hour)) {
				return errors.New("não é possível cancelar um ingresso menos de 2 horas antes da sessão ou após o início")
			}
		}

		return tx.Model(&ticket).Update("status", TicketStatus(bookings.TicketStatusCancelled)).Error
	})
}

func (s *Store) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]bookings.Ticket, error) {
	var records []TicketRecord
	query := s.db.WithContext(ctx).Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").Where("trx.user_id = ?", userID)

	if status != "" {
		query = query.Where("tickets.status = ?", status)
	}

	err := query.Find(&records).Error
	return ToTicketList(records), err
}

func (s *Store) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*bookings.Ticket, error) {
	var record TicketRecord
	query := s.db.WithContext(ctx).
		Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").
		Where("tickets.id = ? AND trx.user_id = ?", ticketID, userID)

	err := query.Preload("Transaction").First(&record).Error
	return ToTicketDomain(&record), err
}

func (s *Store) GetSpecialStatusForMovies(ctx context.Context, city string, movieIDs []int) (map[int]map[string]bool, error) {
	if len(movieIDs) == 0 {
		return make(map[int]map[string]bool), nil
	}

	type Result struct {
		MovieID     int
		SessionType string
	}
	var results []Result

	query := `
		SELECT s.movie_id, s.session_type
		FROM sessions s
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE c.city = ? AND s.movie_id IN (?) AND s.session_type IN ('PREMIERE', 'RESCREENING')
		AND s.start_time >= now()
	`
	err := s.db.WithContext(ctx).Raw(query, city, movieIDs).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	statusMap := make(map[int]map[string]bool)
	for _, mID := range movieIDs {
		statusMap[mID] = map[string]bool{"premiere": false, "rescreening": false}
	}

	for _, result := range results {
		if result.SessionType == "PREMIERE" {
			statusMap[result.MovieID]["premiere"] = true
		} else if result.SessionType == "RESCREENING" {
			statusMap[result.MovieID]["rescreening"] = true
		}
	}

	return statusMap, nil
}

func (s *Store) CleanupExpiredReservations(ctx context.Context) (int64, int64, error) {
	cutoff := time.Now().Add(-10 * time.Minute)
	var ticketsDeleted, transactionsDeleted int64

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res1 := tx.Where(
			"transaction_id IN (SELECT id FROM transactions WHERE status = ? AND created_at < ?)",
			TicketStatus(bookings.TicketStatusPending), cutoff,
		).Delete(&TicketRecord{})
		if res1.Error != nil {
			return res1.Error
		}
		ticketsDeleted = res1.RowsAffected

		res2 := tx.Where(
			"status = ? AND created_at < ?",
			TicketStatus(bookings.TicketStatusPending), cutoff,
		).Delete(&TransactionRecord{})
		if res2.Error != nil {
			return res2.Error
		}
		transactionsDeleted = res2.RowsAffected

		return nil
	})

	return ticketsDeleted, transactionsDeleted, err
}

func (s *Store) AdminCancelTicket(ctx context.Context, ticketID uuid.UUID) (*bookings.Ticket, error) {
	var record TicketRecord
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Preload("Transaction").
			Where("id = ? AND status != ?", ticketID, TicketStatus(bookings.TicketStatusCancelled)).First(&record).Error; err != nil {
			return ErrTicketNotFound
		}
		record.Status = TicketStatus(bookings.TicketStatusCancelled)
		return tx.Save(&record).Error
	})
	return ToTicketDomain(&record), err
}

func (s *Store) GetTicketsBySession(ctx context.Context, sessionID int) ([]bookings.Ticket, error) {
	var records []TicketRecord
	err := s.db.WithContext(ctx).
		Preload("Transaction").
		Where("session_id = ?", sessionID).
		Find(&records).Error
	return ToTicketList(records), err
}
