package notifications

import (
	"context"

	"github.com/google/uuid"
)

type NotificationRepository interface {
	CreateNotification(ctx context.Context, notification *Notification) error
	GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]Notification, error)
	MarkAsRead(ctx context.Context, userID uuid.UUID, notificationID uint) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
}
