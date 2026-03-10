package auth

import (
	"encoding/json"
	"net/http"

	"github.com/StartLivin/cine-pass/backend/internal/users"
	"golang.org/x/crypto/bcrypt"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	userRepo users.UserRepository
	jwt      *JWTService
}

func NewHandler(userRepo users.UserRepository, jwt *JWTService) *Handler {
	return &Handler{userRepo: userRepo, jwt: jwt}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/auth/login", h.Login)
}


func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var logindto LoginDTO

	if err := json.NewDecoder(r.Body).Decode(&logindto); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetUserByUsername(logindto.Username)
	if err != nil {
		http.Error(w, "Usuário ou senha inválidos", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(logindto.Password)); err != nil {
		http.Error(w, "Usuário ou senha inválidos", http.StatusUnauthorized)
		return
	}

	token, err := h.jwt.GenerateToken(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
