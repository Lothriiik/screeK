package movies

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
)

type TMDBClient struct {
	token      string
	httpClient *http.Client
}

func NewTMDBClient() *TMDBClient {
	return &TMDBClient{
		token:      os.Getenv("TMDB_TOKEN"),
		httpClient: &http.Client{},
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
	ReleaseDate string           `json:"release_date"`
	Runtime     int              `json:"runtime"`
	Genres      []TMDBGenre      `json:"genres"`
	Credits     TMDBMovieCredits `json:"credits"`
}

type TMDBGenre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
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

func (c *TMDBClient) SearchMovies(query string) ([]TMDBMovie, error) {
	if c.token == "" {
		return nil, fmt.Errorf("TMDB_TOKEN não encontrado no .env")
	}

	safeQuery := url.QueryEscape(query)
	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?query=%s&language=pt-BR", safeQuery)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", "Bearer "+c.token)
	req.Header.Add("Accept", "application/json")

	res, err := c.httpClient.Do(req)
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

func (c *TMDBClient) GetMovieDetails(tmdbID int) (*TMDBMovieDetails, error) {
	if c.token == "" {
		return nil, fmt.Errorf("TMDB_TOKEN não encontrado no .env")
	}

	endpoint := fmt.Sprintf("https://api.themoviedb.org/3/movie/%d?append_to_response=credits&language=pt-BR", tmdbID)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", "Bearer "+c.token)
	req.Header.Add("Accept", "application/json")

	res, err := c.httpClient.Do(req)
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
