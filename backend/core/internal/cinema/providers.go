package cinema

import (
	"context"
)

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*MovieDetailSummary, error)
}
