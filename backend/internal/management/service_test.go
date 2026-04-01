package management

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockManagementRepo struct {
	mock.Mock
}

func (m *MockManagementRepo) CreateCinema(ctx context.Context, cinema *domain.Cinema) error {
	args := m.Called(ctx, cinema)
	return args.Error(0)
}

func (m *MockManagementRepo) GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*domain.Cinema), args.Error(1)
}

func (m *MockManagementRepo) ListCinemas(ctx context.Context) ([]domain.Cinema, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Cinema), args.Error(1)
}

func (m *MockManagementRepo) CreateRoom(ctx context.Context, room *domain.Room, seats []domain.Seat) error {
	args := m.Called(ctx, room, seats)
	return args.Error(0)
}

func (m *MockManagementRepo) GetRoomByID(ctx context.Context, id int) (*domain.Room, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Room), args.Error(1)
}

func (m *MockManagementRepo) CreateSession(ctx context.Context, session *domain.Session) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockManagementRepo) ListSessions(ctx context.Context, cinemaID int, date string) ([]domain.Session, error) {
	args := m.Called(ctx, cinemaID, date)
	return args.Get(0).([]domain.Session), args.Error(1)
}

func (m *MockManagementRepo) GetSessionsByRoom(ctx context.Context, roomID int, date time.Time) ([]domain.Session, error) {
	args := m.Called(ctx, roomID, date)
	return args.Get(0).([]domain.Session), args.Error(1)
}

func (m *MockManagementRepo) IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error) {
	args := m.Called(ctx, userID, cinemaID)
	return args.Bool(0), args.Error(1)
}

func (m *MockManagementRepo) GetSession(ctx context.Context, sessionID int) (*domain.Session, error) {
	args := m.Called(ctx, sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Session), args.Error(1)
}

func (m *MockManagementRepo) DeleteSession(ctx context.Context, sessionID int) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}

func (m *MockManagementRepo) GetSessionBookingsCount(ctx context.Context, sessionID int) (int, error) {
	args := m.Called(ctx, sessionID)
	return args.Int(0), args.Error(1)
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

func TestCreateRoom_SeatMapGeneration(t *testing.T) {
	repo := new(MockManagementRepo)
	svc := NewService(repo, nil)

	req := CreateRoomRequest{
		CinemaID: 1,
		Name:     "Sala VIP",
		Capacity: 25,
		Type:     "VIP",
	}

	repo.On("CreateRoom", mock.Anything, mock.MatchedBy(func(r *domain.Room) bool {
		return r.Name == "Sala VIP" && r.Capacity == 25
	}), mock.MatchedBy(func(seats []domain.Seat) bool {
		return len(seats) == 25 && seats[0].Row == "A" && seats[10].Row == "B" 
	})).Return(nil)

	err := svc.CreateRoom(context.Background(), req)
	assert.NoError(t, err)
}

func TestCreateSession_OverlapDetection(t *testing.T) {
	repo := new(MockManagementRepo)
	mp := new(MockMovieProvider)
	svc := NewService(repo, mp)

	userID := uuid.New()
	roomID := 1
	movieID := 550
	startTime := time.Now().Add(2 * time.Hour)

	repo.On("GetRoomByID", mock.Anything, roomID).Return(&domain.Room{ID: roomID, CinemaID: 1}, nil)
	repo.On("IsManagerOfCinema", mock.Anything, userID, 1).Return(true, nil)
	
	mp.On("GetMovieDetails", mock.Anything, movieID).Return(&movies.Movie{ID: movieID, Runtime: 120}, nil)

	existing := []domain.Session{
		{
			StartTime: startTime.Add(-30 * time.Minute), 
			Movie:     movies.Movie{Runtime: 120}, 
		},
	}
	repo.On("GetSessionsByRoom", mock.Anything, roomID, startTime).Return(existing, nil)

	req := CreateSessionRequest{
		MovieID:     movieID,
		RoomID:      roomID,
		StartTime:   startTime,
		Price:       1500,
		SessionType: "REGULAR",
	}

	err := svc.CreateSession(context.Background(), userID, req)

	assert.Error(t, err)
	assert.Equal(t, ErrSessionOverlap, err)
}

func TestCreateSession_ManagerCheck(t *testing.T) {
	repo := new(MockManagementRepo)
	svc := NewService(repo, nil)

	userID := uuid.New()
	repo.On("GetRoomByID", mock.Anything, 1).Return(&domain.Room{ID: 1, CinemaID: 1}, nil)
	repo.On("IsManagerOfCinema", mock.Anything, userID, 1).Return(false, nil)

	req := CreateSessionRequest{
		MovieID:     123,
		RoomID:      1,
		StartTime:   time.Now().Add(1 * time.Hour),
		Price:       1000,
		SessionType: "REGULAR",
	}
	err := svc.CreateSession(context.Background(), userID, req)

	assert.Error(t, err)
	assert.Equal(t, ErrNotCinemaManager, err)
}

func TestDeleteSession_Integrity(t *testing.T) {
	repo := new(MockManagementRepo)
	svc := NewService(repo, nil)
	userID := uuid.New()
	sessionID := 10

	repo.On("GetSession", mock.Anything, sessionID).Return(&domain.Session{ID: sessionID, RoomID: 1}, nil)
	repo.On("GetRoomByID", mock.Anything, 1).Return(&domain.Room{ID: 1, CinemaID: 1}, nil)
	repo.On("IsManagerOfCinema", mock.Anything, userID, 1).Return(true, nil)

	t.Run("Erro se houver reservas", func(t *testing.T) {
		repo.On("GetSessionBookingsCount", mock.Anything, sessionID).Return(5, nil).Once()
		
		err := svc.DeleteSession(context.Background(), userID, sessionID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "ingressos vendidos")
	})

	t.Run("Sucesso se estiver vazia", func(t *testing.T) {
		repo.On("GetSessionBookingsCount", mock.Anything, sessionID).Return(0, nil).Once()
		repo.On("DeleteSession", mock.Anything, sessionID).Return(nil)

		err := svc.DeleteSession(context.Background(), userID, sessionID)
		assert.NoError(t, err)
	})
}
