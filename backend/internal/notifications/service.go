package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"

	"github.com/StartLivin/screek/backend/internal/domain"
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


func (s *NotificationService) ProcessWatchlistMatches(ctx context.Context, matches []domain.WatchlistMatch) error {
	for _, m := range matches {
		title := "Filme em Reexibição!"
		message := fmt.Sprintf("O filme '%s' está em REEXIBIÇÃO em %s. Garanta seu ingresso!", m.MovieTitle, m.City)
		if m.Type == "PREMIERE" {
			title = "Estreia Confirmada!"
			message = fmt.Sprintf("O filme '%s' ESTREIA em breve em %s. Confira as sessões!", m.MovieTitle, m.City)
		}

		s.Notify(ctx, m.UserID, "WATCHLIST_MATCH", title, message, fmt.Sprintf("/movies/%d", m.MovieID))
	}

	if len(matches) > 0 {
		slog.Info("[Job] Notificações de watchlist enviadas", "total", len(matches))
	}

	return nil
}
