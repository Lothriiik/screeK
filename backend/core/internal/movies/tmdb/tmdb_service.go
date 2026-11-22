package tmdb

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"github.com/sony/gobreaker"
)

type TMDBClient struct {
	token      string
	httpClient *http.Client
	cb         *gobreaker.CircuitBreaker
	BaseURL    string
}

func NewTMDBClient(token string) *TMDBClient {
	st := gobreaker.Settings{
		Name:        "TMDB-API",
		MaxRequests: 1,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures > 5
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			slog.Warn("Circuit Breaker alterou estado",
				"name", name,
				"from", from.String(),
				"to", to.String(),
			)
		},
	}

	return &TMDBClient{
		token:      token,
		httpClient: &http.Client{Timeout: 10 * time.Second},
		cb:         gobreaker.NewCircuitBreaker(st),
		BaseURL:    "https://api.themoviedb.org/3",
	}
}

type TMDBResponse struct {
	Results []TMDBMovie `json:"results"`
}

type TMDBMovie struct {
	ID               int     `json:"id"`
	Title            string  `json:"title"`
	OriginalTitle    string  `json:"original_title"`
	Overview         string  `json:"overview"`
	PosterPath       string  `json:"poster_path"`
	BackdropPath     string  `json:"backdrop_path"`
	ReleaseDate      string  `json:"release_date"`
	OriginalLanguage string  `json:"original_language"`
	VoteAverage      float64 `json:"vote_average"`
	VoteCount        int     `json:"vote_count"`
	Popularity       float64 `json:"popularity"`
	GenreIDs         []int   `json:"genre_ids"`
}

type TMDBPerson struct {
	ID                 int         `json:"id"`
	Name               string      `json:"name"`
	ProfilePath        string      `json:"profile_path"`
	KnownForDepartment string      `json:"known_for_department"`
	KnownFor           []TMDBMovie `json:"known_for"`
}

type TMDBPeopleResponse struct {
	Results []TMDBPerson `json:"results"`
}

type TMDBMovieDetails struct {
	ID                  int                  `json:"id"`
	Title               string               `json:"title"`
	OriginalTitle       string               `json:"original_title"`
	Overview            string               `json:"overview"`
	PosterPath          string               `json:"poster_path"`
	BackdropPath        string               `json:"backdrop_path"`
	ReleaseDate         string               `json:"release_date"`
	Runtime             int                  `json:"runtime"`
	Status              string               `json:"status"`
	OriginalLanguage    string               `json:"original_language"`
	SpokenLanguages     []TMDBSpokenLanguage `json:"spoken_languages"`
	Genres              []TMDBGenre          `json:"genres"`
	Credits             TMDBMovieCredits     `json:"credits"`
	Budget              int64                `json:"budget"`
	Revenue             int64                `json:"revenue"`
	VoteAverage         float64              `json:"vote_average"`
	VoteCount           int                  `json:"vote_count"`
	Popularity          float64              `json:"popularity"`
	ProductionCompanies []TMDBCompany        `json:"production_companies"`
	ProductionCountries []TMDBCountry        `json:"production_countries"`
	Keywords            TMDBKeywords         `json:"keywords"`
	ReleaseDates        TMDBReleaseDates     `json:"release_dates"`
}

type TMDBCompany struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TMDBCountry struct {
	ISO3166_1 string `json:"iso_3166_1"`
	Name      string `json:"name"`
}

type TMDBKeywords struct {
	Keywords []TMDBKeyword `json:"keywords"`
}

type TMDBKeyword struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TMDBReleaseDates struct {
	Results []TMDBReleaseDateResult `json:"results"`
}

type TMDBReleaseDateResult struct {
	ISO3166_1    string            `json:"iso_3166_1"`
	ReleaseDates []TMDBReleaseDate `json:"release_dates"`
}

type TMDBReleaseDate struct {
	Certification string `json:"certification"`
	Type          int    `json:"type"`
}

type TMDBGenre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TMDBSpokenLanguage struct {
	EnglishName string `json:"english_name"`
	ISO639_1    string `json:"iso_639_1"`
	Name        string `json:"name"`
}

type TMDBMovieCredits struct {
	Cast []TMDBCast `json:"cast"`
	Crew []TMDBCrew `json:"crew"`
}

type TMDBCast struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Character   string `json:"character"`
	ProfilePath string `json:"profile_path"`
}

type TMDBCrew struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Job         string `json:"job"`
	ProfilePath string `json:"profile_path"`
}

type TMDBPersonDetails struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	Biography    string  `json:"biography"`
	Birthday     string  `json:"birthday"`
	Deathday     *string `json:"deathday"`
	PlaceOfBirth string  `json:"place_of_birth"`
	ProfilePath  string  `json:"profile_path"`
	KnownFor     string  `json:"known_for_department"`
}

type TMDBPersonCredits struct {
	Cast []TMDBPersonMovieCast `json:"cast"`
}

type TMDBPersonMovieCast struct {
	ID            int     `json:"id"`
	Title         string  `json:"title"`
	OriginalTitle string  `json:"original_title"`
	Character     string  `json:"character"`
	Overview      string  `json:"overview"`
	PosterPath    string  `json:"poster_path"`
	ReleaseDate   string  `json:"release_date"`
	VoteAverage   float64 `json:"vote_average"`
}

