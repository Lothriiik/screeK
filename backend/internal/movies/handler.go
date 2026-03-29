package movies

import (
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
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

// Search godoc
// @Summary Busca filmes por título
// @Description Realiza uma busca textual no catálogo de filmes.
// @Tags Movies
// @Accept json
// @Produce json
// @Param q query string true "Termo de busca (ex: Batman)"
// @Success 200 {array} MovieDTO
// @Failure 400 {object} ErrorResponse
// @Router /movies/search [get]
func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, ErrorResponse{
			Error: "Forneça o parâmetro 'q'. Exemplo: /movies/search?q=Vingadores",
		})
		return
	}

	localMovies, err := h.svc.SearchMovies(r.Context(), query)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, localMovies)
}

// GetDetails godoc
// @Summary Detalhes completos de um filme
// @Description Retorna informações do TMDB e cache local para um filme específico.
// @Tags Movies
// @Accept json
// @Produce json
// @Param id path int true "ID do Filme (TMDB ID)"
// @Success 200 {object} Movie
// @Failure 500 {object} ErrorResponse
// @Router /movies/{id} [get]
func (h *Handler) GetDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	movie, err := h.svc.GetMovieDetails(r.Context(), tmdbID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Erro ao compilar cache do filme: " + err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, movie)
}

// GetPersonDetails godoc
// @Summary Busca detalhes de uma pessoa (ator/diretor)
// @Description Retorna biografia, foto e informações do TMDB via cache local.
// @Tags Movies
// @Accept json
// @Produce json
// @Param id path int true "ID da Pessoa (TMDB ID)"
// @Success 200 {object} Person
// @Failure 500 {object} ErrorResponse
// @Router /people/{id} [get]
func (h *Handler) GetPersonDetails(w http.ResponseWriter, r *http.Request) {
	tmdbID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	person, err := h.svc.GetPersonDetails(r.Context(), tmdbID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Erro ao compilar cache da pessoa: " + err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, person)
}

// GetPersonMoviesProxy godoc
// @Summary Lista filmes relacionados a uma pessoa
// @Description Retorna a filmografia (créditos) de um ator ou membro da equipe.
// @Tags Movies
// @Accept json
// @Produce json
// @Param id path int true "ID da Pessoa"
// @Success 200 {array} TMDBPersonMovieCast
// @Failure 404 {object} ErrorResponse
// @Router /people/{id}/movies [get]
func (h *Handler) GetPersonMoviesProxy(w http.ResponseWriter, r *http.Request) {
	tmdbID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, ErrorResponse{Error: "ID de pessoa inválido"})
		return
	}

	credits, err := h.svc.GetPersonCredits(r.Context(), tmdbID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, ErrorResponse{Error: "Créditos não encontrados no TMDB"})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, credits)
}

// GetRecommendationsProxy godoc
// @Summary Recomendações de filmes similares
// @Description Retorna uma lista de filmes recomendados baseados em um filme específico.
// @Tags Movies
// @Accept json
// @Produce json
// @Param id path int true "ID do Filme"
// @Success 200 {array} TMDBMovie
// @Failure 404 {object} ErrorResponse
// @Router /movies/{id}/recommendations [get]
func (h *Handler) GetRecommendationsProxy(w http.ResponseWriter, r *http.Request) {
	movieID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, ErrorResponse{Error: "ID de filme inválido"})
		return
	}

	recommendations, err := h.svc.GetMovieRecommendations(r.Context(), movieID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, ErrorResponse{Error: "Filme não encontrado ou sem recomendações"})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, recommendations)
}
