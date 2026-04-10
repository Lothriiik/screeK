package domain

import (
	"github.com/google/uuid"
)

type WatchlistMatch struct {
	UserID     uuid.UUID `json:"user_id"`
	MovieID    int       `json:"movie_id"`
	MovieTitle string    `json:"movie_title"`
	City       string    `json:"city"`
	Type       string    `json:"type"`
}
