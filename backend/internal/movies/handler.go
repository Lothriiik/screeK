package movies

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	tmdbClient *TMDBClient
	store      *Store
}

func NewHandler(tmdb *TMDBClient, s *Store) *Handler {
	return &Handler{
		tmdbClient: tmdb,
		store:      s,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/movies/search", h.Search)
	r.Get("/movies/{id}", h.GetDetails)
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

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
