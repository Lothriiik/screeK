package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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
		r.Post("/auth/change-password", h.ChangePassword)
	})
}

// @Success 200 {object} AuthTokenResponse
// @Failure 401 {object} httputil.ErrorResponse "Credenciais inválidas"
// @Router /auth/login [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var dto LoginDTO

	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	token, err := h.svc.Login(r.Context(), dto.Username, dto.Password)
	if err != nil {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Usuário ou senha inválidos"})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, AuthTokenResponse{Token: token})
}

// @Success 200 {object} httputil.MessageResponse
// @Failure 401 {object} httputil.ErrorResponse "Token ausente ou inválido"
// @Router /auth/logout [post]
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, httputil.BearerPrefix) {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Token ausente ou mal formatado"})
		return
	}
	tokenString := authHeader[len(httputil.BearerPrefix):]

	if err := h.svc.Logout(r.Context(), tokenString); err != nil {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Logout efetuado com sucesso!"})
}

// @Success 200 {object} httputil.MessageResponse
// @Router /auth/forgot-password [post]
func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var dto ForgotPasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	_ = h.svc.ForgotPassword(r.Context(), dto.Email)

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Se o e-mail estiver cadastrado, as instruções serãos enviadas."})
}

// @Success 200 {object} httputil.MessageResponse
// @Failure 400 {object} httputil.ErrorResponse "Erro na validação ou token expirado"
// @Router /auth/reset-password [post]
func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var dto ResetPasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.svc.ResetPassword(r.Context(), dto.Token, dto.NewPassword); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Senha atualizada com sucesso!"})
}

// @Success 200 {object} httputil.MessageResponse
// @Failure 401 {object} httputil.ErrorResponse "Usuário não autenticado"
// @Router /auth/change-password [post]
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var dto ChangePasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Usuário não autenticado"})
		return
	}

	if err := h.svc.ChangePassword(r.Context(), userID, dto.OldPassword, dto.Password); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Senha alterada com sucesso"})
}
