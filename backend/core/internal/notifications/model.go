package notifications

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uint      `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	Link      string    `json:"link"`
	CreatedAt time.Time `json:"created_at"`
}
