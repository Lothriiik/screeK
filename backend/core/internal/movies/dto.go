package movies

type MovieDTO struct {
	ID            int    `json:"id"`
	TMDBID        int    `json:"tmdb_id"`
	Title         string `json:"title"`
	PosterURL     string `json:"poster_url"`
	IsPremiere    bool   `json:"is_premiere"`
	IsRescreening bool   `json:"is_rescreening"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
