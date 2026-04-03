package movies

import (
	"context"

	"github.com/stretchr/testify/mock"
)

type MockMoviesRepo struct {
	mock.Mock
}

func (m *MockMoviesRepo) SaveMovie(ctx context.Context, movie *Movie) error {
	args := m.Called(ctx, movie)
	return args.Error(0)
}

func (m *MockMoviesRepo) GetMovieByTMDBID(ctx context.Context, tmdbID int) (*Movie, error) {
	args := m.Called(ctx, tmdbID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Movie), args.Error(1)
}

func (m *MockMoviesRepo) SaveMovieDetails(ctx context.Context, tmdbData *TMDBMovieDetails) (*Movie, error) {
	args := m.Called(ctx, tmdbData)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Movie), args.Error(1)
}

func (m *MockMoviesRepo) GetPersonByTMDBID(ctx context.Context, tmdbID int) (*Person, error) {
	args := m.Called(ctx, tmdbID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Person), args.Error(1)
}

func (m *MockMoviesRepo) SavePersonDetails(ctx context.Context, tmdbData *TMDBPersonDetails) (*Person, error) {
	args := m.Called(ctx, tmdbData)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Person), args.Error(1)
}

func (m *MockMoviesRepo) GetGenreName(ctx context.Context, genreID int) (string, error) {
	args := m.Called(ctx, genreID)
	return args.String(0), args.Error(1)
}

type MockTMDBService struct {
	mock.Mock
}

func (m *MockTMDBService) SearchMovies(ctx context.Context, query string) ([]TMDBMovie, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]TMDBMovie), args.Error(1)
}

func (m *MockTMDBService) GetMovieDetails(ctx context.Context, tmdbID int) (*TMDBMovieDetails, error) {
	args := m.Called(ctx, tmdbID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TMDBMovieDetails), args.Error(1)
}

func (m *MockTMDBService) GetPersonDetails(ctx context.Context, id int) (*TMDBPersonDetails, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TMDBPersonDetails), args.Error(1)
}

func (m *MockTMDBService) GetPersonCredits(ctx context.Context, id int) (*TMDBPersonCredits, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TMDBPersonCredits), args.Error(1)
}

func (m *MockTMDBService) GetMoviesRecommendations(ctx context.Context, movieID int) ([]TMDBMovie, error) {
	args := m.Called(ctx, movieID)
	return args.Get(0).([]TMDBMovie), args.Error(1)
}

func (m *MockTMDBService) DiscoverMovies(ctx context.Context, genreID int, year int) ([]TMDBMovie, error) {
	args := m.Called(ctx, genreID, year)
	return args.Get(0).([]TMDBMovie), args.Error(1)
}

func (m *MockTMDBService) SearchPeople(ctx context.Context, query string) ([]TMDBPerson, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]TMDBPerson), args.Error(1)
}

type MockUserSearchProvider struct {
	mock.Mock
}

func (m *MockUserSearchProvider) SearchUsers(ctx context.Context, query string) ([]UserSearchResult, error) {
	args := m.Called(ctx, query)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]UserSearchResult), args.Error(1)
}

type MockListSearchProvider struct {
	mock.Mock
}

func (m *MockListSearchProvider) SearchLists(ctx context.Context, query string) ([]ListSearchResult, error) {
	args := m.Called(ctx, query)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]ListSearchResult), args.Error(1)
}
