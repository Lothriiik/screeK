package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/StartLivin/screek/backend/internal/recommendation"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const (
	defaultLimit = 20
	maxLimit     = 100
)

var errInvalidNowPlayingIDs = errors.New("now_playing_ids inválido")

// Handler expõe o gateway HTTP do Go para o serviço Python de recomendação.
type Handler struct {
	svc *recommendation.Service
}

func NewHandler(svc *recommendation.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		// Nome canônico do roadmap; `/recommendations` fica como alias.
		r.Get("/users/me/recommendations", h.GetMyRecommendations)
		r.Get("/recommendations", h.GetMyRecommendations)
		r.Get("/recommendations/{userID}", h.GetRecommendations)
		r.Post("/recommendations/feedback", h.SaveFeedback)
		r.Delete("/recommendations/feedback/{movieID}", h.DeleteFeedback)
	})

	// Similares não dependem do usuário autenticado.
	r.Get("/similar/{movieID}", h.GetSimilarMovies)
	r.Get("/similar/{movieID}/graph", h.GetMovieGraph)
}

type feedbackRequest struct {
	MovieID  int    `json:"movie_id"`
	Feedback string `json:"feedback"`
}

// @Summary Avaliar uma recomendação
// @Description Registra se o filme interessa ao usuário para ajustar recomendações futuras.
// @Tags Intelligence
// @Accept json
// @Produce json
// @Param request body feedbackRequest true "Feedback"
// @Success 204
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 401 {object} httputil.ErrorResponse
// @Security BearerAuth
// @Router /recommendations/feedback [post]
func (h *Handler) SaveFeedback(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}
	var body feedbackRequest
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.MovieID <= 0 || (body.Feedback != recommendation.FeedbackInterested && body.Feedback != recommendation.FeedbackNotInterested) {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "movie_id ou feedback inválido"})
		return
	}
	if err := h.svc.SaveFeedback(r.Context(), userID, body.MovieID, body.Feedback); err != nil {
		writeRecommendationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// @Summary Remover feedback de recomendação
// @Tags Intelligence
// @Produce json
// @Param movieID path int true "ID interno do filme"
// @Success 204
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 401 {object} httputil.ErrorResponse
// @Security BearerAuth
// @Router /recommendations/feedback/{movieID} [delete]
func (h *Handler) DeleteFeedback(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}
	movieID, err := strconv.Atoi(chi.URLParam(r, "movieID"))
	if err != nil || movieID <= 0 {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de filme inválido"})
		return
	}
	if err := h.svc.DeleteFeedback(r.Context(), userID, movieID); err != nil {
		writeRecommendationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// @Summary Minhas recomendações
// @Description Retorna recomendações personalizadas para o usuário autenticado. `/recommendations` é um alias desta rota.
// @Tags Intelligence
// @Produce json
// @Param limit query int false "Quantidade (1-100)" minimum(1) maximum(100) default(20)
// @Param genre query string false "Filtrar por gênero"
// @Param min_year query int false "Ano mínimo de lançamento"
// @Param max_year query int false "Ano máximo de lançamento"
// @Param in_theaters query bool false "Filtrar por filmes em cartaz"
// @Param now_playing_ids query string false "IDs de filmes em cartaz separados por vírgula"
// @Success 200 {object} recommendation.RecommendationsResult
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 401 {object} httputil.ErrorResponse
// @Failure 501 {object} httputil.ErrorResponse
// @Failure 502 {object} httputil.ErrorResponse
// @Security BearerAuth
// @Router /users/me/recommendations [get]
// @Router /recommendations [get]
func (h *Handler) GetMyRecommendations(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}
	h.respondRecommendations(w, r, userID.String())
}

// @Summary Recomendações de um usuário
// @Description Retorna recomendações personalizadas para o usuário informado. Requer autenticação.
// @Tags Intelligence
// @Produce json
// @Param userID path string true "ID do usuário"
// @Param limit query int false "Quantidade (1-100)" minimum(1) maximum(100) default(20)
// @Param genre query string false "Filtrar por gênero"
// @Param min_year query int false "Ano mínimo de lançamento"
// @Param max_year query int false "Ano máximo de lançamento"
// @Param in_theaters query bool false "Filtrar por filmes em cartaz"
// @Param now_playing_ids query string false "IDs de filmes em cartaz separados por vírgula"
// @Success 200 {object} recommendation.RecommendationsResult
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 401 {object} httputil.ErrorResponse
// @Failure 404 {object} httputil.ErrorResponse
// @Failure 501 {object} httputil.ErrorResponse
// @Failure 502 {object} httputil.ErrorResponse
// @Security BearerAuth
// @Router /recommendations/{userID} [get]
func (h *Handler) GetRecommendations(w http.ResponseWriter, r *http.Request) {
	userID := strings.TrimSpace(chi.URLParam(r, "userID"))
	if userID == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "user_id inválido"})
		return
	}
	h.respondRecommendations(w, r, userID)
}

