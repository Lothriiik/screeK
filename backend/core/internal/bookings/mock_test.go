package bookings

import (
	"context"
	"net/http"

	"github.com/StartLivin/screek/backend/internal/bookings/infra/payment"
	"github.com/StartLivin/screek/backend/internal/cinema/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

type MockBookingsRepo struct {
	mock.Mock
}

func (m *MockBookingsRepo) GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Cinema), args.Error(1)
}

func (m *MockBookingsRepo) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]domain.Session, error) {
	args := m.Called(ctx, movieID, city, date)
	return args.Get(0).([]domain.Session), args.Error(1)
}

func (m *MockBookingsRepo) GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error) {
	args := m.Called(ctx, city, date)
	return args.Get(0).([]movies.Movie), args.Error(1)
}

func (m *MockBookingsRepo) GetSeatsBySession(ctx context.Context, sessionID int) ([]domain.Seat, error) {
	args := m.Called(ctx, sessionID)
	return args.Get(0).([]domain.Seat), args.Error(1)
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

func (m *MockBookingsRepo) PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error {
	args := m.Called(ctx, transactionID, userID, method, paymentID)
	return args.Error(0)
}

func (m *MockBookingsRepo) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	args := m.Called(ctx, ticketID, userID)
	return args.Error(0)
}

func (m *MockBookingsRepo) AdminCancelTicket(ctx context.Context, ticketID uuid.UUID) (*Ticket, error) {
	args := m.Called(ctx, ticketID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Ticket), args.Error(1)
}

func (m *MockBookingsRepo) GetTicketsBySession(ctx context.Context, sessionID int) ([]Ticket, error) {
	args := m.Called(ctx, sessionID)
	return args.Get(0).([]Ticket), args.Error(1)
}

func (m *MockBookingsRepo) GetSessionByID(ctx context.Context, sessionID int) (*domain.Session, error) {
	args := m.Called(ctx, sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Session), args.Error(1)
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

func (m *MockPayment) RefundPayment(ctx context.Context, paymentID string) error {
	args := m.Called(ctx, paymentID)
	return args.Error(0)
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

func (m *MockMailer) SendTicketEmail(ctx context.Context, to, userName, qrCode string) error {
	args := m.Called(ctx, to, userName, qrCode)
	return args.Error(0)
}

func (m *MockMailer) SendPasswordReset(ctx context.Context, to, token string) error {
	args := m.Called(ctx, to, token)
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
