package bookings

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var _ BookingsRepository = (*Store)(nil)

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

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error) {
	var cinema domain.Cinema
	if err := s.db.WithContext(ctx).Preload("Rooms.Seats").First(&cinema, id).Error; err != nil {
		return nil, err
	}
	return &cinema, nil
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

func (s *Store) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]domain.Session, error) {
	var sessions []domain.Session

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
	err = s.db.WithContext(ctx).Preload("Room").Preload("Room.Cinema").Raw(query, movieID, city, parsedDate, endOfDay).Find(&sessions).Error
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

func (s *Store) GetSeatsBySession(ctx context.Context, sessionID int) ([]domain.Seat, error) {
	var seats []domain.Seat
	var roomID int

	if err := s.db.WithContext(ctx).Model(&domain.Session{}).Select("room_id").Where("id = ?", sessionID).Scan(&roomID).Error; err != nil {
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
	err := s.db.WithContext(ctx).Raw(query, sessionID, roomID).Scan(&seats).Error

	if err != nil {
		return nil, err
	}

	return seats, nil
}

func (s *Store) GetSessionByID(ctx context.Context, sessionID int) (*domain.Session, error) {
	var session domain.Session
	if err := s.db.WithContext(ctx).Preload("Room").Preload("Room.Cinema").Preload("Movie").First(&session, sessionID).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (s *Store) CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, ticketsToCreate []Ticket, totalAmount int) (*Transaction, error) {
	var transaction Transaction

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		var seatIDs []int
		for _, t := range ticketsToCreate {
			seatIDs = append(seatIDs, *t.SeatID)
		}

		var occupiedCount int64
		if err := tx.Model(&Ticket{}).Where("seat_id IN ? AND session_id = ? AND status != 'CANCELLED'", seatIDs, sessionID).Count(&occupiedCount).Error; err != nil {
			return err
		}
		if occupiedCount > 0 {
			return ErrSeatAlreadyTaken
		}

		transaction = Transaction{
			ID:            uuid.New(),
			UserID:        userID,
			TotalAmount:   totalAmount,
			Status:        TicketStatusPending,
			PaymentMethod: "NONE",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		for i := range ticketsToCreate {
			ticketsToCreate[i].TransactionID = transaction.ID
			if err := tx.Create(&ticketsToCreate[i]).Error; err != nil {
				return err
			}
			transaction.Tickets = append(transaction.Tickets, ticketsToCreate[i])
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (s *Store) GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*Transaction, error) {
	var transaction Transaction
	if err := s.db.WithContext(ctx).Preload("User").Preload("Tickets").Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction).Error; err != nil {
		return nil, ErrTxNotFound
	}
	return &transaction, nil
}

func (s *Store) PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&Transaction{}).
			Where("id = ? AND user_id = ? AND status = ?", transactionID, userID, TicketStatusPending).
			Updates(map[string]interface{}{
				"status":         TicketStatusPaid,
				"payment_method": method,
				"payment_id":     paymentID,
			})

		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrTransactionNotFound
		}


		var tickets []Ticket
		if err := tx.Where("transaction_id = ?", transactionID).Find(&tickets).Error; err != nil {
			return err
		}

		for _, ticket := range tickets {
			qrCode := fmt.Sprintf("SCREEK-TX%s-TK%s-%d", transactionID.String()[:8], ticket.ID.String()[:8], time.Now().UnixNano())

			ticket.Status = TicketStatusPaid
			ticket.QRCode = qrCode

			if err := tx.Save(&ticket).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var ticket Ticket
		if err := tx.Where("id = ? AND status != ?", ticketID, TicketStatusCancelled).First(&ticket).Error; err != nil {
			return ErrTicketNotFound
		}
		var transaction Transaction
		if err := tx.First(&transaction, ticket.TransactionID).Error; err != nil {
			return ErrTxNotFound
		}

		if transaction.UserID != userID {
			return ErrNotTicketOwner
		}

		var session domain.Session
		if err := tx.First(&session, ticket.SessionID).Error; err == nil {
			if time.Now().After(session.StartTime.Add(-2 * time.Hour)) {
				return errors.New("não é possível cancelar um ingresso menos de 2 horas antes da sessão ou após o início")
			}
		}

		ticket.Status = TicketStatusCancelled
		return tx.Save(&ticket).Error
	})
}

func (s *Store) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]Ticket, error) {
	var tickets []Ticket
	query := s.db.WithContext(ctx).Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").Where("trx.user_id = ?", userID)

	if status != "" {
		query = query.Where("tickets.status = ?", status)
	}

	err := query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").Find(&tickets).Error

	return tickets, err
}

func (s *Store) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*Ticket, error) {
	var ticket Ticket
	query := s.db.WithContext(ctx).
		Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").
		Where("tickets.id = ? AND trx.user_id = ?", ticketID, userID)

	err := query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").Preload("Transaction").First(&ticket).Error

	return &ticket, err
}

func (s *Store) GetSpecialStatusForMovies(ctx context.Context, city string, movieIDs []int) (map[int]map[string]bool, error) {
	if len(movieIDs) == 0 {
		return make(map[int]map[string]bool), nil
	}

	type Result struct {
		MovieID     int
		SessionType domain.SessionType
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

	for _, r := range results {
		if r.SessionType == domain.SessionTypePremiere {
			statusMap[r.MovieID]["premiere"] = true
		} else if r.SessionType == domain.SessionTypeRescreen {
			statusMap[r.MovieID]["rescreening"] = true
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
			TicketStatusPending, cutoff,
		).Delete(&Ticket{})
		if res1.Error != nil {
			return res1.Error
		}
		ticketsDeleted = res1.RowsAffected

		res2 := tx.Where(
			"status = ? AND created_at < ?",
			TicketStatusPending, cutoff,
		).Delete(&Transaction{})
		if res2.Error != nil {
			return res2.Error
		}
		transactionsDeleted = res2.RowsAffected

		return nil
	})

	return ticketsDeleted, transactionsDeleted, err
}
