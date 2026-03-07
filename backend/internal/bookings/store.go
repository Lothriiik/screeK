package bookings

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetCinemaByID(id int) (*Cinema, error) {
	var cinema Cinema
	if err := s.db.Preload("Rooms").First(&cinema, id).Error; err != nil {
		return nil, err
	}
	return &cinema, nil
}

func (s *Store) GetSessionsByMovie(movieID int, city string, date string) ([]Session, error) {
	var sessions []Session

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}
	endOfDay := parsedDate.Add(24 * time.Hour)
	err = s.db.
		Preload("Room").
		Preload("Room.Cinema").
		Joins("JOIN rooms ON rooms.id = sessions.room_id").
		Joins("JOIN cinemas ON cinemas.id = rooms.cinema_id").
		Where("sessions.movie_id = ?", movieID).
		Where("cinemas.city ILIKE ?", city).
		Where("sessions.start_time >= ? AND sessions.start_time < ?", parsedDate, endOfDay).
		Find(&sessions).Error
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

func (s *Store) GetSeatsBySession(sessionID int) ([]Seat, error) {
	var seats []Seat
	var roomID int

	if err := s.db.Model(&Session{}).Select("room_id").Where("id = ?", sessionID).Scan(&roomID).Error; err != nil {
		return nil, err
	}

	err := s.db.Model(&Seat{}).
		Select("seats.*, CASE WHEN tickets.id IS NOT NULL THEN true ELSE false END as is_occupied").
		Joins("LEFT JOIN tickets ON tickets.seat_id = seats.id AND tickets.session_id = ? AND tickets.status != 'CANCELLED'", sessionID).
		Where("seats.room_id = ?", roomID).
		Find(&seats).Error

	if err != nil {
		return nil, err
	}

	return seats, nil
}

func (s *Store) ReserveSeats(userID, sessionID int, seatIDs []int) (*Transaction, error) {
	var transaction Transaction

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var session Session
		if err := tx.First(&session, sessionID).Error; err != nil {
			return errors.New("sessão não encontrada")
		}

		var validSeatsCount int64
		if err := tx.Model(&Seat{}).Where("id IN ? AND room_id = ?", seatIDs, session.RoomID).Count(&validSeatsCount).Error; err != nil {
			return err
		}
		if int(validSeatsCount) != len(seatIDs) {
			return errors.New("cadeira(s) inválida(s) detectada(s) ou não pertencem à esta sala")
		}

		var occupiedCount int64
		if err := tx.Model(&Ticket{}).Where("seat_id IN ? AND session_id = ? AND status != 'CANCELLED'", seatIDs, sessionID).Count(&occupiedCount).Error; err != nil {
			return err
		}
		if occupiedCount > 0 {
			return errors.New("uma ou mais cadeiras já foram compradas ou estão no carrinho de outra pessoa")
		}

		totalAmount := float64(len(seatIDs)) * session.Price
		transaction = Transaction{
			UserID:        userID,
			TotalAmount:   totalAmount,
			Status:        "PENDING",
			PaymentMethod: "NONE",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		for _, seatID := range seatIDs {
			ticket := Ticket{
				TransactionID: transaction.ID,
				SessionID:     sessionID,
				SeatID:        seatID,
				Status:        "PENDING",
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

func (s *Store) PayTransaction(transactionID int, method string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var transaction Transaction
		if err := tx.Where("id = ? AND status = 'PENDING'", transactionID).First(&transaction).Error; err != nil {
			return errors.New("transação pendente não encontrada")
		}

		transaction.Status = "PAID"
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

			ticket.Status = "PAID"
			ticket.QRCode = qrCode

			if err := tx.Save(&ticket).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) CancelTicket(ticketID int) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var ticket Ticket
		if err := tx.Where("id = ? AND status != 'CANCELLED'", ticketID).First(&ticket).Error; err != nil {
			return errors.New("transação pendente não encontrada")
		}

		ticket.Status = "CANCELLED"
		return tx.Save(&ticket).Error
	})
}
