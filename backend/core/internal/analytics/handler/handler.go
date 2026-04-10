package handler

import (
	"net/http"
	"time"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/analytics"
	"github.com/go-chi/chi/v5"
)

type AnalyticsHandler struct {
	service *analytics.AnalyticsService
}

func NewHandler(s *analytics.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: s}
}

func (h *AnalyticsHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(httputil.CheckRole(httputil.RoleAdmin))

		r.Get("/admin/analytics/revenue", h.GetRevenueAnalytics)
		r.Get("/admin/analytics/movies", h.GetMovieAnalytics)
		r.Get("/admin/analytics/genres", h.GetGenreAnalytics)
	})
}

// @Summary Estatísticas de receita
// @Description Retorna métricas financeiras (total, média, tendências)
// @Tags Analytics
// @Param start query string false "Data inicial (YYYY-MM-DD)"
// @Param end query string false "Data final (YYYY-MM-DD)"
// @Param period query string false "Periodicidade (daily, monthly)"
// @Produce json
// @Success 200 {object} AnalyticsSummaryResponseDTO
// @Security BearerAuth
// @Router /admin/analytics/revenue [get]
func (h *AnalyticsHandler) GetRevenueAnalytics(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")
	period := r.URL.Query().Get("period")

	end := time.Now()
	start := end.AddDate(0, 0, -30)

	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			start = t
		}
	}
	if endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			end = t
		}
	}

	if period != "" {
		stats, err := h.service.GetRevenueTrends(r.Context(), start, end, period)
		if err != nil {
			httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
			return
		}
		httputil.WriteJSON(w, http.StatusOK, stats)
		return
	}

	stats, err := h.service.GetAnalytics(r.Context(), start, end)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, stats)
}

// @Summary Desempenho por filme
// @Description Retorna ranking de filmes por bilheteria e ingressos vendidos
// @Tags Analytics
// @Param start query string false "Data inicial"
// @Param end query string false "Data final"
// @Produce json
// @Success 200 {array} MovieStatsDTO
// @Security BearerAuth
// @Router /admin/analytics/movies [get]
func (h *AnalyticsHandler) GetMovieAnalytics(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	end := time.Now()
	start := end.AddDate(0, 0, -30)

	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			start = t
		}
	}
	if endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			end = t
		}
	}

	stats, err := h.service.GetMovieAnalytics(r.Context(), start, end)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, stats)
}

// @Summary Preferência por gênero
// @Description Analisa a distribuição de vendas por gênero de filme
// @Tags Analytics
// @Param start query string false "Data inicial"
// @Param end query string false "Data final"
// @Produce json
// @Success 200 {array} GenreStatsResponseDTO
// @Security BearerAuth
// @Router /admin/analytics/genres [get]
func (h *AnalyticsHandler) GetGenreAnalytics(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	end := time.Now()
	start := end.AddDate(0, 0, -30)

	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			start = t
		}
	}
	if endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			end = t
		}
	}

	stats, err := h.service.GetGenreAnalytics(r.Context(), start, end)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, stats)
}
