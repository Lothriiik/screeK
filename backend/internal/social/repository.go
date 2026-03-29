package social

import (
	"context"

	"github.com/google/uuid"
)

type SocialRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	
	// CRUD de Posts
	CreatePost(ctx context.Context, post *Post) error
	GetPostByID(ctx context.Context, postID uint) (*Post, error)
	UpdatePost(ctx context.Context, post *Post) error
	DeletePost(ctx context.Context, postID uint) error

	// Feeds
	GetGlobalFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error)
	GetFollowingFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) ([]Post, error)
	
	// Interações
	ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error)

	// Watchlist & MovieLists (Novo)
	AddToWatchlist(ctx context.Context, item *WatchlistItem) error
	RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error
	GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error)
	
	CreateMovieList(ctx context.Context, list *MovieList) error
	GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error)
	GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error)
	AddMovieToList(ctx context.Context, listID uint, movieID uint) error
	RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error
	DeleteMovieList(ctx context.Context, listID uint) error
}