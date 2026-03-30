package bookings

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
)

type BookingsRepository interface {
	GetCinemaByID(ctx context.Context, id int) (*Cinema, error)
	GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]Session, error)
	GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error)
	GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error)
	CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, tickets []Ticket, totalAmount int) (*Transaction, error)
	GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*Transaction, error)
	PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error
	CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error
	GetSessionByID(ctx context.Context, sessionID int) (*Session, error)
	GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]Ticket, error)
	GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*Ticket, error)

	CreateCinema(ctx context.Context, cinema *Cinema) error
	CreateRoom(ctx context.Context, room *Room, seats []Seat) error
	CreateSession(ctx context.Context, session *Session) error
	DeleteSession(ctx context.Context, sessionID int) error
	GetSessionsByRoom(ctx context.Context, roomID int, startTime time.Time) ([]Session, error)
	GetRoomByID(ctx context.Context, roomID int) (*Room, error)
	IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error)

	ListCinemas(ctx context.Context) ([]Cinema, error)
	ListSessions(ctx context.Context, cinemaID int, date string) ([]Session, error)
}

type AnalyticsRepository interface {
	CalculateDailyStats(ctx context.Context, date time.Time) ([]DailyCinemaStats, error)
	UpsertDailyStats(ctx context.Context, stats []DailyCinemaStats) error
	GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]DailyCinemaStats, error)

	CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]DailyMovieStats, error)
	UpsertDailyMovieStats(ctx context.Context, stats []DailyMovieStats) error
	
	GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]DailyMovieStats, error)
	GetGenreStats(ctx context.Context, start, end time.Time) (map[string]float64, error)
	GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStats, error)
}
