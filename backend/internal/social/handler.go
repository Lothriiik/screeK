package social

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/cine-pass/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
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
		r.Post("/movies/{id}/log", h.LogMovie)
		r.Post("/posts", h.CreatePost)
		r.Get("/feed", h.GetFeed)
		r.Post("/posts/{id}/reply", h.ReplyToPost)
	})
}

func (h *Handler) LogMovie(w http.ResponseWriter, r *http.Request) {
    userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de filme inválido"})
		return
	}

	var req LogMovieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	if err := h.svc.LogMovie(r.Context(), uint(userID), uint(movieID), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "Atividade salva com sucesso!"})
}

func (h *Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Não logado ou token expirado", http.StatusUnauthorized)
		return
	}

	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Payload JSON inválido ou corrompido"})
		return
	}

	postResponse, err := h.svc.CreatePost(r.Context(), uint(userID), req)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, postResponse)
}

func (h *Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	_, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}


	cursorStr := r.URL.Query().Get("cursor")
	limitStr := r.URL.Query().Get("limit")

	var cursorID, limit int
	if cursorStr != "" {
		cursorID, _ = strconv.Atoi(cursorStr)
	}
	if limitStr != "" {
		limit, _ = strconv.Atoi(limitStr)
	}

	feedResponse, err := h.svc.GetFeed(r.Context(), uint(cursorID), limit)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao montar o feed: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, feedResponse)
}

func (h *Handler) ReplyToPost(w http.ResponseWriter, r *http.Request) {
	parentIDStr := chi.URLParam(r, "id")
	parentID, err := strconv.Atoi(parentIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de post inválido no endereço"})
		return
	}

	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	var req ReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Conteúdo JSON inválido"})
		return
	}

	if err := h.svc.ReplyToPost(r.Context(), uint(userID), uint(parentID), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Resposta enviada com sucesso!"})
}


