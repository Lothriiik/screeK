package notifications

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"
)

type NotificationService struct {
	repo NotificationRepository
	hub  *Hub
}

func NewService(repo NotificationRepository, hub *Hub) *NotificationService {
	return &NotificationService{repo: repo, hub: hub}
}

func (s *NotificationService) Notify(ctx context.Context, userID uuid.UUID, nType, title, message, link string) error {
	notification := &Notification{
		UserID:  userID,
		Type:    nType,
		Title:   title,
		Message: message,
		Link:    link,
	}

	if err := s.repo.CreateNotification(ctx, notification); err != nil {
		return err
	}

	// Tentar enviar via WebSocket
	payload, err := json.Marshal(notification)
	if err == nil {
		s.hub.SendToUser(userID, payload)
	} else {
		log.Printf("Erro ao serializar notificação: %v", err)
	}

	return nil
}

func (s *NotificationService) GetUserNotifications(ctx context.Context, userID uuid.UUID) ([]Notification, error) {
	return s.repo.GetUserNotifications(ctx, userID, 20)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, userID uuid.UUID, id uint) error {
	return s.repo.MarkAsRead(ctx, userID, id)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}
