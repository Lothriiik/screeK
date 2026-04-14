package cinema

import "time"

type CinemaSummary struct {
	ID      int
	Name    string
	City    string
	Address string
}

type SessionSummary struct {
	ID          int
	MovieTitle  string
	RoomName    string
	StartTime   time.Time
	Price       int
	SessionType string
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
