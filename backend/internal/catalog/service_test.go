package catalog

import (
	"context"
	"testing"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type MockCatalogRepo struct {
	mock.Mock
}

func (m *MockCatalogRepo) UpsertMovieLog(ctx context.Context, log *MovieLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockCatalogRepo) AddToWatchlist(ctx context.Context, item *WatchlistItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockCatalogRepo) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	args := m.Called(ctx, userID, movieID)
	return args.Error(0)
}

func (m *MockCatalogRepo) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]WatchlistItem), args.Error(1)
}

func (m *MockCatalogRepo) CreateMovieList(ctx context.Context, list *MovieList) error {
	args := m.Called(ctx, list)
	return args.Error(0)
}

func (m *MockCatalogRepo) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]MovieList), args.Error(1)
}

func (m *MockCatalogRepo) GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error) {
	args := m.Called(ctx, listID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*MovieList), args.Error(1)
}

func (m *MockCatalogRepo) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	args := m.Called(ctx, listID, movieID)
	return args.Error(0)
}

func (m *MockCatalogRepo) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	args := m.Called(ctx, listID, movieID)
	return args.Error(0)
}

func (m *MockCatalogRepo) DeleteMovieList(ctx context.Context, listID uint) error {
	args := m.Called(ctx, listID)
	return args.Error(0)
}

func (m *MockCatalogRepo) SearchLists(ctx context.Context, query string) ([]MovieList, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]MovieList), args.Error(1)
}

type MockUserProvider struct {
	mock.Mock
}

func (m *MockUserProvider) GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserProvider) IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	args := m.Called(ctx, userID, movies, minutes)
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

func TestLogMovie_WithGamification(t *testing.T) {
	repo := new(MockCatalogRepo)
	up := new(MockUserProvider)
	mp := new(MockMovieProvider)
	svc := NewService(repo, up, mp)

	userID := uuid.New()
	movieID := uint(550)
	req := LogMovieRequest{Watched: true, Rating: 4.5, Liked: true}

	repo.On("UpsertMovieLog", mock.Anything, mock.AnythingOfType("*catalog.MovieLog")).Return(nil)
	mp.On("GetMovieDetails", mock.Anything, 550).Return(&movies.Movie{Runtime: 120}, nil)
	up.On("IncrementStats", mock.Anything, userID, 1, 120).Return(nil)

	err := svc.LogMovie(context.Background(), userID, movieID, req)

	require.NoError(t, err)
	repo.AssertExpectations(t)
	up.AssertExpectations(t)
}

func TestMovieList_Permissions(t *testing.T) {
	repo := new(MockCatalogRepo)
	svc := NewService(repo, nil, nil)

	userID := uuid.New()
	otherUserID := uuid.New()
	listID := uint(1)

	repo.On("GetMovieListByID", mock.Anything, listID).Return(&MovieList{ID: listID, UserID: otherUserID}, nil)

	err := svc.AddMovieToList(context.Background(), userID, listID, 123)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permissão")

	err = svc.DeleteMovieList(context.Background(), userID, listID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permissão")
}

func TestAddToWatchlist(t *testing.T) {
	repo := new(MockCatalogRepo)
	svc := NewService(repo, nil, nil)

	userID := uuid.New()
	movieID := uint(123)

	repo.On("AddToWatchlist", mock.Anything, mock.MatchedBy(func(item *WatchlistItem) bool {
		return item.UserID == userID && item.MovieID == movieID
	})).Return(nil)

	err := svc.AddToWatchlist(context.Background(), userID, movieID)
	assert.NoError(t, err)
}

func TestLogMovie_InvalidRating(t *testing.T) {
	svc := NewService(nil, nil, nil)
	req := LogMovieRequest{Watched: true, Rating: 11.0}

	err := svc.LogMovie(context.Background(), uuid.New(), 1, req)
	assert.Error(t, err)
}

func TestGetMovieListDetail_Privacy(t *testing.T) {
	repo := new(MockCatalogRepo)
	svc := NewService(repo, nil, nil)

	ownerID := uuid.New()
	strangerID := uuid.New()
	listID := uint(1)

	t.Run("Deve permitir acesso a lista pública por qualquer um", func(t *testing.T) {
		repo.On("GetMovieListByID", mock.Anything, listID).Return(&MovieList{ID: listID, UserID: ownerID, IsPublic: true}, nil).Once()
		list, err := svc.GetMovieListDetail(context.Background(), listID, strangerID)
		assert.NoError(t, err)
		assert.NotNil(t, list)
	})

	t.Run("Deve negar acesso a lista privada por estranho", func(t *testing.T) {
		repo.On("GetMovieListByID", mock.Anything, listID).Return(&MovieList{ID: listID, UserID: ownerID, IsPublic: false}, nil).Once()
		list, err := svc.GetMovieListDetail(context.Background(), listID, strangerID)
		assert.Error(t, err)
		assert.Nil(t, list)
		assert.Contains(t, err.Error(), "privada")
	})

	t.Run("Deve permitir acesso a lista privada pelo dono", func(t *testing.T) {
		repo.On("GetMovieListByID", mock.Anything, listID).Return(&MovieList{ID: listID, UserID: ownerID, IsPublic: false}, nil).Once()
		list, err := svc.GetMovieListDetail(context.Background(), listID, ownerID)
		assert.NoError(t, err)
		assert.NotNil(t, list)
	})
}
