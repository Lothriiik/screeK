package catalog

import (
	"errors"
	"github.com/StartLivin/screek/backend/internal/platform/validation"
)

type LogMovieRequest struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=5"`
	Liked   bool    `json:"liked"`
}

type AddWatchlistRequest struct {
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

type CreateMovieListRequest struct {
	Title       string `json:"title" validate:"required,max=100"`
	Description string `json:"description" validate:"max=500"`
	IsPublic    bool   `json:"is_public"`
}

type AddMovieToListRequest struct {
	MovieID uint `json:"movie_id" validate:"required"`
}

func (dto *LogMovieRequest) Validate() error {
	if err := validation.Validate.Struct(dto); err != nil {
		return errors.New("erro de validação: a nota (rating) deve estar entre 0 e 5")
	}
	return nil
}