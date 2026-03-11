package auth

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	userRepo users.UserRepository
	jwt      *JWTService
	redis    *redis.Client
}

func NewHandler(userRepo users.UserRepository, jwt *JWTService, redisClient *redis.Client) *Handler {
	return &Handler{userRepo: userRepo, jwt: jwt, redis: redisClient}
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

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 8 {
		http.Error(w, "Token Ausente", http.StatusUnauthorized)
		return
	}
	tokenString := authHeader[7:]

	claims, err := h.jwt.ValidateToken(tokenString)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	expirationTime := claims.ExpiresAt.Time
	timeUntilExpiry := expirationTime.Sub(time.Now())

	if timeUntilExpiry > 0 {
		err := h.redis.Set(r.Context(), "blacklist:"+tokenString, "true", timeUntilExpiry).Err()
		if err != nil {
			http.Error(w, "Erro ao processar logout no servidor", http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Logout efetuado com sucesso!"})
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var forgotPasswordDTO ForgotPasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&forgotPasswordDTO); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetUserByEmail(forgotPasswordDTO.Email)
	if err != nil {
		http.Error(w, "Usuário não encontrado", http.StatusUnauthorized)
		return
	}

	token, err := h.jwt.GeneratePasswordResetToken(user.ID)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
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

	claims, err := h.jwt.ValidateToken(resetPasswordDTO.Token)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	user, err := h.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		http.Error(w, "Usuário não encontrado", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(resetPasswordDTO.NewPassword)); err == nil {
		http.Error(w, "A nova senha não pode ser igual à senha antiga", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(resetPasswordDTO.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro ao processar nova senha", http.StatusInternalServerError)
		return
	}

	user.Password = string(hashedPassword)
	if err := h.userRepo.UpdateUser(user); err != nil {
		http.Error(w, "Erro ao atualizar senha", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Senha atualizada com sucesso!"})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
