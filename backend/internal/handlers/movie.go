package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/models"
	"github.com/StartLivin/cine-pass/backend/internal/services"
	"github.com/StartLivin/cine-pass/backend/internal/store"
	"github.com/labstack/echo/v4"
)

type MovieHandler struct {
	tmdbClient *services.TMDBClient
	store      store.Storage
}

func NewMovieHandler(tmdb *services.TMDBClient, s store.Storage) *MovieHandler {
	return &MovieHandler{
		tmdbClient: tmdb,
		store:      s,
	}
}

func (h *MovieHandler) Search(c echo.Context) error {
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

	var localMovies []models.Movie

	for _, tm := range tmdbMovies {
		parsedDate, _ := time.Parse("2006-01-02", tm.ReleaseDate)

		movie := models.Movie{
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

func (h *MovieHandler) GetDetails(c echo.Context) error {
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
