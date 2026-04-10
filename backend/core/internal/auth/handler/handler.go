package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *auth.AuthService
}

func NewHandler(svc *auth.AuthService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Post("/auth/login", h.Login)
	r.Post("/auth/refresh", h.Refresh)
	r.Post("/auth/forgot-password", h.ForgotPassword)
	r.Post("/auth/reset-password", h.ResetPassword)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/auth/logout", h.Logout)
		r.Post("/auth/change-password", h.ChangePassword)
	})
}

// @Summary Login de usuário
// @Description Autentica um usuário e retorna tokens de acesso (JWT) e refresh
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Credenciais"
// @Success 200 {object} AuthTokenResponse
// @Router /auth/login [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req auth.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	resp, err := h.svc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, auth.ErrTooManyAttempts) {
			httputil.WriteJSON(w, http.StatusTooManyRequests, httputil.ErrorResponse{Error: err.Error()})
			return
		}
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Usuário ou senha inválidos"})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, resp)
}

// @Summary Renovar token
// @Description Gera um novo token de acesso a partir de um refresh token válido
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh Token"
// @Success 200 {object} AuthTokenResponse
// @Router /auth/refresh [post]
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req auth.RefreshRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	resp, err := h.svc.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, resp)
}

// @Summary Logout
// @Description Invalida o token de acesso atual
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} httputil.MessageResponse
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

// @Summary Esqueci minha senha
// @Description Envia e-mail com instruções para recuperação de senha
// @Tags Auth
// @Accept json
// @Param request body ForgotPasswordRequest true "E-mail cadastrado"
// @Success 200 {object} httputil.MessageResponse
// @Router /auth/forgot-password [post]
func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req auth.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	_ = h.svc.ForgotPassword(r.Context(), req.Email)

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Se o e-mail estiver cadastrado, as instruções serãos enviadas."})
}

// @Summary Resetar senha
// @Description Define uma nova senha usando o token recebido por e-mail
// @Tags Auth
// @Accept json
// @Param request body ResetPasswordRequest true "Token e nova senha"
// @Success 200 {object} httputil.MessageResponse
// @Router /auth/reset-password [post]
func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req auth.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := h.svc.ResetPassword(r.Context(), req.Token, req.NewPassword); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Senha atualizada com sucesso!"})
}

// @Summary Alterar senha
// @Description Atualiza a senha do usuário logado validando a senha antiga
// @Tags Auth
// @Accept json
// @Param request body ChangePasswordRequest true "Senhas antiga e nova"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /auth/change-password [post]
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req auth.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Usuário não autenticado"})
		return
	}

	if err := h.svc.ChangePassword(r.Context(), userID, req.OldPassword, req.NewPassword); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Senha alterada com sucesso"})
}
