package store

import (
	"github.com/StartLivin/screek/backend/internal/notifications"
)

func ToDomain(r *NotificationRecord) *notifications.Notification {
	if r == nil {
		return nil
	}
	return &notifications.Notification{
		ID:        r.ID,
		UserID:    r.UserID,
		Type:      r.Type,
		Title:     r.Title,
		Message:   r.Message,
		IsRead:    r.IsRead,
		Link:      r.Link,
		CreatedAt: r.CreatedAt,
	}
}

func ToList(records []NotificationRecord) []notifications.Notification {
	list := make([]notifications.Notification, len(records))
	for i := range records {
		list[i] = *ToDomain(&records[i])
	}
	return list
}

func ToRecord(d *notifications.Notification) *NotificationRecord {
	if d == nil {
		return nil
	}
	return &NotificationRecord{
		ID:        d.ID,
		UserID:    d.UserID,
		Type:      d.Type,
		Title:     d.Title,
		Message:   d.Message,
		IsRead:    d.IsRead,
		Link:      d.Link,
		CreatedAt: d.CreatedAt,
	}
}
