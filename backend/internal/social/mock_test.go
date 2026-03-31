package social

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

type MockSocialRepo struct {
	mock.Mock
}

func (m *MockSocialRepo) UpsertMovieLog(ctx context.Context, log *MovieLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockSocialRepo) CreatePost(ctx context.Context, post *Post) error {
	args := m.Called(ctx, post)
	return args.Error(0)
}

func (m *MockSocialRepo) GetPostByID(ctx context.Context, postID uint) (*Post, error) {
	args := m.Called(ctx, postID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Post), args.Error(1)
}

func (m *MockSocialRepo) UpdatePost(ctx context.Context, post *Post) error {
	args := m.Called(ctx, post)
	return args.Error(0)
}

func (m *MockSocialRepo) DeletePost(ctx context.Context, postID uint) error {
	args := m.Called(ctx, postID)
	return args.Error(0)
}

func (m *MockSocialRepo) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error) {
	args := m.Called(ctx, cursorID, limit)
	return args.Get(0).([]Post), args.Error(1)
}

func (m *MockSocialRepo) GetFollowingFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) ([]Post, error) {
	args := m.Called(ctx, userID, cursorID, limit)
	return args.Get(0).([]Post), args.Error(1)
}

func (m *MockSocialRepo) ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error {
	args := m.Called(ctx, userID, parentID, content)
	return args.Error(0)
}

func (m *MockSocialRepo) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	args := m.Called(ctx, userID, postID)
	return args.Bool(0), args.Error(1)
}

func (m *MockSocialRepo) ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error) {
	args := m.Called(ctx, followerID, followeeID)
	return args.Bool(0), args.Error(1)
}

func (m *MockSocialRepo) AddToWatchlist(ctx context.Context, item *WatchlistItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockSocialRepo) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	args := m.Called(ctx, userID, movieID)
	return args.Error(0)
}

func (m *MockSocialRepo) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]WatchlistItem), args.Error(1)
}

func (m *MockSocialRepo) CreateMovieList(ctx context.Context, list *MovieList) error {
	args := m.Called(ctx, list)
	return args.Error(0)
}

func (m *MockSocialRepo) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]MovieList), args.Error(1)
}

func (m *MockSocialRepo) GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error) {
	args := m.Called(ctx, listID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*MovieList), args.Error(1)
}

func (m *MockSocialRepo) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	args := m.Called(ctx, listID, movieID)
	return args.Error(0)
}

func (m *MockSocialRepo) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	args := m.Called(ctx, listID, movieID)
	return args.Error(0)
}

func (m *MockSocialRepo) DeleteMovieList(ctx context.Context, listID uint) error {
	args := m.Called(ctx, listID)
	return args.Error(0)
}

type MockUserProvider struct {
	mock.Mock
}

func (m *MockUserProvider) GetIDByUsername(ctx context.Context, username string) (uuid.UUID, error) {
	args := m.Called(ctx, username)
	return args.Get(0).(uuid.UUID), args.Error(1)
}

func (m *MockUserProvider) GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

type MockNotificationService struct {
	mock.Mock
}

func (m *MockNotificationService) Notify(ctx context.Context, userID uuid.UUID, nType, title, message, link string) error {
	args := m.Called(ctx, userID, nType, title, message, link)
	return args.Error(0)
}
