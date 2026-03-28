package social

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type LogMovieRequest struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=5"`
	Liked   bool    `json:"liked"`
}

func (dto *LogMovieRequest) Validate() error {
	if err := validate.Struct(dto); err != nil {
		return errors.New("Erro de validação: A nota (rating) deve estar entre 0 e 5")
	}
	return nil
}