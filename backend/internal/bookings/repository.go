package bookings

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
)

type BookingsRepository interface {
	GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error)
	GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]domain.Session, error)
	GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error)
	GetSeatsBySession(ctx context.Context, sessionID int) ([]domain.Seat, error)
	CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, tickets []Ticket, totalAmount int) (*Transaction, error)
	GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*Transaction, error)
	PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error
	CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error
	GetSessionByID(ctx context.Context, sessionID int) (*domain.Session, error)
	GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]Ticket, error)
	GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*Ticket, error)
	GetSpecialStatusForMovies(ctx context.Context, city string, movieIDs []int) (map[int]map[string]bool, error)
	CleanupExpiredReservations(ctx context.Context) (int64, int64, error)
}
