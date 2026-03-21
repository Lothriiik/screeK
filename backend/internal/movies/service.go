package movies

import (
	"time"
)

type MovieService struct {
	tmdb  TMDBService
	store MoviesRepository
}

func NewService(tmdb TMDBService, store MoviesRepository) *MovieService {
	return &MovieService{
		tmdb:  tmdb,
		store: store,
	}
}

func (s *MovieService) SearchMovies(query string) ([]Movie, error) {
	tmdbMovies, err := s.tmdb.SearchMovies(query)
	if err != nil {
		return nil, err
	}

	var localMovies []Movie

	for _, tm := range tmdbMovies {
		parsedDate, _ := time.Parse("2006-01-02", tm.ReleaseDate)

		movie := Movie{
			TMDBID:      tm.ID,
			Title:       tm.Title,
			Overview:    tm.Overview,
			PosterURL:   "https://image.tmdb.org/t/p/w500" + tm.PosterPath,
			ReleaseDate: parsedDate,
		}

		_ = s.store.SaveMovie(&movie)
		localMovies = append(localMovies, movie)
	}

	return localMovies, nil
}

func (s *MovieService) GetMovieDetails(tmdbID int) (*Movie, error) {
	localMovie, err := s.store.GetMovieByTMDBID(tmdbID)
	if err == nil && localMovie != nil {
		return localMovie, nil
	}

	tmdbDetails, err := s.tmdb.GetMovieDetails(tmdbID)
	if err != nil {
		return nil, err
	}

	savedMovie, err := s.store.SaveMovieDetails(tmdbDetails)
	if err != nil {
		return nil, err
	}
	return savedMovie, nil
}

func (s *MovieService) GetPersonDetails(tmdbID int) (*Person, error) {
	localPerson, err := s.store.GetPersonByTMDBID(tmdbID)
	if err == nil && localPerson != nil {
		return localPerson, nil
	}

	tmdbDetails, err := s.tmdb.GetPersonDetails(tmdbID)
	if err != nil {
		return nil, err
	}

	savedPerson, err := s.store.SavePersonDetails(tmdbDetails)
	if err != nil {
		return nil, err
	}
	return savedPerson, nil
}

func (s *MovieService) GetPersonCredits(tmdbID int) ([]TMDBPersonMovieCast, error) {
	credits, err := s.tmdb.GetPersonCredits(tmdbID)
	if err != nil {
		return nil, err
	}
	return credits.Cast, nil
}

func (s *MovieService) GetMovieRecommendations(tmdbID int) ([]TMDBMovie, error) {
	return s.tmdb.GetMoviesRecommendations(tmdbID)
}
