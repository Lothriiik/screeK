package catalog

import (
	"errors"
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
	Description string
	IsPublic    bool
	CreatedAt   time.Time
	Items       []MovieListItem
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

type CreateMovieListRequest struct {
	Title       string
	Description string
	IsPublic    bool
	MovieIDs    []uint
}

type LogMovieRequest struct {
	Watched bool
	Rating  float64
	Liked   bool
}

func (r *LogMovieRequest) Validate() error {
	// A escala canônica é 0.5–5.0 (a mesma do Letterboxd).
	// Zero é aceito para representar "assistido, mas sem nota".
	if r.Rating < 0 || r.Rating > 5 {
		return errors.New("avaliação deve ser entre 0 e 5")
	}
	return nil
}

type WatchlistRichItem struct {
	MovieID     uint
	AddedAt     time.Time
	Title       string
	ReleaseYear int
	PosterURL   string
}

type MovieListSummary struct {
	ID          uint
	Title       string
	Description string
	IsPublic    bool
	ItemCount   int
	CreatedAt   time.Time
}

type MovieLogSummary struct {
	MovieID   uint
	Watched   bool
	Rating    float64
	Liked     bool
	UpdatedAt time.Time
	Movie     MovieDetailSummary
}
