package movies

import "context"

type MoviesRepository interface {
	SaveMovie(ctx context.Context, movie *Movie) error
	GetMovieByTMDBID(ctx context.Context, tmdbID int) (*Movie, error)
	SaveMovieDetails(ctx context.Context, tmdbData *TMDBMovieDetails) (*Movie, error)
	GetPersonByTMDBID(ctx context.Context, tmdbID int) (*Person, error)
	SavePersonDetails(ctx context.Context, tmdbData *TMDBPersonDetails) (*Person, error)
	GetGenreName(ctx context.Context, genreID int) (string, error)
}

type TMDBService interface {
	SearchMovies(ctx context.Context, query string) ([]TMDBMovie, error)
	GetMovieDetails(ctx context.Context, tmdbID int) (*TMDBMovieDetails, error)
	GetPersonDetails(ctx context.Context, id int) (*TMDBPersonDetails, error)
	GetPersonCredits(ctx context.Context, id int) (*TMDBPersonCredits, error)
	GetMoviesRecommendations(ctx context.Context, movieid int) ([]TMDBMovie, error)
	DiscoverMovies(ctx context.Context, genreID int, year int) ([]TMDBMovie, error)
	SearchPeople(ctx context.Context, query string) ([]TMDBPerson, error)
}
