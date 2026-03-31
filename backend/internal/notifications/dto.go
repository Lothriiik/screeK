package notifications

import (
	"github.com/google/uuid"
)

type WatchlistMatchDTO struct {
	UserID     uuid.UUID
	MovieID    int
	MovieTitle string
	City       string
	Type       string
}
