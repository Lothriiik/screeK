package recommendation

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const defaultTimeout = 30 * time.Second

var errNotFound = errors.New("recurso não encontrado")

// Client fala HTTP com o serviço Python de recomendação.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient cria um client apontando para a base do serviço Python,
// por exemplo "http://localhost:8081/api/v1".
func NewClient(baseURL string) *Client {
	base := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if base == "" {
		base = "http://localhost:8081/api/v1"
	}
	return &Client{
		baseURL:    base,
		httpClient: &http.Client{Timeout: defaultTimeout},
	}
}

type recommendationItem struct {
	MovieID        int     `json:"movie_id"`
	TMDBID         int     `json:"tmdb_id"`
	Score          float64 `json:"score"`
	Reason         string  `json:"reason"`
	Feedback       string  `json:"feedback"`
	IsNicheBreaker bool    `json:"is_niche_breaker"`
}

type recommendationsResponse struct {
	UserID          string               `json:"user_id"`
	Recommendations []recommendationItem `json:"recommendations"`
	Algorithm       string               `json:"algorithm"`
	IDType          string               `json:"id_type"`
	GeneratedAt     string               `json:"generated_at"`
}

type similarItem struct {
	MovieID         int     `json:"movie_id"`
	TMDBID          int     `json:"tmdb_id"`
	SimilarityScore float64 `json:"similarity_score"`
	Reason          string  `json:"reason"`
}

type similarResponse struct {
	MovieID       int           `json:"movie_id"`
	TMDBID        int           `json:"tmdb_id"`
	SimilarMovies []similarItem `json:"similar_movies"`
	Algorithm     string        `json:"algorithm"`
	IDType        string        `json:"id_type"`
	GeneratedAt   string        `json:"generated_at"`
}

