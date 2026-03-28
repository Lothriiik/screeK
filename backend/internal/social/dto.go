package social

type LogMovieRequest struct {
	Watched bool `json:"watched"`
	Rating float64 `json:"rating" validate:"min=0,max=5"`
	Liked bool `json:"liked"`
}