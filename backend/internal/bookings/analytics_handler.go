package bookings

import (
	"net/http"
	"time"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
)

type AnalyticsHandler struct {
	service *BookingsService
}

func NewAnalyticsHandler(s *BookingsService) *AnalyticsHandler {
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

// GetRevenueAnalytics godoc
// @Summary Relatório de faturamento (Dia/Mês/Ano)
// @Description Retorna o faturamento agregado num período, com suporte a agrupamento temporal.
// @Tags Admin (Analytics)
// @Security BearerAuth
// @Produce json
// @Param start query string false "Data início (YYYY-MM-DD)"
// @Param end query string false "Data fim (YYYY-MM-DD)"
// @Param period query string false "Agrupamento (day, month, year)"
// @Success 200 {object} []DailyCinemaStatsResponseDTO
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

// GetMovieAnalytics godoc
// @Summary Ranking de filmes mais vendidos
// @Tags Admin (Analytics)
// @Security BearerAuth
// @Produce json
// @Param start query string false "Data início"
// @Param end query string false "Data fim"
// @Success 200 {object} []MovieStatsDTO
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

// GetGenreAnalytics godoc
// @Summary Distribuição de faturamento por gênero
// @Tags Admin (Analytics)
// @Security BearerAuth
// @Produce json
// @Param start query string false "Data início"
// @Param end query string false "Data fim"
// @Success 200 {object} []GenreStatsResponseDTO
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
