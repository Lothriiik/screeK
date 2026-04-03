package notifications

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var _ NotificationRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateNotification(ctx context.Context, notification *Notification) error {
	return s.db.WithContext(ctx).Create(notification).Error
}

func (s *Store) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]Notification, error) {
	var n []Notification
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&n).Error
	return n, err
}

func (s *Store) MarkAsRead(ctx context.Context, userID uuid.UUID, notificationID uint) error {
	return s.db.WithContext(ctx).
		Model(&Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (s *Store) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.db.WithContext(ctx).
		Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
