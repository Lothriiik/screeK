package catalog

import (
	"time"
)

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

type MovieDetailSummary struct {
	ID            int
	TMDBID        int
	Title         string
	Overview      string
	PosterURL     string
	BackdropURL   string
	ReleaseDate   time.Time
	Runtime       int
	AverageRating float64
	TotalReviews  int
	TotalLikes    int
}

type MovieLogSummary struct {
	MovieID   uint
	Watched   bool
	Rating    float64
	Liked     bool
	UpdatedAt time.Time
	Movie     MovieDetailSummary
}
