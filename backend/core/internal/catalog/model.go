package catalog

import (
	"time"

	"github.com/google/uuid"
)

type MovieLog struct {
	UserID    uuid.UUID `json:"user_id"`
	MovieID   uint      `json:"movie_id"`
	Watched   bool      `json:"watched"`
	Rating    float64   `json:"rating"`
	Liked     bool      `json:"liked"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type MovieList struct {
	ID          uint            `json:"id"`
	UserID      uuid.UUID       `json:"user_id"`
	Title       string          `json:"title"`
	IsPublic    bool            `json:"is_public"`
	Description string          `json:"description"`
	Items       []MovieListItem `json:"items"`
	CreatedAt   time.Time       `json:"created_at"`
}

type MovieListItem struct {
	ID      uint      `json:"id"`
	ListID  uint      `json:"list_id"`
	MovieID uint      `json:"movie_id"`
	AddedAt time.Time `json:"added_at"`
}

type WatchlistItem struct {
	UserID  uuid.UUID `json:"user_id"`
	MovieID uint      `json:"movie_id"`
	AddedAt time.Time `json:"added_at"`
}

type MovieStats struct {
	MovieID       uint    `json:"movie_id"`
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
	TotalLikes    int     `json:"total_likes"`
}
