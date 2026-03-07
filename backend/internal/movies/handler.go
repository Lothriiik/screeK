package movies

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
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

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	e.GET("/movies/search", h.Search)
	e.GET("/movies/:id", h.GetDetails)
}

func (h *Handler) Search(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Forneça o parâmetro 'q'. Exemplo: /movies/search?q=Vingadores",
		})
	}

	tmdbMovies, err := h.tmdbClient.SearchMovies(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
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

	return c.JSON(http.StatusOK, localMovies)
}

func (h *Handler) GetDetails(c echo.Context) error {
	idParam := c.Param("id")
	tmdbID, _ := strconv.Atoi(idParam)
	tmdbDetails, err := h.tmdbClient.GetMovieDetails(tmdbID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Filme não encontrado no TMDB"})
	}

	savedMovie, err := h.store.SaveMovieDetails(tmdbDetails)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Erro ao compilar cache do filme: " + err.Error()})
	}
	return c.JSON(http.StatusOK, savedMovie)
}
