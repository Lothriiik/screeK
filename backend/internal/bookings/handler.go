package bookings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service BookingsService
}

func NewHandler(s BookingsService) *Handler {
	return &Handler{
		service: s,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/playing", h.GetMoviesPlaying)
	r.Get("/{id}/sessions", h.GetMovieSessions)
	r.Get("/sessions/{id}/seats", h.GetSeatsBySession)
}

func (h *Handler) GetMoviesPlaying(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios (ex: ?city=Sorocaba&date=2024-10-25)"})
		return
	}

	moviesPlaying, err := h.service.GetMoviesPlaying(city, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar filmes em cartaz: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, moviesPlaying)
}

func (h *Handler) GetMovieSessions(w http.ResponseWriter, r *http.Request) {
	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID do filme inválido"})
		return
	}

	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios"})
		return
	}

	response, err := h.service.GetMovieSessionsGroupedByCinema(movieID, city, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar sessões: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) GetSeatsBySession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID da sessão inválido"})
		return
	}

	seats, err := h.service.GetSeatsBySession(sessionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar mapa de assentos: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, seats)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}