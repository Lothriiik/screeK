package store

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateNotification(ctx context.Context, n *notifications.Notification) error {
	record := ToRecord(n)
	if err := s.db.WithContext(ctx).Create(record).Error; err != nil {
		return err
	}
	n.ID = record.ID
	return nil
}

func (s *Store) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]notifications.Notification, error) {
	var records []NotificationRecord
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&records).Error
	return ToList(records), err
}

func (s *Store) MarkAsRead(ctx context.Context, userID uuid.UUID, notificationID uint) error {
	return s.db.WithContext(ctx).
		Model(&NotificationRecord{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (s *Store) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.db.WithContext(ctx).
		Model(&NotificationRecord{}).
		Where("user_id = ?", userID).
		Update("is_read", true).Error
}

func (s *Store) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Model(&NotificationRecord{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}