func (c *TMDBClient) doRequest(ctx context.Context, endpoint string) (*http.Response, error) {
	if c.token == "" {
		return nil, fmt.Errorf("TMDB_TOKEN não encontrado no .env")
	}

	body, err := c.cb.Execute(func() (any, error) {
		req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
		if err != nil {
			return nil, err
		}

		req.Header.Add("Authorization", "Bearer "+c.token)
		req.Header.Add("Accept", "application/json")

		res, err := c.httpClient.Do(req)
		if err != nil {
			return nil, err
		}

		if res.StatusCode >= http.StatusInternalServerError {
			res.Body.Close()
			return nil, fmt.Errorf("TMDB retornou erro interno: %d", res.StatusCode)
		}

		return res, nil
	})

	if err != nil {
		return nil, err
	}

	return body.(*http.Response), nil
}

func (c *TMDBClient) SearchMovies(ctx context.Context, query string, year int) ([]TMDBMovie, error) {
	return c.SearchMoviesByLanguage(ctx, query, year, "pt-BR")
}

func (c *TMDBClient) SearchMoviesByLanguage(ctx context.Context, query string, year int, language string) ([]TMDBMovie, error) {
	safeQuery := url.QueryEscape(query)
	endpoint := fmt.Sprintf("%s/search/movie?query=%s&language=%s", c.BaseURL, safeQuery, language)
	if year > 0 {
		endpoint += fmt.Sprintf("&primary_release_year=%d", year)
	}

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("A API do TMDB recusou o pedido, status code: %d", res.StatusCode)
	}

	var tmdbRes TMDBResponse
	if err := json.NewDecoder(res.Body).Decode(&tmdbRes); err != nil {
		return nil, err
	}

	return tmdbRes.Results, nil
}

func (c *TMDBClient) GetMovieDetails(ctx context.Context, tmdbID int) (*TMDBMovieDetails, error) {
	endpoint := fmt.Sprintf("%s/movie/%d?append_to_response=credits,keywords,release_dates&language=pt-BR", c.BaseURL, tmdbID)

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro ao buscar filme detalhado: %d", res.StatusCode)
	}

	var details TMDBMovieDetails
	if err := json.NewDecoder(res.Body).Decode(&details); err != nil {
		return nil, err
	}

	return &details, nil
}

func (c *TMDBClient) GetPersonDetails(ctx context.Context, id int) (*TMDBPersonDetails, error) {
	endpoint := fmt.Sprintf("%s/person/%d?language=pt-BR", c.BaseURL, id)

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro ao buscar detalhes da pessoa: %d", res.StatusCode)
	}

	var details TMDBPersonDetails
	if err := json.NewDecoder(res.Body).Decode(&details); err != nil {
		return nil, err
	}

	return &details, nil
}

func (c *TMDBClient) GetPersonCredits(ctx context.Context, id int) (*TMDBPersonCredits, error) {
	endpoint := fmt.Sprintf("%s/person/%d/movie_credits?language=pt-BR", c.BaseURL, id)

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro ao buscar créditos da pessoa: %d", res.StatusCode)
	}

	var details TMDBPersonCredits
	if err := json.NewDecoder(res.Body).Decode(&details); err != nil {
		return nil, err
	}

	return &details, nil
}

func (c *TMDBClient) GetMoviesRecommendations(ctx context.Context, movieid int) ([]TMDBMovie, error) {
	endpoint := fmt.Sprintf("%s/movie/%d/recommendations?language=pt-BR", c.BaseURL, movieid)

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro ao buscar recomendações do filme: %d", res.StatusCode)
	}

	var parsedRes TMDBResponse
	if err := json.NewDecoder(res.Body).Decode(&parsedRes); err != nil {
		return nil, err
	}

	return parsedRes.Results, nil
}

func (c *TMDBClient) DiscoverMovies(ctx context.Context, genreID int, year int, page int) ([]TMDBMovie, error) {
	if page <= 0 {
		page = 1
	}
	endpoint := fmt.Sprintf("%s/discover/movie?language=pt-BR&sort_by=popularity.desc&page=%d", c.BaseURL, page)
	if genreID > 0 {
		endpoint += fmt.Sprintf("&with_genres=%d", genreID)
	}
	if year > 0 {
		endpoint += fmt.Sprintf("&primary_release_year=%d", year)
	}

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var tmdbRes TMDBResponse
	if err := json.NewDecoder(res.Body).Decode(&tmdbRes); err != nil {
		return nil, err
	}
	return tmdbRes.Results, nil
}

func (c *TMDBClient) SearchPeople(ctx context.Context, query string) ([]TMDBPerson, error) {
	safeQuery := url.QueryEscape(query)
	endpoint := fmt.Sprintf("%s/search/person?query=%s&language=pt-BR", c.BaseURL, safeQuery)

	res, err := c.doRequest(ctx, endpoint)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var tmdbRes TMDBPeopleResponse
	if err := json.NewDecoder(res.Body).Decode(&tmdbRes); err != nil {
		return nil, err
	}
	return tmdbRes.Results, nil
}
