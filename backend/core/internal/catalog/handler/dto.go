package handler

type LogMovieRequestDTO struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=10"`
	Liked   bool    `json:"liked"`
}

type AddWatchlistRequestDTO struct {
	MovieID uint `json:"movie_id" validate:"required"`
}

type AddMovieToListRequestDTO struct {
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

type CreateMovieListRequestDTO struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	MovieIDs    []uint `json:"movie_ids"`
	IsPublic    bool   `json:"is_public"`
}

type MovieDetailResponseDTO struct {
	ID            int     `json:"id"`
	TMDBID        int     `json:"tmdb_id"`
	Title         string  `json:"title"`
	Overview      string  `json:"overview"`
	PosterURL     string  `json:"poster_url"`
	BackdropURL   string  `json:"backdrop_url,omitempty"`
	ReleaseDate   string  `json:"release_date"`
	Runtime       int     `json:"runtime"`
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
	TotalLikes    int     `json:"total_likes"`
}

type WatchlistItemResponseDTO struct {
	AddedAt string          `json:"added_at"`
	Movie   MovieSummaryDTO `json:"movie"`
}

type MovieSummaryDTO struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	PosterURL   string `json:"poster_url"`
	ReleaseYear int    `json:"release_year"`
}

type MovieLogResponseDTO struct {
	MovieID   uint                   `json:"movie_id"`
	Watched   bool                   `json:"watched"`
	Rating    float64                `json:"rating"`
	Liked     bool                   `json:"liked"`
	UpdatedAt string                 `json:"updated_at"`
	Movie     MovieDetailResponseDTO `json:"movie"`
}
