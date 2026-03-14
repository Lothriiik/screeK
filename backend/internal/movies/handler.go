package movies

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	tmdbClient TMDBService
	store      MoviesRepository
}

func NewHandler(tmdb TMDBService, s MoviesRepository) *Handler {
	return &Handler{
		tmdbClient: tmdb,
		store:      s,
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

	tmdbMovies, err := h.tmdbClient.SearchMovies(query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	var localMovies []Movie

	for _, tm := range tmdbMovies {
		parsedDate, _ := time.Parse("2006-01-02", tm.ReleaseDate)

		movie := Movie{
			TMDBID:      tm.ID,
			Title:       tm.Title,
			Overview:    tm.Overview,
			PosterURL:   "https://image.tmdb.org/t/p/w500" + tm.PosterPath,
			ReleaseDate: parsedDate,
		}

		_ = h.store.SaveMovie(&movie)

		localMovies = append(localMovies, movie)
	}

	writeJSON(w, http.StatusOK, localMovies)
}

func (h *Handler) GetDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	localMovie, err := h.store.GetMovieByTMDBID(tmdbID)
	if err == nil && localMovie != nil {
		writeJSON(w, http.StatusOK, localMovie)
		return
	}

	tmdbDetails, err := h.tmdbClient.GetMovieDetails(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Filme não encontrado no TMDB"})
		return
	}

	savedMovie, err := h.store.SaveMovieDetails(tmdbDetails)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao compilar cache do filme: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, savedMovie)
}

func (h *Handler) GetPersonDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	localPerson, err := h.store.GetPersonByTMDBID(tmdbID)
	if err == nil && localPerson != nil {
		writeJSON(w, http.StatusOK, localPerson)
		return
	}

	tmdbDetails, err := h.tmdbClient.GetPersonDetails(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Pessoa não encontrada no TMDB"})
		return
	}

	savedPerson, err := h.store.SavePersonDetails(tmdbDetails)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao compilar cache da pessoa: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, savedPerson)
}

func (h *Handler) GetPersonMoviesProxy(w http.ResponseWriter, r *http.Request) {
	tmdbID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de pessoa inválido"})
		return
	}

	credits, err := h.tmdbClient.GetPersonCredits(tmdbID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Créditos não encontrados no TMDB"})
		return
	}

	writeJSON(w, http.StatusOK, credits.Cast)
}

func (h *Handler) GetRecommendationsProxy(w http.ResponseWriter, r *http.Request) {
	movieID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de filme inválido"})
		return
	}

	recommendations, err := h.tmdbClient.GetMoviesRecommendations(movieID)
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
