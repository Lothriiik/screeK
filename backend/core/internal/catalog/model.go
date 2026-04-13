package catalog

import (
	"time"

	"github.com/google/uuid"
)

type MovieLog struct {
	UserID    uuid.UUID
	MovieID   uint
	Watched   bool
	Rating    float64
	Liked     bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type MovieList struct {
	ID          uint
	UserID      uuid.UUID
	Title       string
	IsPublic    bool
	Description string
	Items       []MovieListItem
	CreatedAt   time.Time
}

type MovieListItem struct {
	ID      uint
	ListID  uint
	MovieID uint
	AddedAt time.Time
}

type WatchlistItem struct {
	UserID  uuid.UUID
	MovieID uint
	AddedAt time.Time
}

type MovieStats struct {
	MovieID       uint
	AverageRating float64
	TotalReviews  int
	TotalLikes    int
}