// @Summary Filmes similares
// @Description Filmes similares a um filme canônico (movies.id)
// @Tags Intelligence
// @Produce json
// @Param movieID path int true "ID interno do filme (movies.id)"
// @Param limit query int false "Quantidade (1-100)" minimum(1) maximum(100) default(20)
// @Success 200 {object} recommendation.SimilarResult
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 404 {object} httputil.ErrorResponse
// @Failure 501 {object} httputil.ErrorResponse
// @Failure 502 {object} httputil.ErrorResponse
// @Router /similar/{movieID} [get]
func (h *Handler) GetSimilarMovies(w http.ResponseWriter, r *http.Request) {
	movieID, err := strconv.Atoi(chi.URLParam(r, "movieID"))
	if err != nil || movieID <= 0 {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de filme inválido"})
		return
	}

	result, err := h.svc.Similar(r.Context(), movieID, limitFrom(r))
	if err != nil {
		writeRecommendationError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, result)
}

// @Summary Grafo semântico de filmes similares
// @Description Retorna o subgrafo kNN com motivos nas arestas para um filme canônico (movies.id)
// @Tags Intelligence
// @Produce json
// @Param movieID path int true "ID interno do filme (movies.id)"
// @Param depth query int false "Profundidade do grafo (1-3)" minimum(1) maximum(3) default(2)
// @Param branching query int false "Conexões por nó (2-8)" minimum(2) maximum(8) default(4)
// @Param min_score query number false "Score mínimo da aresta (0.0-1.0)" default(0.15)
// @Success 200 {object} recommendation.MovieGraphResult
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 404 {object} httputil.ErrorResponse
// @Failure 501 {object} httputil.ErrorResponse
// @Failure 502 {object} httputil.ErrorResponse
// @Router /similar/{movieID}/graph [get]
func (h *Handler) GetMovieGraph(w http.ResponseWriter, r *http.Request) {
	movieID, err := strconv.Atoi(chi.URLParam(r, "movieID"))
	if err != nil || movieID <= 0 {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de filme inválido"})
		return
	}

	q := r.URL.Query()
	var params recommendation.GraphParams
	if raw := q.Get("depth"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v >= 1 && v <= 3 {
			params.Depth = v
		}
	}
	if raw := q.Get("branching"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v >= 2 && v <= 8 {
			params.Branching = v
		}
	}
	if raw := q.Get("min_score"); raw != "" {
		if v, err := strconv.ParseFloat(raw, 64); err == nil && v >= 0 && v <= 1 {
			params.MinScore = v
		}
	}

	result, err := h.svc.MovieGraph(r.Context(), movieID, params)
	if err != nil {
		writeRecommendationError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) respondRecommendations(w http.ResponseWriter, r *http.Request, userID string) {
	query := r.URL.Query()
	nowPlaying, err := parseNowPlayingIDs(query.Get("now_playing_ids"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "now_playing_ids deve conter IDs inteiros positivos separados por vírgula"})
		return
	}
	filters := recommendation.Filters{
		Genre:         query.Get("genre"),
		MinYear:       query.Get("min_year"),
		MaxYear:       query.Get("max_year"),
		InTheaters:    query.Get("in_theaters") == "true",
		NowPlayingIDs: nowPlaying,
	}

	result, err := h.svc.Recommendations(r.Context(), userID, limitFrom(r), filters)
	if err != nil {
		writeRecommendationError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, result)
}

func parseNowPlayingIDs(raw string) ([]int, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	parts := strings.Split(raw, ",")
	ids := make([]int, 0, len(parts))
	for _, part := range parts {
		id, err := strconv.Atoi(strings.TrimSpace(part))
		if err != nil || id <= 0 {
			return nil, errInvalidNowPlayingIDs
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func limitFrom(r *http.Request) int {
	raw := r.URL.Query().Get("limit")
	if raw == "" {
		return defaultLimit
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return defaultLimit
	}
	if value > maxLimit {
		return maxLimit
	}
	return value
}

func writeRecommendationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, recommendation.ErrNotReady):
		httputil.WriteJSON(w, http.StatusNotImplemented, httputil.ErrorResponse{Error: err.Error()})
	case errors.Is(err, recommendation.ErrUserNotFound):
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: err.Error()})
	case errors.Is(err, recommendation.ErrMovieNotFound):
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: err.Error()})
	default:
		slog.Error("Falha no serviço de recomendação", "err", err)
		httputil.WriteJSON(w, http.StatusBadGateway, httputil.ErrorResponse{Error: "serviço de recomendação indisponível"})
	}
}
