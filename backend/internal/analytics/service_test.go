package analytics

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type MockAnalyticsRepo struct {
	mock.Mock
}

func (m *MockAnalyticsRepo) GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]DailyCinemaStats, error) {
	args := m.Called(ctx, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]DailyCinemaStats), args.Error(1)
}

func (m *MockAnalyticsRepo) GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]DailyMovieStats, error) {
	args := m.Called(ctx, start, end, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]DailyMovieStats), args.Error(1)
}

func (m *MockAnalyticsRepo) GetGenreStats(ctx context.Context, start, end time.Time) (map[string]float64, error) {
	args := m.Called(ctx, start, end)
	return args.Get(0).(map[string]float64), args.Error(1)
}

func (m *MockAnalyticsRepo) GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStats, error) {
	args := m.Called(ctx, start, end, period)
	return args.Get(0).([]DailyCinemaStats), args.Error(1)
}

func (m *MockAnalyticsRepo) CalculateDailyStats(ctx context.Context, date time.Time) ([]DailyCinemaStats, error) {
	args := m.Called(ctx, date)
	return args.Get(0).([]DailyCinemaStats), args.Error(1)
}

func (m *MockAnalyticsRepo) UpsertDailyStats(ctx context.Context, stats []DailyCinemaStats) error {
	args := m.Called(ctx, stats)
	return args.Error(0)
}

func (m *MockAnalyticsRepo) CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]DailyMovieStats, error) {
	args := m.Called(ctx, date)
	return args.Get(0).([]DailyMovieStats), args.Error(1)
}

func (m *MockAnalyticsRepo) UpsertDailyMovieStats(ctx context.Context, stats []DailyMovieStats) error {
	args := m.Called(ctx, stats)
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

func TestGetAnalytics(t *testing.T) {
	repo := new(MockAnalyticsRepo)
	svc := NewService(repo, nil)

	start := time.Now().AddDate(0, 0, -7)
	end := time.Now()

	stats := []DailyCinemaStats{
		{
			TotalRevenue: 10000,
			TicketsSold:  10,
			Cinema:       domain.Cinema{Name: "Cine A"},
		},
	}

	repo.On("GetStatsByDateRange", mock.Anything, start, end).Return(stats, nil)

	result, err := svc.GetAnalytics(context.Background(), start, end)

	require.NoError(t, err)
	assert.Equal(t, 100.0, result.GlobalRevenue)
	assert.Equal(t, 10, result.GlobalTickets)
	assert.Len(t, result.StatsByCinema, 1)
}

func TestGetMovieAnalytics(t *testing.T) {
	repo := new(MockAnalyticsRepo)
	mp := new(MockMovieProvider)
	svc := NewService(repo, mp)

	start := time.Now().AddDate(0, 0, -7)
	end := time.Now()

	movieStats := []DailyMovieStats{
		{MovieID: 550, TotalRevenue: 5000, TicketsSold: 5},
	}

	repo.On("GetTopMoviesByDateRange", mock.Anything, start, end, 10).Return(movieStats, nil)
	mp.On("GetMovieDetails", mock.Anything, 550).Return(&movies.Movie{Title: "Fight Club"}, nil)

	result, err := svc.GetMovieAnalytics(context.Background(), start, end)

	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "Fight Club", result[0].MovieTitle)
	assert.Equal(t, 50.0, result[0].TotalRevenue)
}

func TestGetGenreAnalytics(t *testing.T) {
	repo := new(MockAnalyticsRepo)
	svc := NewService(repo, nil)

	genreMap := map[string]float64{
		"Action": 100.0,
		"Drama":  200.0,
	}

	repo.On("GetGenreStats", mock.Anything, mock.Anything, mock.Anything).Return(genreMap, nil)

	result, err := svc.GetGenreAnalytics(context.Background(), time.Now(), time.Now())

	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Drama", result[0].GenreName) 
}

func TestRunAnalyticsAggregation(t *testing.T) {
	repo := new(MockAnalyticsRepo)
	svc := NewService(repo, nil)

	date := time.Now()

	repo.On("CalculateDailyStats", mock.Anything, date).Return([]DailyCinemaStats{}, nil)
	repo.On("UpsertDailyStats", mock.Anything, mock.Anything).Return(nil)
	repo.On("CalculateDailyMovieStats", mock.Anything, date).Return([]DailyMovieStats{}, nil)
	repo.On("UpsertDailyMovieStats", mock.Anything, mock.Anything).Return(nil)

	err := svc.RunAnalyticsAggregation(context.Background(), date)

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func TestGetMovieAnalytics_Error(t *testing.T) {
	repo := new(MockAnalyticsRepo)
	svc := NewService(repo, nil)

	repo.On("GetTopMoviesByDateRange", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("db error"))

	_, err := svc.GetMovieAnalytics(context.Background(), time.Now(), time.Now())

	assert.Error(t, err)
}
