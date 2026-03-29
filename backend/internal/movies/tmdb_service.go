package movies

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
		httpClient: &http.Client{},
		cb:         gobreaker.NewCircuitBreaker(st),
	}
}

type TMDBResponse struct {
	Results []TMDBMovie `json:"results"`
}

type TMDBMovie struct {
	ID               int     `json:"id"`
	Title            string  `json:"title"`
	Overview         string  `json:"overview"`
	PosterPath       string  `json:"poster_path"`
	ReleaseDate      string  `json:"release_date"`
	OriginalLanguage string  `json:"original_language"`
	VoteAverage      float64 `json:"vote_average"`
}

type TMDBMovieDetails struct {
	ID          int              `json:"id"`
	Title       string           `json:"title"`
	Overview    string           `json:"overview"`
	PosterPath  string           `json:"poster_path"`
	ReleaseDate      string               `json:"release_date"`
	Runtime          int                  `json:"runtime"`
	OriginalLanguage string               `json:"original_language"`
	SpokenLanguages  []TMDBSpokenLanguage `json:"spoken_languages"`
	Genres           []TMDBGenre          `json:"genres"`
	Credits     TMDBMovieCredits `json:"credits"`
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
	ID           int      `json:"id"`
	Name         string   `json:"name"`
	Biography    string   `json:"biography"`
	Birthday     string   `json:"birthday"`
	Deathday     *string  `json:"deathday"`
	PlaceOfBirth string   `json:"place_of_birth"`
	ProfilePath  string   `json:"profile_path"`
	KnownFor     string   `json:"known_for_department"`
}

type TMDBPersonCredits struct {
	Cast []TMDBPersonMovieCast `json:"cast"`
}

type TMDBPersonMovieCast struct {
	ID               int     `json:"id"`
	Title            string  `json:"title"`
	OriginalTitle    string  `json:"original_title"`
	Character        string  `json:"character"`
	Overview         string  `json:"overview"`
	PosterPath       string  `json:"poster_path"`
	ReleaseDate      string  `json:"release_date"`
	VoteAverage      float64 `json:"vote_average"`
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

func (c *TMDBClient) SearchMovies(ctx context.Context, query string) ([]TMDBMovie, error) {
	safeQuery := url.QueryEscape(query)
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?query=%s&language=pt-BR", safeQuery)

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
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/movie/%d?append_to_response=credits&language=pt-BR", tmdbID)

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
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/person/%d?language=pt-BR", id)

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
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/person/%d/movie_credits?language=pt-BR", id)

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
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/movie/%d/recommendations?language=pt-BR", movieid)

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
