package catalog

import "errors"

type CreateMovieListRequest struct {
	Title       string
	Description string
	IsPublic    bool
	MovieIDs    []uint
}

type LogMovieRequest struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=10"`
	Liked   bool    `json:"liked"`
}

func (r *LogMovieRequest) Validate() error {
	if r.Rating < 0 || r.Rating > 10 {
		return errors.New("avaliação deve ser entre 0 e 10")
	}
	return nil
}
