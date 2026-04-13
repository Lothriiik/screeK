package handler

import (
	"net/http"

	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ImportHandler struct {
	svc *letterboxd.Service
}

func NewHandler(svc *letterboxd.Service) *ImportHandler {
	return &ImportHandler{svc: svc}
}

func (h *ImportHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/import/letterboxd", h.ImportFromCSV)
	})
}

type GlobalImportSummary struct {
	Watched   *letterboxd.ImportSummary `json:"watched,omitempty"`
	Ratings   *letterboxd.ImportSummary `json:"ratings,omitempty"`
	Watchlist *letterboxd.ImportSummary `json:"watchlist,omitempty"`
}

func (h *ImportHandler) ImportFromCSV(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "erro ao processar form"})
		return
	}

	summary := &GlobalImportSummary{}

	if file, _, err := r.FormFile("watched"); err == nil {
		defer file.Close()
		s, _ := h.svc.ImportWatchedCSV(r.Context(), userID, file)
		summary.Watched = s
	}

	if file, _, err := r.FormFile("ratings"); err == nil {
		defer file.Close()
		s, _ := h.svc.ImportRatingsCSV(r.Context(), userID, file)
		summary.Ratings = s
	}

	if file, _, err := r.FormFile("watchlist"); err == nil {
		defer file.Close()
		s, _ := h.svc.ImportWatchlistCSV(r.Context(), userID, file)
		summary.Watchlist = s
	}

	httputil.WriteJSON(w, http.StatusOK, summary)
}
