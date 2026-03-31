package bookings

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	redisclient "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockRedis struct {
	mock.Mock
}

func (m *MockRedis) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redisclient.BoolCmd {
	args := m.Called(ctx, key, value, expiration)
	return redisclient.NewBoolResult(args.Bool(0), args.Error(1))
}

func (m *MockRedis) Del(ctx context.Context, keys ...string) *redisclient.IntCmd {
	args := m.Called(ctx, keys)
	return redisclient.NewIntResult(int64(args.Int(0)), args.Error(1))
}

func (m *MockRedis) Val() bool {
	return true
}

func newTestbookingsService() (*bookingsService, *MockBookingsRepo, *MockPayment, *MockMovieProvider, *MockRedis) {
	repo := new(MockBookingsRepo)
	pay := new(MockPayment)
	movieProv := new(MockMovieProvider)
	redis := new(MockRedis)
	svc := NewService(repo, redis, pay, nil, movieProv)
	return svc.(*bookingsService), repo, pay, movieProv, redis
}



func Test_deve_listar_filmes_em_cartaz_com_status_especial(t *testing.T) {
	svc, repo, _, _, _ := newTestbookingsService()

	repo.On("GetMoviesPlaying", mock.Anything, "São Paulo", "2026-03-30").Return([]movies.Movie{
		{ID: 1, TMDBID: 550, Title: "Fight Club", PosterURL: "/fc.jpg"},
		{ID: 2, TMDBID: 27205, Title: "Inception", PosterURL: "/inc.jpg"},
	}, nil)
	repo.On("GetSpecialStatusForMovies", mock.Anything, "São Paulo", []int{1, 2}).Return(map[int]map[string]bool{
		1: {"premiere": true, "rescreening": false},
		2: {"premiere": false, "rescreening": true},
	}, nil)

	moviesDTO, err := svc.GetMoviesPlaying(context.Background(), "São Paulo", "2026-03-30")

	assert.NoError(t, err)
	assert.Len(t, moviesDTO, 2)
	assert.True(t, moviesDTO[0].IsPremiere)
	assert.False(t, moviesDTO[0].IsRescreening)
	assert.False(t, moviesDTO[1].IsPremiere)
	assert.True(t, moviesDTO[1].IsRescreening)
}



func Test_ReserveSeats_Rollback_Em_Falha_Parcial(t *testing.T) {
	svc, _, _, _, redis := newTestbookingsService()
	userID := uuid.New()
	sessionID := 1
	ticketsReq := []TicketRequest{
		{SeatID: 1, Type: "STANDARD"},
		{SeatID: 2, Type: "STANDARD"},
	}

	redis.On("SetNX", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(true, nil).Once()
	redis.On("SetNX", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(false, nil).Once()
	redis.On("Del", mock.Anything, mock.Anything).Return(1, nil).Once()

	_, err := svc.ReserveSeats(context.Background(), userID, sessionID, ticketsReq)

	assert.ErrorIs(t, err, ErrSeatLockFailed)
	redis.AssertExpectations(t)
}

func Test_PayReservation_Consistency(t *testing.T) {
	svc, repo, pay, _, _ := newTestbookingsService()
	userID := uuid.New()
	txID := uuid.New()

	repo.On("GetTransactionByID", mock.Anything, mock.Anything, mock.Anything).Return(&Transaction{
		ID: txID, UserID: userID, Status: "PENDING", TotalAmount: 5000,
	}, nil)

	pay.On("CreatePayment", mock.Anything, 5000, "brl", mock.Anything, "idem-123").Return(nil, errors.New("stripe error"))

	_, err := svc.PayReservation(context.Background(), txID, userID, "card", "idem-123")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "falha na conexão com meio de pagamento")
}

func Test_PriceCalculation_Exactness(t *testing.T) {
	svc, repo, _, _, redis := newTestbookingsService()
	userID := uuid.New()
	sessionID := 10
	roomID := 101

	repo.On("GetSessionByID", mock.Anything, sessionID).Return(&Session{
		ID: sessionID, RoomID: roomID, Price: 2999, 
		Room: Room{Type: RoomTypeVIP},
	}, nil)

	ticketsReq := []TicketRequest{
		{SeatID: 1, Type: TicketTypeHalf}, 
	}

	redis.On("SetNX", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(true, nil)
	repo.On("CreateReservation", mock.Anything, mock.Anything, sessionID, mock.Anything, 2249).Return(&Transaction{TotalAmount: 2249}, nil)

	tx, err := svc.ReserveSeats(context.Background(), userID, sessionID, ticketsReq)

	assert.NoError(t, err)
	assert.Equal(t, 2249, tx.TotalAmount) 
}

func Test_CreateSession_Isolamento_Gerente(t *testing.T) {
	svc, repo, _, _, _ := newTestbookingsService()
	adminID := uuid.New()
	req := CreateSessionRequest{
		MovieID: 101,
		RoomID: 50,
		StartTime: time.Now().Add(24 * time.Hour),
		Price: 3000,
		SessionType: "REGULAR",
	}

	repo.On("GetRoomByID", mock.Anything, 50).Return(&Room{ID: 50, CinemaID: 99}, nil)
	repo.On("IsManagerOfCinema", mock.Anything, adminID, 99).Return(false, nil) 

	err := svc.CreateSession(context.Background(), adminID, req)

	assert.ErrorIs(t, err, ErrNotCinemaManager)
}
