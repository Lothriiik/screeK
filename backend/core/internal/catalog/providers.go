package catalog

import (
	"context"

	"github.com/google/uuid"
)

type UserProvider interface {
	IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error
}

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*MovieDetailSummary, error)
}
