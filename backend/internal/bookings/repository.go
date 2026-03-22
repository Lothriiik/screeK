package bookings

import (
	"context"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
)

type BookingsRepository interface {
	GetCinemaByID(id int) (*Cinema, error)
	GetSessionsByMovie(movieID int, city string, date string) ([]Session, error)
	GetMoviesPlaying(city string, date string) ([]movies.Movie, error)
	GetSeatsBySession(sessionID int) ([]Seat, error)
	CreateReservation(userID, sessionID int, seatIDs []int, totalAmount int) (*Transaction, error)
	PayTransaction(ctx context.Context, transactionID int, userID int, method string) error
	CancelTicket(ticketID int) error
	GetSessionByID(sessionID int) (*Session, error)
}