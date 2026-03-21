package auth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	svc *AuthService
}

func NewHandler(svc *AuthService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Post("/auth/login", h.Login)
	r.Post("/auth/forgot-password", h.ForgotPassword)
	r.Post("/auth/reset-password", h.ResetPassword)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/auth/logout", h.Logout)
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var logindto LoginDTO

	if err := json.NewDecoder(r.Body).Decode(&logindto); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	token, err := h.svc.Login(logindto.Username, logindto.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 8 {
		http.Error(w, "Token Ausente", http.StatusUnauthorized)
		return
	}
	tokenString := authHeader[7:]

	if err := h.svc.Logout(r.Context(), tokenString); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Logout efetuado com sucesso!"})
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var forgotPasswordDTO ForgotPasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&forgotPasswordDTO); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	token, err := h.svc.ForgotPassword(forgotPasswordDTO.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var resetPasswordDTO ResetPasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&resetPasswordDTO); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if err := h.svc.ResetPassword(resetPasswordDTO.Token, resetPasswordDTO.NewPassword); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Senha atualizada com sucesso!"})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
