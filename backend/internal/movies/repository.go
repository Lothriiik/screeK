package movies

type MoviesRepository interface {
	SaveMovie(movie *Movie) error
	GetMovieByTMDBID(tmdbID int) (*Movie, error)
	SaveMovieDetails(tmdbData *TMDBMovieDetails) (*Movie, error)
	GetPersonByTMDBID(tmdbID int) (*Person, error)
	SavePersonDetails(tmdbData *TMDBPersonDetails) (*Person, error)
}

type TMDBService interface {
	SearchMovies(query string) ([]TMDBMovie, error)
	GetMovieDetails(tmdbID int) (*TMDBMovieDetails, error)
	GetPersonDetails(id int) (*TMDBPersonDetails, error)
	GetPersonCredits(id int) (*TMDBPersonCredits, error)
	GetMoviesRecommendations(movieid int) ([]TMDBMovie, error)
}
