package users

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

type MockUserRepo struct {
	mock.Mock
}

func (m *MockUserRepo) CreateUser(ctx context.Context, user *User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepo) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockUserRepo) SearchUsers(ctx context.Context, query string) ([]User, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]User), args.Error(1)
}

func (m *MockUserRepo) UpdateUser(ctx context.Context, user *User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepo) DeleteUser(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepo) AddFavorite(ctx context.Context, userID uuid.UUID, movieID int) error {
	args := m.Called(ctx, userID, movieID)
	return args.Error(0)
}

func (m *MockUserRepo) RemoveFavorite(ctx context.Context, userID uuid.UUID, movieID int) error {
	args := m.Called(ctx, userID, movieID)
	return args.Error(0)
}

func (m *MockUserRepo) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	args := m.Called(ctx, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockUserRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	args := m.Called(ctx, email)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserRepo) UsernameExists(ctx context.Context, username string) (bool, error) {
	args := m.Called(ctx, username)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserRepo) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockUserRepo) UpdateUserRole(ctx context.Context, userID uuid.UUID, role httputil.Role) error {
	args := m.Called(ctx, userID, role)
	return args.Error(0)
}

func (m *MockUserRepo) GetUserStats(ctx context.Context, userID uuid.UUID) (*UserStats, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*UserStats), args.Error(1)
}

func (m *MockUserRepo) UpdateUserStats(ctx context.Context, stats *UserStats) error {
	args := m.Called(ctx, stats)
	return args.Error(0)
}

func (m *MockUserRepo) IncrementUserStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	args := m.Called(ctx, userID, movies, minutes)
	return args.Error(0)
}

func (m *MockUserRepo) GetTopGenreByUsage(ctx context.Context, userID uuid.UUID) (*int, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*int), args.Error(1)
}

type MockMovieRepo struct {
	mock.Mock
}

func (m *MockMovieRepo) GetMovieByTMDBID(ctx context.Context, tmdbID int) (*movies.Movie, error) {
	args := m.Called(ctx, tmdbID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*movies.Movie), args.Error(1)
}
