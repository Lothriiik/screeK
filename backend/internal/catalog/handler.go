package catalog

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CatalogHandler struct {
	svc *CatalogService
}

func NewHandler(svc *CatalogService) *CatalogHandler {
	return &CatalogHandler{svc: svc}
}

func (h *CatalogHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		
		r.Post("/movies/{id}/log", h.LogMovie)

		r.Post("/watchlist", h.AddToWatchlist)
		r.Delete("/watchlist/{movieID}", h.RemoveFromWatchlist)
		r.Get("/watchlist", h.GetWatchlist)

		r.Post("/lists", h.CreateMovieList)
		r.Get("/lists/me", h.GetMyMovieLists)
		r.Get("/lists/{id}", h.GetMovieListDetail)
		r.Post("/lists/{id}/movies", h.AddMovieToList)
		r.Delete("/lists/{id}/movies/{movieID}", h.RemoveMovieFromList)
		r.Delete("/lists/{id}", h.DeleteMovieList)
	})
}

// @Summary Registrar atividade de filme
// @Description Registra que o usuário assistiu a um filme, permitindo nota e review
// @Tags Catalog
// @Accept json
// @Produce json
// @Param id path int true "ID do Filme (TMDB)"
// @Param request body LogMovieRequest true "Dados do Log"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /movies/{id}/log [post]
func (h *CatalogHandler) LogMovie(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de filme inválido"})
		return
	}

	var req LogMovieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := h.svc.LogMovie(r.Context(), userID, uint(movieID), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Atividade salva com sucesso!"})
}

// @Summary Adicionar à Watchlist
// @Description Salva um filme na lista de desejos do usuário
// @Tags Catalog
// @Accept json
// @Param request body AddWatchlistRequest true "ID do Filme"
// @Success 201 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /watchlist [post]
func (h *CatalogHandler) AddToWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	var req AddWatchlistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}
	if err := h.svc.AddToWatchlist(r.Context(), userID, req.MovieID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, httputil.MessageResponse{Message: "Adicionado à Watchlist!"})
}

// @Summary Remover da Watchlist
// @Description Remove um filme da lista de desejos
// @Tags Catalog
// @Param movieID path int true "ID do Filme"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /watchlist/{movieID} [delete]
func (h *CatalogHandler) RemoveFromWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	movieID, _ := strconv.Atoi(chi.URLParam(r, "movieID"))
	if err := h.svc.RemoveFromWatchlist(r.Context(), userID, uint(movieID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Removido da Watchlist!"})
}

// @Summary Ver minha Watchlist
// @Description Retorna todos os filmes salvos na lista de desejos do usuário autenticado
// @Tags Catalog
// @Produce json
// @Success 200 {array} WatchlistItem
// @Security BearerAuth
// @Router /watchlist [get]
func (h *CatalogHandler) GetWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	items, err := h.svc.GetWatchlist(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, items)
}

// @Summary Criar lista de filmes
// @Description Cria uma nova coleção personalizada de filmes (ex: "Favoritos de Terror")
// @Tags Catalog
// @Accept json
// @Produce json
// @Param request body CreateMovieListRequest true "Dados da lista"
// @Success 201 {object} MovieListResponseDTO
// @Security BearerAuth
// @Router /lists [post]
func (h *CatalogHandler) CreateMovieList(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	var req CreateMovieListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}
	list, err := h.svc.CreateMovieList(r.Context(), userID, req)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, list)
}

// @Summary Minhas listas
// @Description Retorna todas as listas personalizadas criadas pelo usuário
// @Tags Catalog
// @Produce json
// @Success 200 {array} MovieListResponseDTO
// @Security BearerAuth
// @Router /lists/me [get]
func (h *CatalogHandler) GetMyMovieLists(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	lists, err := h.svc.GetMyMovieLists(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, lists)
}

// @Summary Detalhe da lista
// @Description Retorna os dados de uma lista e todos os filmes nela contidos
// @Tags Catalog
// @Param id path int true "ID da Lista"
// @Produce json
// @Success 200 {object} MovieListResponseDTO
// @Security BearerAuth
// @Router /lists/{id} [get]
func (h *CatalogHandler) GetMovieListDetail(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	list, err := h.svc.GetMovieListDetail(r.Context(), uint(listID))
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "Lista não encontrada"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, list)
}

// @Summary Adicionar filme à lista
// @Description Vincula um filme a uma lista personalizada do usuário
// @Tags Catalog
// @Accept json
// @Param id path int true "ID da Lista"
// @Param request body AddMovieToListRequest true "ID do Filme"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /lists/{id}/movies [post]
func (h *CatalogHandler) AddMovieToList(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	var req AddMovieToListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}
	if err := h.svc.AddMovieToList(r.Context(), userID, uint(listID), req.MovieID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Filme adicionado à lista!"})
}

// @Summary Remover filme da lista
// @Description Desvincula um filme de uma lista personalizada
// @Tags Catalog
// @Param id path int true "ID da Lista"
// @Param movieID path int true "ID do Filme"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /lists/{id}/movies/{movieID} [delete]
func (h *CatalogHandler) RemoveMovieFromList(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	movieID, _ := strconv.Atoi(chi.URLParam(r, "movieID"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.RemoveMovieFromList(r.Context(), userID, uint(listID), uint(movieID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Filme removido da lista!"})
}

// @Summary Excluir lista
// @Description Remove permanentemente uma lista personalizada
// @Tags Catalog
// @Param id path int true "ID da Lista"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /lists/{id} [delete]
func (h *CatalogHandler) DeleteMovieList(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.DeleteMovieList(r.Context(), userID, uint(listID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Lista excluída!"})
}
