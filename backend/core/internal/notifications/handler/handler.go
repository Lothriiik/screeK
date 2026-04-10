package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/notifications/realtime"
	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *notifications.NotificationService
}

func NewHandler(svc *notifications.NotificationService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Get("/ws", h.HandleWS)

		r.Get("/notifications", h.GetNotifications)
		r.Patch("/notifications/{id}/read", h.MarkAsRead)
		r.Post("/notifications/read-all", h.MarkAllAsRead)
	})
}

// HandleWS godoc
// @Summary Conexão WebSocket para Notificações
// @Description Realiza o upgrade HTTP para WebSocket para receber alertas em tempo real.
// @Tags Notifications
// @Security BearerAuth
// @Router /ws [get]
func (h *Handler) HandleWS(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado para WS"})
		return
	}

	log.Printf("Novo cliente WS tentando conectar: %v", userID)
	realtime.ServeWs(h.svc.Hub(), w, r, userID)
}

// GetNotifications godoc
// @Summary Lista notificações do usuário
// @Description Retorna as últimas 20 notificações (lidas e não lidas).
// @Tags Notifications
// @Security BearerAuth
// @Produce json
// @Success 200 {array} Notification
// @Router /notifications [get]
func (h *Handler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	n, err := h.svc.GetUserNotifications(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, n)
}

// MarkAsRead godoc
// @Summary Marca uma notificação como lida
// @Tags Notifications
// @Security BearerAuth
// @Param id path int true "ID da Notificação"
// @Success 200 {object} httputil.MessageResponse
// @Router /notifications/{id}/read [patch]
func (h *Handler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.MarkAsRead(r.Context(), userID, uint(id)); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Notificação lida."})
}

// MarkAllAsRead godoc
// @Summary Marca TODAS como lidas
// @Tags Notifications
// @Security BearerAuth
// @Success 200 {object} httputil.MessageResponse
// @Router /notifications/read-all [post]
func (h *Handler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)

	if err := h.svc.MarkAllAsRead(r.Context(), userID); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Todas as notificações marcadas como lidas."})
}
