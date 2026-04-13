package handler

import (
	"encoding/json"
	"net/http"

	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AdminHandler struct {
	service *auth.AuthService
}

func NewAdminHandler(s *auth.AuthService) *AdminHandler {
	return &AdminHandler{service: s}
}

func (h *AdminHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(httputil.CheckRole(httputil.RoleAdmin))

		r.Patch("/admin/users/{id}/role", h.UpdateUserRole)
	})
}

// @Summary Atualizar papel do usuário
// @Description Altera o nível de acesso (Role) de um usuário (Apenas Admin)
// @Tags Auth (Admin)
// @Accept json
// @Param id path string true "ID do Usuário (UUID)"
// @Param request body auth.UpdateRoleDTO true "Novo Papel"
// @Success 200 {object} httputil.MessageResponse
// @Router /admin/users/{id}/role [patch]
func (h *AdminHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de usuário inválido"})
		return
	}

	var req auth.UpdateRoleDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}

	if err := req.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.service.UpdateUserRole(r.Context(), userID, httputil.Role(req.Role)); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Perfil do usuário atualizado com sucesso!"})
}
