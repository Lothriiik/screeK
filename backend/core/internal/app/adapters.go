package app

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/catalog"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type catalogMovieAdapter struct {
	svc *movies.MovieService
}

func (a *catalogMovieAdapter) GetMovieDetails(ctx context.Context, tmdbID int) (*catalog.MovieDetailSummary, error) {
	movie, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}

	return &catalog.MovieDetailSummary{
		ID:          movie.ID,
		TMDBID:      movie.TMDBID,
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		BackdropURL: movie.BackdropURL,
		ReleaseDate: movie.ReleaseDate,
		Runtime:     movie.Runtime,
	}, nil
}

type catalogUserAdapter struct {
	svc *users.UserService
}

func (a *catalogUserAdapter) IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	return a.svc.IncrementStats(ctx, userID, movies, minutes)
}
