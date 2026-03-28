package users

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *UserService
}

func NewHandler(svc *UserService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Post("/users/register", h.CreateUser)
	r.Get("/users/search", h.SearchUsers)
	r.Get("/users/{id}", h.GetByID)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Put("/users/me", h.UpdateUser)
		r.Delete("/users/me", h.DeleteUser)
		r.Get("/users/me", h.GetMe)
		r.Post("/users/me/favorites/{tmdb_id}", h.AddFavorite)
		r.Delete("/users/me/favorites/{tmdb_id}", h.RemoveFavorite)
	})
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var dto CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	if err := dto.Validate(ctx, h.svc); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	userModel := &User{
		Name:     dto.Name,
		Username: dto.Username,
		Email:    dto.Email,
		Password: dto.Password,
	}

	if err := h.svc.CreateUser(ctx, userModel); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao criar usuário"})
		return
	}

	responseDTO := UserDTO{
		ID:       userModel.ID,
		Name:     userModel.Name,
		Username: userModel.Username,
	}

	httputil.WriteJSON(w, http.StatusCreated, responseDTO)
}

func (h *Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "O parâmetro 'q' (busca) é obrigatório"})
		return
	}

	users, err := h.svc.SearchUsers(r.Context(), q)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar usuários"})
		return
	}

	var dtos []UserDTO

	for _, user := range users {
		dtos = append(dtos, UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Name:     user.Name,
		})
	}

	httputil.WriteJSON(w, http.StatusOK, dtos)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
		return
	}
	user, err := h.svc.GetUserByID(r.Context(), id)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "Usuário não encontrado"})
		return
	}

	var favoriteMovies []movies.MovieDTO
	for _, movie := range user.FavoriteMovies {
		favoriteMovies = append(favoriteMovies, movies.MovieDTO{
			ID:        movie.ID,
			Title:     movie.Title,
			PosterURL: movie.PosterURL,
		})
	}

	userDTO := UserDetailsDTO{
		ID:             user.ID,
		Username:       user.Username,
		Name:           user.Name,
		Email:          user.Email,
		Bio:            user.Bio,
		PhotoURL:       user.PhotoURL,
		Pronouns:       user.Pronouns,
		DefaultCity:    user.DefaultCity,
		FavoriteMovies: favoriteMovies,
	}

	httputil.WriteJSON(w, http.StatusOK, userDTO)
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	user, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Erro ao buscar dados", http.StatusInternalServerError)
		return
	}

	var favoriteMovies []movies.MovieDTO
	for _, movie := range user.FavoriteMovies {
		favoriteMovies = append(favoriteMovies, movies.MovieDTO{
			ID:        movie.ID,
			Title:     movie.Title,
			PosterURL: movie.PosterURL,
		})
	}

	userDTO := UserDetailsDTO{
		ID:             user.ID,
		Username:       user.Username,
		Name:           user.Name,
		Email:          user.Email,
		Bio:            user.Bio,
		PhotoURL:       user.PhotoURL,
		Pronouns:       user.Pronouns,
		DefaultCity:    user.DefaultCity,
		FavoriteMovies: favoriteMovies,
	}

	httputil.WriteJSON(w, http.StatusOK, userDTO)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)

	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	user := User{ID: userID}
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	if err := h.svc.UpdateUser(r.Context(), &user); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao atualizar usuário"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "Usuário atualizado com sucesso"})
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	password := body.Password

	userIDAny := r.Context().Value(httputil.UserIDKey)
	if userIDAny == nil {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	if err := h.svc.DeleteUser(r.Context(), userID, password); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao deletar usuário: " + err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "Usuário deletado com sucesso"})
}

func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	tmdbIDStr := chi.URLParam(r, "tmdb_id")
	tmdbID, err := strconv.Atoi(tmdbIDStr)
	if err != nil {
		http.Error(w, "ID do filme inválido", http.StatusBadRequest)
		return
	}

	err = h.svc.AddFavorite(r.Context(), userID, tmdbID)
	if err != nil {
		http.Error(w, "Erro ao favoritar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	tmdbIDStr := chi.URLParam(r, "tmdb_id")
	tmdbID, err := strconv.Atoi(tmdbIDStr)
	if err != nil {
		http.Error(w, "ID do filme inválido", http.StatusBadRequest)
		return
	}

	err = h.svc.RemoveFavorite(r.Context(), userID, tmdbID)
	if err != nil {
		http.Error(w, "Erro ao remover favorito", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
