package users

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	store UserRepository
}

func NewHandler(store UserRepository) *Handler {
	return &Handler{store: store}
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
	var dto CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	hashedPassword, err := HashPassword(dto.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao criar usuário"})
		return
	}

	userModel := &User{
		Name:     dto.Name,
		Username: dto.Username,
		Email:    dto.Email,
		Password: hashedPassword,
	}

	if err := h.store.CreateUser(userModel); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao criar usuário"})
		return
	}

	responseDTO := UserDTO{
		ID:       userModel.ID,
		Name:     userModel.Name,
		Username: userModel.Username,
	}

	writeJSON(w, http.StatusCreated, responseDTO)
}

func (h *Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "O parâmetro 'q' (busca) é obrigatório"})
		return
	}

	users, err := h.store.SearchUsers(q)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar usuários"})
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

	writeJSON(w, http.StatusOK, dtos)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
		return
	}
	user, err := h.store.GetUserByID(id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Usuário não encontrado"})
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

	writeJSON(w, http.StatusOK, userDTO)
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	user, err := h.store.GetUserByID(userID)
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

	writeJSON(w, http.StatusOK, userDTO)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")

	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	user := User{ID: userID}
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	if err := h.store.UpdateUser(&user); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao atualizar usuário"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Usuário atualizado com sucesso"})
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")
	if userIDAny == nil {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Erro de sessão", http.StatusUnauthorized)
		return
	}

	if err := h.store.DeleteUser(userID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao deletar usuário"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Usuário deletado com sucesso"})
}

func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")
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

	err = h.store.AddFavorite(userID, tmdbID)
	if err != nil {
		http.Error(w, "Erro ao favoritar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")
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

	err = h.store.RemoveFavorite(userID, tmdbID)
	if err != nil {
		http.Error(w, "Erro ao remover favorito", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
