package bookings

import (
	"context"
	"net/http"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

type MockBookingsRepo struct {
	mock.Mock
}

func (m *MockBookingsRepo) GetCinemaByID(ctx context.Context, id int) (*Cinema, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Cinema), args.Error(1)
}

func (m *MockBookingsRepo) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]Session, error) {
	args := m.Called(ctx, movieID, city, date)
	return args.Get(0).([]Session), args.Error(1)
}

func (m *MockBookingsRepo) GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error) {
	args := m.Called(ctx, city, date)
	return args.Get(0).([]movies.Movie), args.Error(1)
}

func (m *MockBookingsRepo) GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error) {
	args := m.Called(ctx, sessionID)
	return args.Get(0).([]Seat), args.Error(1)
}

func (m *MockBookingsRepo) CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, tickets []Ticket, totalAmount int) (*Transaction, error) {
	args := m.Called(ctx, userID, sessionID, tickets, totalAmount)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Transaction), args.Error(1)
}

func (m *MockBookingsRepo) GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*Transaction, error) {
	args := m.Called(ctx, transactionID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Transaction), args.Error(1)
}

func (m *MockBookingsRepo) PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error {
	args := m.Called(ctx, transactionID, userID, method)
	return args.Error(0)
}

func (m *MockBookingsRepo) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	args := m.Called(ctx, ticketID, userID)
	return args.Error(0)
}

func (m *MockBookingsRepo) GetSessionByID(ctx context.Context, sessionID int) (*Session, error) {
	args := m.Called(ctx, sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Session), args.Error(1)
}

func (m *MockBookingsRepo) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]Ticket, error) {
	args := m.Called(ctx, userID, status)
	return args.Get(0).([]Ticket), args.Error(1)
}

func (m *MockBookingsRepo) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*Ticket, error) {
	args := m.Called(ctx, ticketID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Ticket), args.Error(1)
}

func (m *MockBookingsRepo) CreateCinema(ctx context.Context, cinema *Cinema) error {
	args := m.Called(ctx, cinema)
	return args.Error(0)
}

func (m *MockBookingsRepo) CreateRoom(ctx context.Context, room *Room, seats []Seat) error {
	args := m.Called(ctx, room, seats)
	return args.Error(0)
}

func (m *MockBookingsRepo) CreateSession(ctx context.Context, session *Session) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockBookingsRepo) DeleteSession(ctx context.Context, sessionID int) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}

func (m *MockBookingsRepo) GetSessionsByRoom(ctx context.Context, roomID int, startTime time.Time) ([]Session, error) {
	args := m.Called(ctx, roomID, startTime)
	return args.Get(0).([]Session), args.Error(1)
}

func (m *MockBookingsRepo) GetRoomByID(ctx context.Context, roomID int) (*Room, error) {
	args := m.Called(ctx, roomID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Room), args.Error(1)
}

func (m *MockBookingsRepo) IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error) {
	args := m.Called(ctx, userID, cinemaID)
	return args.Bool(0), args.Error(1)
}

func (m *MockBookingsRepo) ListCinemas(ctx context.Context) ([]Cinema, error) {
	args := m.Called(ctx)
	return args.Get(0).([]Cinema), args.Error(1)
}

func (m *MockBookingsRepo) ListSessions(ctx context.Context, cinemaID int, date string) ([]Session, error) {
	args := m.Called(ctx, cinemaID, date)
	return args.Get(0).([]Session), args.Error(1)
}

func (m *MockBookingsRepo) GetSpecialStatusForMovies(ctx context.Context, city string, movieIDs []int) (map[int]map[string]bool, error) {
	args := m.Called(ctx, city, movieIDs)
	return args.Get(0).(map[int]map[string]bool), args.Error(1)
}

func (m *MockBookingsRepo) CleanupExpiredReservations(ctx context.Context) (int64, int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Get(1).(int64), args.Error(2)
}

type MockPayment struct {
	mock.Mock
}

func (m *MockPayment) CreatePayment(ctx context.Context, amount int, currency string, metadata map[string]string, idempotencyKey string) (*payment.PaymentResponse, error) {
	args := m.Called(ctx, amount, currency, metadata, idempotencyKey)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*payment.PaymentResponse), args.Error(1)
}

func (m *MockPayment) ParseWebhook(r *http.Request) (*payment.Event, error) {
	args := m.Called(r)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*payment.Event), args.Error(1)
}

type MockMailer struct {
	mock.Mock
}

func (m *MockMailer) SendTicketEmail(to, userName, qrCode string) error {
	args := m.Called(to, userName, qrCode)
	return args.Error(0)
}

func (m *MockMailer) SendPasswordReset(to, token string) error {
	args := m.Called(to, token)
	return args.Error(0)
}

type MockMovieProvider struct {
	mock.Mock
}

func (m *MockMovieProvider) GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error) {
	args := m.Called(ctx, tmdbID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*movies.Movie), args.Error(1)
}
