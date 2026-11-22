package movies

import (
	"context"
	"fmt"
	"strings"
	"time"
	"unicode"

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
	tmdb       TMDBService
	store      MoviesRepository
	userSearch UserSearchProvider
	listSearch ListSearchProvider
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
		return nil, fmt.Errorf("falha ao buscar filmes no TMDB: %w", err)
	}

	var localMovies []Movie

	for _, tm := range tmdbMovies {
		parsedDate, _ := time.Parse("2006-01-02", tm.ReleaseDate)

		movie := Movie{
			TMDBID:           tm.ID,
			Title:            tm.Title,
			OriginalTitle:    tm.OriginalTitle,
			Overview:         tm.Overview,
			PosterURL:        imageURL(tm.PosterPath, "w500"),
			BackdropURL:      imageURL(tm.BackdropPath, "original"),
			ReleaseDate:      parsedDate,
			OriginalLanguage: tm.OriginalLanguage,
			VoteAverage:      tm.VoteAverage,
			VoteCount:        tm.VoteCount,
			Popularity:       tm.Popularity,
			Year:             parsedDate.Year(),
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
		return nil, fmt.Errorf("falha nos detalhes do filme no TMDB/store: %w", err)
	}

	savedMovie, err := s.store.SaveMovieDetails(ctx, tmdbDetails)
	if err != nil {
		return nil, err
	}
	return savedMovie, nil
}

func (s *MovieService) GetMovieByID(ctx context.Context, id int) (*Movie, error) {
	return s.store.GetMovieByID(ctx, id)
}

func (s *MovieService) MatchMovieByTitleAndYear(ctx context.Context, title string, year int) (*Movie, error) {
	if local, err := s.store.GetMovieByTitleAndYear(ctx, title, year); err == nil && local != nil {
		return local, nil
	}

	tmdbResults, err := s.tmdb.SearchMoviesByLanguage(ctx, title, year, "en-US")
	if err != nil {
		return nil, err
	}

	if len(tmdbResults) == 0 && year > 0 {
		tmdbResults, err = s.tmdb.SearchMoviesByLanguage(ctx, title, 0, "en-US")
		if err != nil {
			return nil, err
		}
	}

	best := pickBestMovieMatch(tmdbResults, title, year)
	if best == nil {
		return nil, ErrMovieMatchNotFound
	}

	return s.GetMovieDetails(ctx, best.ID)
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

func tmdbGenreName(id int) string {
	switch id {
	case 28:
		return "Ação"
	case 12:
		return "Aventura"
	case 16:
		return "Animação"
	case 35:
		return "Comédia"
	case 80:
		return "Crime"
	case 99:
		return "Documentário"
	case 18:
		return "Drama"
	case 10751:
		return "Família"
	case 14:
		return "Fantasia"
	case 36:
		return "História"
	case 27:
		return "Terror"
	case 10402:
		return "Música"
	case 9648:
		return "Mistério"
	case 10749:
		return "Romance"
	case 878:
		return "Ficção Científica"
	case 10770:
		return "Cinema TV"
	case 53:
		return "Thriller"
	case 10752:
		return "Guerra"
	case 37:
		return "Faroeste"
	default:
		return "Cinema"
	}
}

func (s *MovieService) DiscoverMovies(ctx context.Context, genreID int, year int, page int) ([]Movie, error) {
	tmdbMovies, err := s.tmdb.DiscoverMovies(ctx, genreID, year, page)
	if err != nil {
		return nil, err
	}

	var localMovies []Movie
	for _, tm := range tmdbMovies {
		parsedDate, _ := time.Parse("2006-01-02", tm.ReleaseDate)

		var genresList []Genre
		for _, gid := range tm.GenreIDs {
			genresList = append(genresList, Genre{TMDBID: gid, Name: tmdbGenreName(gid)})
		}

		movie := Movie{
			TMDBID:           tm.ID,
			Title:            tm.Title,
			OriginalTitle:    tm.OriginalTitle,
			Overview:         tm.Overview,
			PosterURL:        imageURL(tm.PosterPath, "w500"),
			BackdropURL:      imageURL(tm.BackdropPath, "original"),
			ReleaseDate:      parsedDate,
			OriginalLanguage: tm.OriginalLanguage,
			VoteAverage:      tm.VoteAverage,
			VoteCount:        tm.VoteCount,
			Popularity:       tm.Popularity,
			Year:             parsedDate.Year(),
			Genres:           genresList,
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

func imageURL(path, size string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http") {
		return path
	}
	return "https://image.tmdb.org/t/p/" + size + path
}

func parseReleaseYear(value string) int {
	if len(value) < 4 {
		return 0
	}
	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		return 0
	}
	return parsed.Year()
}

func normalizeTitle(value string) string {
	lower := strings.ToLower(strings.TrimSpace(value))
	return strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) {
			return r
		}
		return -1
	}, lower)
}

func matchScore(candidate movietmdb.TMDBMovie, title string, year int) int {
	query := normalizeTitle(title)
	candidateTitle := normalizeTitle(candidate.Title)
	candidateOriginal := normalizeTitle(candidate.OriginalTitle)

	score := 0
	switch {
	case candidateTitle == query || candidateOriginal == query:
		score += 100
	case strings.Contains(candidateTitle, query) || strings.Contains(query, candidateTitle):
		score += 40
	case strings.Contains(candidateOriginal, query) || strings.Contains(query, candidateOriginal):
		score += 40
	}

	if year > 0 {
		releaseYear := parseReleaseYear(candidate.ReleaseDate)
		if releaseYear > 0 {
			delta := absInt(releaseYear - year)
			switch {
			case delta == 0:
				score += 30
			case delta == 1:
				score += 20
			case delta == 2:
				score += 5
			}
		}
	}

	return score
}

func pickBestMovieMatch(candidates []movietmdb.TMDBMovie, title string, year int) *movietmdb.TMDBMovie {
	var best *movietmdb.TMDBMovie
	bestScore := 0

	for i := range candidates {
		score := matchScore(candidates[i], title, year)
		if score > bestScore || (score == bestScore && best != nil && candidates[i].Popularity > best.Popularity) {
			best = &candidates[i]
			bestScore = score
		}
	}

	if bestScore < 40 {
		return nil
	}
	return best
}

func absInt(value int) int {
	if value < 0 {
		return -value
	}
	return value
}
