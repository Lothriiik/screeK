package movies

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *MovieService
}

func NewHandler(svc *MovieService) *Handler {
	return &Handler{
		svc: svc,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/movies/search", h.Search)
	r.Get("/movies/{id}", h.GetDetails)
	r.Get("/movies/{id}/recommendations", h.GetRecommendationsProxy)
	r.Get("/people/{id}", h.GetPersonDetails)
	r.Get("/people/{id}/movies", h.GetPersonMoviesProxy)
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Forneça o parâmetro 'q'. Exemplo: /movies/search?q=Vingadores",
		})
		return
	}

	localMovies, err := h.svc.SearchMovies(query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, localMovies)
}

func (h *Handler) GetDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	movie, err := h.svc.GetMovieDetails(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao compilar cache do filme: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, movie)
}

func (h *Handler) GetPersonDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	person, err := h.svc.GetPersonDetails(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao compilar cache da pessoa: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, person)
}

func (h *Handler) GetPersonMoviesProxy(w http.ResponseWriter, r *http.Request) {
	tmdbID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de pessoa inválido"})
		return
	}

	credits, err := h.svc.GetPersonCredits(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Créditos não encontrados no TMDB"})
		return
	}

	writeJSON(w, http.StatusOK, credits)
}

func (h *Handler) GetRecommendationsProxy(w http.ResponseWriter, r *http.Request) {
	movieID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de filme inválido"})
		return
	}

	recommendations, err := h.svc.GetMovieRecommendations(movieID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Filme não encontrado ou sem recomendações"})
		return
	}

	writeJSON(w, http.StatusOK, recommendations)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
