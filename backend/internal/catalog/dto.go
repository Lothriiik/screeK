package catalog

import (
	"errors"
)

type LogMovieRequest struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=10"`
	Liked   bool    `json:"liked"`
}

type CreateMovieListRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
}

type AddWatchlistRequest struct {
	MovieID uint `json:"movie_id" validate:"required"`
}

type AddMovieToListRequest struct {
	MovieID uint `json:"movie_id" validate:"required"`
}

type MovieListResponseDTO struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
	ItemCount   int    `json:"item_count"`
	CreatedAt   string `json:"created_at"`
}

type MovieDetailResponseDTO struct {
	ID            int       `json:"id"`
	TMDBID        int       `json:"tmdb_id"`
	Title         string    `json:"title"`
	Overview      string    `json:"overview"`
	PosterURL     string    `json:"poster_url"`
	BackdropURL   string    `json:"backdrop_url,omitempty"`
	ReleaseDate   string    `json:"release_date"`
	Runtime       int       `json:"runtime"`
	AverageRating float64   `json:"average_rating"`
	TotalReviews  int       `json:"total_reviews"`
	TotalLikes    int       `json:"total_likes"`
}

func (r *LogMovieRequest) Validate() error {
	if r.Rating < 0 || r.Rating > 10 {
		return errors.New("avaliação deve ser entre 0 e 10")
	}
	return nil
}