package bookings

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	store BookingsRepository
}

func NewHandler(s BookingsRepository) *Handler {
	return &Handler{
		store: s,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/movies/playing", h.GetMoviesPlaying)
}

func (h *Handler) GetMoviesPlaying(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios (ex: ?city=Sorocaba&date=2024-10-25)"})
		return
	}

	moviesPlaying, err := h.store.GetMoviesPlaying(city, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar filmes em cartaz: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, moviesPlaying)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}