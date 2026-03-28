package bookings

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
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

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*Cinema, error) {
	var cinema Cinema
	if err := s.db.WithContext(ctx).Preload("Rooms").First(&cinema, id).Error; err != nil {
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

func (s *Store) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]Session, error) {
	var sessions []Session

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

func (s *Store) GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error) {
	var seats []Seat
	var roomID int

	if err := s.db.WithContext(ctx).Model(&Session{}).Select("room_id").Where("id = ?", sessionID).Scan(&roomID).Error; err != nil {
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

func (s *Store) GetSessionByID(ctx context.Context, sessionID int) (*Session, error) {
    var session Session
    if err := s.db.WithContext(ctx).First(&session, sessionID).Error; err != nil {
        return nil, err
    }
    return &session, nil
}


func (s *Store) CreateReservation(ctx context.Context, userID, sessionID int, seatIDs []int, totalAmount int) (*Transaction, error) {
	var transaction Transaction

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		var occupiedCount int64
		if err := tx.Model(&Ticket{}).Where("seat_id IN ? AND session_id = ? AND status != 'CANCELLED'", seatIDs, sessionID).Count(&occupiedCount).Error; err != nil {
			return err
		}
		if occupiedCount > 0 {
			return ErrSeatAlreadyTaken
		}

		transaction = Transaction{
			UserID:        userID,
			TotalAmount:   totalAmount,
			Status:        TicketStatusPending,
			PaymentMethod: "NONE",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		for _, seatID := range seatIDs {
			sID := seatID
			ticket := Ticket{
				TransactionID: transaction.ID,
				SessionID:     sessionID,
				SeatID:        &sID,
				Status:        TicketStatusPending,
				QRCode:        "",
			}
			if err := tx.Create(&ticket).Error; err != nil {
				return err
			}
			transaction.Tickets = append(transaction.Tickets, ticket)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (s *Store) PayTransaction(ctx context.Context, transactionID int, userID int, method string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var transaction Transaction
		if err := tx.Where("id = ? AND user_id = ? AND status = ?", transactionID, userID, TicketStatusPending).First(&transaction).Error; err != nil {
			return ErrTransactionNotFound
		}

		transaction.Status = TicketStatusPaid
		transaction.PaymentMethod = method
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}

		var tickets []Ticket
		if err := tx.Where("transaction_id = ?", transactionID).Find(&tickets).Error; err != nil {
			return err
		}

		for _, ticket := range tickets {
			qrCode := fmt.Sprintf("CINEPASS-TX%d-TK%d-%d", transactionID, ticket.ID, time.Now().UnixNano())

			ticket.Status = TicketStatusPaid
			ticket.QRCode = qrCode

			if err := tx.Save(&ticket).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) CancelTicket(ctx context.Context, ticketID int, userID int) error {
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

		ticket.Status = TicketStatusCancelled
		return tx.Save(&ticket).Error
	})
}

func (s *Store) GetUserTickets(ctx context.Context, userID int, status string) ([]Ticket, error) {
	var tickets []Ticket
	query := s.db.WithContext(ctx).Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").Where("trx.user_id = ?", userID)

	if status != "" {
		query = query.Where("tickets.status = ?", status)
	}

	err := query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").Find(&tickets).Error

	return tickets, err
}

func (s *Store) GetTicketDetail(ctx context.Context, ticketID int, userID int) (*Ticket, error) {
	var ticket Ticket
	query := s.db.WithContext(ctx).Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").Where("tickets.id = ? AND trx.user_id = ?", ticketID, userID)

	err:= query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").First(&ticket).Error

	return &ticket, err
}
