package bookings

import (
	"context"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
)

type BookingsRepository interface {
	GetCinemaByID(ctx context.Context, id int) (*Cinema, error)
	GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]Session, error)
	GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error)
	GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error)
	CreateReservation(ctx context.Context, userID, sessionID int, seatIDs []int, totalAmount int) (*Transaction, error)
	PayTransaction(ctx context.Context, transactionID int, userID int, method string) error
	CancelTicket(ctx context.Context, ticketID int, userID int) error
	GetSessionByID(ctx context.Context, sessionID int) (*Session, error)
	GetUserTickets(ctx context.Context, userID int, status string) ([]Ticket, error)
	GetTicketDetail(ctx context.Context, ticketID int, userID int) (*Ticket, error)
}