// Recommendations busca as recomendações de um usuário no serviço Python.
// Os itens voltam sem metadados hidratados; isso é responsabilidade do Service.
func (c *Client) Recommendations(ctx context.Context, userID string, limit int, filters ...Filters) (*RecommendationsResult, error) {
	var filter Filters
	if len(filters) > 0 {
		filter = filters[0]
	}
	endpoint := c.baseURL + "/recommendations/" + url.PathEscape(userID)
	endpoint = withParams(endpoint, limit, filter)

	var payload recommendationsResponse
	if err := c.get(ctx, endpoint, &payload); err != nil {
		if errors.Is(err, errNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	result := &RecommendationsResult{
		UserID:          payload.UserID,
		Algorithm:       payload.Algorithm,
		IDType:          normalizeIDType(payload.IDType),
		GeneratedAt:     payload.GeneratedAt,
		Recommendations: make([]RecommendedMovie, 0, len(payload.Recommendations)),
	}
	for _, item := range payload.Recommendations {
		result.Recommendations = append(result.Recommendations, RecommendedMovie{
			MovieID:        item.MovieID,
			TMDBID:         item.TMDBID,
			Score:          item.Score,
			Reason:         item.Reason,
			Feedback:       item.Feedback,
			IsNicheBreaker: item.IsNicheBreaker,
		})
	}
	return result, nil
}

// withParams builds the query string with all optional filters.
func withParams(base string, limit int, filters Filters) string {
	u, _ := url.Parse(base)
	q := u.Query()
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	if filters.Genre != "" {
		q.Set("genre", filters.Genre)
	}
	if filters.MinYear != "" {
		q.Set("min_year", filters.MinYear)
	}
	if filters.MaxYear != "" {
		q.Set("max_year", filters.MaxYear)
	}
	if filters.InTheaters {
		q.Set("in_theaters", "true")
	}
	if len(filters.NowPlayingIDs) > 0 {
		ids := make([]string, len(filters.NowPlayingIDs))
		for i, id := range filters.NowPlayingIDs {
			ids[i] = strconv.Itoa(id)
		}
		q.Set("now_playing_ids", strings.Join(ids, ","))
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// Similar busca filmes similares a um filme canônico (`movies.id`).
func (c *Client) Similar(ctx context.Context, movieID int, limit int) (*SimilarResult, error) {
	endpoint := fmt.Sprintf("%s/similar/%d", c.baseURL, movieID)
	endpoint = withLimit(endpoint, limit)

	var payload similarResponse
	if err := c.get(ctx, endpoint, &payload); err != nil {
		if errors.Is(err, errNotFound) {
			return nil, ErrMovieNotFound
		}
		return nil, err
	}

	result := &SimilarResult{
		MovieID:       payload.MovieID,
		TMDBID:        payload.TMDBID,
		Algorithm:     payload.Algorithm,
		IDType:        normalizeIDType(payload.IDType),
		GeneratedAt:   payload.GeneratedAt,
		SimilarMovies: make([]SimilarMovie, 0, len(payload.SimilarMovies)),
	}
	for _, item := range payload.SimilarMovies {
		result.SimilarMovies = append(result.SimilarMovies, SimilarMovie{
			MovieID:         item.MovieID,
			TMDBID:          item.TMDBID,
			SimilarityScore: item.SimilarityScore,
			Reason:          item.Reason,
		})
	}
	return result, nil
}

// MovieGraph busca o subgrafo kNN explicável de um filme no serviço Python.
func (c *Client) MovieGraph(ctx context.Context, movieID int, params GraphParams) (*MovieGraphResult, error) {
	endpoint := fmt.Sprintf("%s/similar/%d/graph", c.baseURL, movieID)
	u, _ := url.Parse(endpoint)
	q := u.Query()
	if params.Depth > 0 {
		q.Set("depth", strconv.Itoa(params.Depth))
	}
	if params.Branching > 0 {
		q.Set("branching", strconv.Itoa(params.Branching))
	}
	if params.MinScore > 0 {
		q.Set("min_score", strconv.FormatFloat(params.MinScore, 'f', -1, 64))
	}
	u.RawQuery = q.Encode()

	var payload MovieGraphResult
	if err := c.get(ctx, u.String(), &payload); err != nil {
		if errors.Is(err, errNotFound) {
			return nil, ErrMovieNotFound
		}
		return nil, err
	}
	payload.IDType = normalizeIDType(payload.IDType)
	if payload.Nodes == nil {
		payload.Nodes = []GraphNode{}
	}
	if payload.Edges == nil {
		payload.Edges = []GraphEdge{}
	}
	return &payload, nil
}

// ReloadDataset pede ao serviço Python que recarregue os dados do Postgres.
func (c *Client) ReloadDataset(ctx context.Context) error {
	endpoint := c.baseURL + "/dataset/reload"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, nil)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%w: falha ao recarregar dataset: status %d: %s", ErrUnavailable, resp.StatusCode, errorDetail(resp.Body))
	}
	return nil
}

func (c *Client) get(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
			return fmt.Errorf("%w: resposta inválida: %v", ErrUnavailable, err)
		}
		return nil
	case http.StatusNotFound:
		return errNotFound
	case http.StatusNotImplemented:
		return fmt.Errorf("%w: %s", ErrNotReady, errorDetail(resp.Body))
	default:
		return fmt.Errorf("%w: status %d: %s", ErrUnavailable, resp.StatusCode, errorDetail(resp.Body))
	}
}

// errorDetail extrai a mensagem legível de uma resposta de erro do FastAPI.
func errorDetail(body io.Reader) string {
	var payload struct {
		Detail string `json:"detail"`
		Error  string `json:"error"`
	}
	data, err := io.ReadAll(io.LimitReader(body, 4096))
	if err == nil && json.Unmarshal(data, &payload) == nil {
		if payload.Detail != "" {
			return payload.Detail
		}
		if payload.Error != "" {
			return payload.Error
		}
	}
	return strings.TrimSpace(string(data))
}

func withLimit(endpoint string, limit int) string {
	if limit <= 0 {
		return endpoint
	}
	separator := "?"
	if strings.Contains(endpoint, "?") {
		separator = "&"
	}
	return endpoint + separator + "limit=" + strconv.Itoa(limit)
}

func normalizeIDType(value string) string {
	if strings.EqualFold(value, "tmdb") {
		return "tmdb"
	}
	return "internal"
}
