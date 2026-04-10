package movies

import (
	"context"
	"errors"
	"time"

	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
)

type UserSearchProvider interface {
	SearchUsers(ctx context.Context, query string) ([]UserSearchResult, error)
}

type ListSearchProvider interface {
	SearchLists(ctx context.Context, query string) ([]ListSearchResult, error)
}

type UserSearchResult struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type ListSearchResult struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Username    string `json:"username"`
}

type MovieService struct {
	tmdb         TMDBService
	store        MoviesRepository
	userSearch   UserSearchProvider
	listSearch   ListSearchProvider
}

func NewService(tmdb TMDBService, store MoviesRepository, userSearch UserSearchProvider, listSearch ListSearchProvider) *MovieService {
	return &MovieService{
		tmdb:       tmdb,
		store:      store,
		userSearch: userSearch,
		listSearch: listSearch,
	}
}

func (s *MovieService) SearchMovies(ctx context.Context, query string) ([]Movie, error) {
	tmdbMovies, err := s.tmdb.SearchMovies(ctx, query, 0)
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

		_ = s.store.SaveMovie(ctx, &movie)
		localMovies = append(localMovies, movie)
	}

	return localMovies, nil
}

func (s *MovieService) GetMovieDetails(ctx context.Context, tmdbID int) (*Movie, error) {
	localMovie, err := s.store.GetMovieByTMDBID(ctx, tmdbID)
	if err == nil && localMovie != nil {
		return localMovie, nil
	}

	tmdbDetails, err := s.tmdb.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}

	savedMovie, err := s.store.SaveMovieDetails(ctx, tmdbDetails)
	if err != nil {
		return nil, err
	}
	return savedMovie, nil
}

func (s *MovieService) MatchMovieByTitleAndYear(ctx context.Context, title string, year int) (*Movie, error) {
	if local, err := s.store.GetMovieByTitleAndYear(ctx, title, year); err == nil {
		return local, nil
	}

	tmdbResults, err := s.tmdb.SearchMovies(ctx, title, year)
	if err != nil || len(tmdbResults) == 0 {
		return nil, errors.New("filme não encontrado por título/ano")
	}

	return s.GetMovieDetails(ctx, tmdbResults[0].ID)
}

func (s *MovieService) GetPersonDetails(ctx context.Context, tmdbID int) (*Person, error) {
	localPerson, err := s.store.GetPersonByTMDBID(ctx, tmdbID)
	if err == nil && localPerson != nil {
		return localPerson, nil
	}

	tmdbDetails, err := s.tmdb.GetPersonDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}

	savedPerson, err := s.store.SavePersonDetails(ctx, tmdbDetails)
	if err != nil {
		return nil, err
	}
	return savedPerson, nil
}

func (s *MovieService) GetPersonCredits(ctx context.Context, tmdbID int) ([]movietmdb.TMDBPersonMovieCast, error) {
	credits, err := s.tmdb.GetPersonCredits(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return credits.Cast, nil
}

func (s *MovieService) GetMovieRecommendations(ctx context.Context, tmdbID int) ([]movietmdb.TMDBMovie, error) {
	return s.tmdb.GetMoviesRecommendations(ctx, tmdbID)
}

func (s *MovieService) DiscoverMovies(ctx context.Context, genreID int, year int) ([]Movie, error) {
	tmdbMovies, err := s.tmdb.DiscoverMovies(ctx, genreID, year)
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
		_ = s.store.SaveMovie(ctx, &movie)
		localMovies = append(localMovies, movie)
	}

	return localMovies, nil
}

func (s *MovieService) SearchPeople(ctx context.Context, query string) ([]movietmdb.TMDBPerson, error) {
	return s.tmdb.SearchPeople(ctx, query)
}

func (s *MovieService) SearchUsers(ctx context.Context, query string) ([]UserSearchResult, error) {
	if s.userSearch == nil {
		return nil, nil
	}
	return s.userSearch.SearchUsers(ctx, query)
}

func (s *MovieService) SearchLists(ctx context.Context, query string) ([]ListSearchResult, error) {
	if s.listSearch == nil {
		return nil, nil
	}
	return s.listSearch.SearchLists(ctx, query)
}

func (s *MovieService) GetGenreName(ctx context.Context, genreID int) (string, error) {
	return s.store.GetGenreName(ctx, genreID)
}
