package store

import (
	"context"

	"github.com/google/uuid"
	"github.com/StartLivin/screek/backend/internal/notifications"
	"gorm.io/gorm"
)

var _ notifications.NotificationRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateNotification(ctx context.Context, notification *notifications.Notification) error {
	return s.db.WithContext(ctx).Create(notification).Error
}

func (s *Store) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]notifications.Notification, error) {
	var n []notifications.Notification
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&n).Error
	return n, err
}

func (s *Store) MarkAsRead(ctx context.Context, userID uuid.UUID, notificationID uint) error {
	return s.db.WithContext(ctx).
		Model(&notifications.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (s *Store) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.db.WithContext(ctx).
		Model(&notifications.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
