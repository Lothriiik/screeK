package catalog

import (
	"context"

	"github.com/google/uuid"
)

type CatalogRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	AddToWatchlist(ctx context.Context, item *WatchlistItem) error
	RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error
	GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error)

	CreateMovieList(ctx context.Context, list *MovieList) error
	UpdateMovieList(ctx context.Context, list *MovieList) error
	GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error)
	GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error)
	AddMovieToList(ctx context.Context, listID uint, movieID uint) error
	RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error
	DeleteMovieList(ctx context.Context, listID uint) error
	SearchLists(ctx context.Context, query string) ([]MovieList, error)
	GetMovieStats(ctx context.Context, movieID uint) (*MovieStats, error)
	GetUserLogs(ctx context.Context, userID uuid.UUID) ([]MovieLog, error)
	GetMovieLog(ctx context.Context, userID uuid.UUID, movieID uint) (*MovieLog, error)
}
