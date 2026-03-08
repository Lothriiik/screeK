package users

import (
	"encoding/json"
	"net/http"
	"strconv"
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

	writeJSON(w, http.StatusOK, users)
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
	writeJSON(w, http.StatusOK, user)
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

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
