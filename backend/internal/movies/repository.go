package movies

type MoviesRepository interface {
	SaveMovie(movie *Movie) error
	GetMovieByTMDBID(tmdbID int) (*Movie, error)
	SaveMovieDetails(tmdbData *TMDBMovieDetails) (*Movie, error)
}

type TMDBService interface {
	SearchMovies(query string) ([]TMDBMovie, error)
	GetMovieDetails(tmdbID int) (*TMDBMovieDetails, error)
}
