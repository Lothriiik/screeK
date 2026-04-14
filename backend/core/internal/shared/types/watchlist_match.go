package types

import "github.com/google/uuid"

type WatchlistMatch struct {
	UserID     uuid.UUID
	MovieID    int
	MovieTitle string
	City       string
	Type       string
}
