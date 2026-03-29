package social

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc Service
}

func NewHandler(svc Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		
		// Atividade e Posts
		r.Post("/movies/{id}/log", h.LogMovie)
		r.Post("/posts", h.CreatePost)
		r.Put("/posts/{id}", h.UpdatePost)
		r.Delete("/posts/{id}", h.DeletePost)
		r.Post("/posts/{id}/reply", h.ReplyToPost)
		r.Post("/posts/{id}/like", h.ToggleLike)
		
		// Feeds e Social
		r.Get("/feed", h.GetFeed)
		r.Get("/feed/global", h.GetGlobalFeed)
		r.Post("/users/{username}/follow", h.ToggleFollow)

		// Watchlist
		r.Post("/watchlist", h.AddToWatchlist)
		r.Delete("/watchlist/{movieID}", h.RemoveFromWatchlist)
		r.Get("/watchlist", h.GetWatchlist)

		// MovieLists
		r.Post("/lists", h.CreateMovieList)
		r.Get("/lists/me", h.GetMyMovieLists)
		r.Get("/lists/{id}", h.GetMovieListDetail)
		r.Post("/lists/{id}/movies", h.AddMovieToList)
		r.Delete("/lists/{id}/movies/{movieID}", h.RemoveMovieFromList)
		r.Delete("/lists/{id}", h.DeleteMovieList)
	})
}

// LogMovie godoc
// @Summary Registra atividade em um filme
// @Description Permite marcar como assistido, dar nota e curtir um filme.
// @Tags Social
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID do Filme (TMDB)"
// @Param log body LogMovieRequest true "Dados da atividade"
// @Success 200 {object} httputil.MessageResponse
// @Router /movies/{id}/log [post]
func (h *Handler) LogMovie(w http.ResponseWriter, r *http.Request) {
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

// CreatePost godoc
// @Summary Cria um novo post
// @Description Permite criar posts de texto, review ou compartilhamento de sessão.
// @Tags Social
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param post body CreatePostRequest true "Dados do post"
// @Success 201 {object} PostResponseDTO
// @Router /posts [post]
func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload JSON inválido"})
		return
	}

	postResponse, err := h.svc.CreatePost(r.Context(), userID, req)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, postResponse)
}

// UpdatePost godoc
// @Summary Atualiza um post
// @Tags Social
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID do Post"
// @Param post body UpdatePostRequest true "Dados do post"
// @Success 200 {object} httputil.MessageResponse
// @Router /posts/{id} [put]
func (h *Handler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	postID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	var req UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}

	if err := h.svc.UpdatePost(r.Context(), userID, uint(postID), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Post atualizado!"})
}

// DeletePost godoc
// @Summary Deleta um post
// @Tags Social
// @Security BearerAuth
// @Produce json
// @Param id path int true "ID do Post"
// @Success 200 {object} httputil.MessageResponse
// @Router /posts/{id} [delete]
func (h *Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	postID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	role, _ := r.Context().Value(httputil.UserRoleKey).(httputil.Role)

	if err := h.svc.DeletePost(r.Context(), userID, uint(postID), role); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Post apagado!"})
}

// GetFeed godoc
// @Summary Feed de seguidores
// @Tags Social
// @Security BearerAuth
// @Produce json
// @Router /feed [get]
func (h *Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	cursorID, _ := strconv.Atoi(r.URL.Query().Get("cursor"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	res, err := h.svc.GetFeed(r.Context(), userID, uint(cursorID), limit)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, res)
}

// GetGlobalFeed godoc
// @Summary Feed global
// @Tags Social
// @Security BearerAuth
// @Produce json
// @Router /feed/global [get]
func (h *Handler) GetGlobalFeed(w http.ResponseWriter, r *http.Request) {
	cursorID, _ := strconv.Atoi(r.URL.Query().Get("cursor"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	res, err := h.svc.GetGlobalFeed(r.Context(), uint(cursorID), limit)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, res)
}

// ReplyToPost godoc
// @Summary Responde a um post
// @Tags Social
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID do Post Pai"
// @Param reply body ReplyRequest true "Dados da resposta"
// @Router /posts/{id}/reply [post]
func (h *Handler) ReplyToPost(w http.ResponseWriter, r *http.Request) {
	parentID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	var req ReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := h.svc.ReplyToPost(r.Context(), userID, uint(parentID), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, httputil.MessageResponse{Message: "Enviado!"})
}

// ToggleLike godoc
// @Summary Curte/Descurte
// @Tags Social
// @Security BearerAuth
// @Router /posts/{id}/like [post]
func (h *Handler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	postID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	liked, err := h.svc.ToggleLike(r.Context(), userID, uint(postID))
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, ToggleLikeResponse{Message: "Ok", Liked: liked})
}

// ToggleFollow godoc
// @Summary Segue/Deixa de seguir
// @Tags Social
// @Security BearerAuth
// @Router /users/{username}/follow [post]
func (h *Handler) ToggleFollow(w http.ResponseWriter, r *http.Request) {
	target := chi.URLParam(r, "username")
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	followed, err := h.svc.ToggleFollow(r.Context(), userID, target)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, ToggleFollowResponse{Message: "Ok", IsFollowing: followed})
}

// --- Watchlist Handlers ---

func (h *Handler) AddToWatchlist(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) RemoveFromWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	movieID, _ := strconv.Atoi(chi.URLParam(r, "movieID"))
	if err := h.svc.RemoveFromWatchlist(r.Context(), userID, uint(movieID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Removido da Watchlist!"})
}

func (h *Handler) GetWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	items, err := h.svc.GetWatchlist(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, items)
}

// --- MovieList Handlers ---

func (h *Handler) CreateMovieList(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) GetMyMovieLists(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	lists, err := h.svc.GetMyMovieLists(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, lists)
}

func (h *Handler) GetMovieListDetail(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	list, err := h.svc.GetMovieListDetail(r.Context(), uint(listID))
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "Lista não encontrada"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, list)
}

func (h *Handler) AddMovieToList(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) RemoveMovieFromList(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	movieID, _ := strconv.Atoi(chi.URLParam(r, "movieID"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.RemoveMovieFromList(r.Context(), userID, uint(listID), uint(movieID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Filme removido da lista!"})
}

func (h *Handler) DeleteMovieList(w http.ResponseWriter, r *http.Request) {
	listID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.DeleteMovieList(r.Context(), userID, uint(listID)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Lista excluída!"})
}
