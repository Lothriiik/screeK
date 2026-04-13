package movies

import (
	"context"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
)

type MoviesRepository interface {
	SaveMovie(ctx context.Context, movie *Movie) error
	GetMovieByTMDBID(ctx context.Context, tmdbID int) (*Movie, error)
	GetMovieByTitleAndYear(ctx context.Context, title string, year int) (*Movie, error)
	SaveMovieDetails(ctx context.Context, tmdbData *movietmdb.TMDBMovieDetails) (*Movie, error)
	GetPersonByTMDBID(ctx context.Context, tmdbID int) (*Person, error)
	SavePersonDetails(ctx context.Context, tmdbData *movietmdb.TMDBPersonDetails) (*Person, error)
	GetGenreName(ctx context.Context, genreID int) (string, error)
}

type TMDBService interface {
	SearchMovies(ctx context.Context, query string, year int) ([]movietmdb.TMDBMovie, error)
	GetMovieDetails(ctx context.Context, tmdbID int) (*movietmdb.TMDBMovieDetails, error)
	GetPersonDetails(ctx context.Context, id int) (*movietmdb.TMDBPersonDetails, error)
	GetPersonCredits(ctx context.Context, id int) (*movietmdb.TMDBPersonCredits, error)
	GetMoviesRecommendations(ctx context.Context, movieid int) ([]movietmdb.TMDBMovie, error)
	DiscoverMovies(ctx context.Context, genreID int, year int) ([]movietmdb.TMDBMovie, error)
	SearchPeople(ctx context.Context, query string) ([]movietmdb.TMDBPerson, error)
}
