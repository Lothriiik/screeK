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

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/users", h.CreateUser)
	r.Get("/users/search", h.SearchUsers)
	r.Get("/users/{id}", h.GetByID)
	r.Put("/users/{id}", h.UpdateUser)
	r.Delete("/users/{id}", h.DeleteUser)
	r.Post("/users/{userID}/favorites/{tmdb_id}", h.AddFavorite)
	r.Delete("/users/{userID}/favorites/{tmdb_id}", h.RemoveFavorite)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	if err := h.store.CreateUser(&user); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao criar usuário"})
		return
	}
	writeJSON(w, http.StatusCreated, user)
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
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Bio:      user.Bio,
		PhotoURL: user.PhotoURL,
		Pronouns: user.Pronouns,
		DefaultCity: user.DefaultCity,
		FavoriteMovies: favoriteMovies,
	}

	writeJSON(w, http.StatusOK, userDTO)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
		return
	}
	user := User{ID: id}
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
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
		return
	}
	if err := h.store.DeleteUser(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao deletar usuário"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Usuário deletado com sucesso"})
}

func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
    tmdbIDStr := chi.URLParam(r, "tmdb_id")

	userID, err1 := strconv.Atoi(userIDStr)
	tmdbID, err2 := strconv.Atoi(tmdbIDStr)

    if err1 != nil || err2 != nil {
        http.Error(w, "IDs inválidos", http.StatusBadRequest)
        return
    }

    err := h.store.AddFavorite(userID, tmdbID)
    if err != nil {
        http.Error(w, "Erro ao favoritar", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	tmdbIDStr := chi.URLParam(r, "tmdb_id")

	userID, err1 := strconv.Atoi(userIDStr)
	tmdbID, err2 := strconv.Atoi(tmdbIDStr)

	if err1 != nil || err2 != nil {
		http.Error(w, "IDs inválidos", http.StatusBadRequest)
		return
	}

	err := h.store.RemoveFavorite(userID, tmdbID)
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
