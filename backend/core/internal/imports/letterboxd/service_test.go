package letterboxd

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockMatcher struct {
	mock.Mock
}

func (m *MockMatcher) MatchMovieByTitleAndYear(ctx context.Context, title string, year int) (*MatchedMovieSummary, error) {
	args := m.Called(ctx, title, year)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*MatchedMovieSummary), args.Error(1)
}

type MockCatalog struct {
	mock.Mock
}

func (m *MockCatalog) LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, rating float64, watched bool, liked bool) error {
	args := m.Called(ctx, userID, movieID, rating, watched, liked)
	return args.Error(0)
}

func (m *MockCatalog) AddToWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	args := m.Called(ctx, userID, movieID)
	return args.Error(0)
}

func TestImportService(t *testing.T) {
	matcher := new(MockMatcher)
	catalogSvc := new(MockCatalog)
	svc := NewService(matcher, catalogSvc)
	userID := uuid.New()

	t.Run("ImportWatchedCSV", func(t *testing.T) {
		csvData := "Date,Name,Year,Letterboxd URI\n2023-01-01,Inception,2010,http://lb.com/inception"
		reader := strings.NewReader(csvData)

		movie := &MatchedMovieSummary{ID: 1}
		matcher.On("MatchMovieByTitleAndYear", mock.Anything, "Inception", 2010).Return(movie, nil)
		catalogSvc.On("LogMovie", mock.Anything, userID, uint(1), 0.0, true, false).Return(nil)

		summary, err := svc.ImportWatchedCSV(context.Background(), userID, reader)
		assert.NoError(t, err)
		assert.Equal(t, 1, summary.Success)
		matcher.AssertExpectations(t)
		catalogSvc.AssertExpectations(t)
	})

	t.Run("ImportRatingsCSV", func(t *testing.T) {
		csvData := "Date,Name,Year,Letterboxd URI,Rating\n2023-01-01,Matrix,1999,http://lb.com/matrix,4.5"
		reader := strings.NewReader(csvData)

		movie := &MatchedMovieSummary{ID: 2}
		matcher.On("MatchMovieByTitleAndYear", mock.Anything, "Matrix", 1999).Return(movie, nil)
		catalogSvc.On("LogMovie", mock.Anything, userID, uint(2), 4.5, true, false).Return(nil)

		summary, err := svc.ImportRatingsCSV(context.Background(), userID, reader)
		assert.NoError(t, err)
		assert.Equal(t, 1, summary.Success)
		matcher.AssertExpectations(t)
		catalogSvc.AssertExpectations(t)
	})

	t.Run("ImportRatingsCSV ignora linha curta", func(t *testing.T) {
		csvData := "Date,Name\n2023-01-01,Inception"
		reader := strings.NewReader(csvData)

		summary, err := svc.ImportRatingsCSV(context.Background(), userID, reader)
		assert.NoError(t, err)
		assert.Equal(t, 1, summary.Total)
		assert.Equal(t, 1, summary.Failed)
		assert.Equal(t, 0, summary.Success)
	})

	t.Run("ImportWatchlistCSV", func(t *testing.T) {
		csvData := "Date,Name,Year,Letterboxd URI\n2023-01-01,Batman,2022,http://lb.com/batman"
		reader := strings.NewReader(csvData)

		movie := &MatchedMovieSummary{ID: 3}
		matcher.On("MatchMovieByTitleAndYear", mock.Anything, "Batman", 2022).Return(movie, nil)
		catalogSvc.On("AddToWatchlist", mock.Anything, userID, uint(3)).Return(nil)

		summary, err := svc.ImportWatchlistCSV(context.Background(), userID, reader)
		assert.NoError(t, err)
		assert.Equal(t, 1, summary.Success)
		matcher.AssertExpectations(t)
		catalogSvc.AssertExpectations(t)
	})
}
