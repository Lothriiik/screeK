package social

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type CreatePostRequest struct {
	PostType    string `json:"post_type" validate:"required,oneof=TEXT REVIEW SESSION_SHARE REPOST"`
	Content     string `json:"content" validate:"required,max=280"`
	ReferenceID *uint  `json:"reference_id,omitempty"` 
}

type PostResponseDTO struct {
	ID           uint   `json:"id"`
	Author       string `json:"author"`
	PostType     string `json:"post_type"`
	Content      string `json:"content"`
	LikesCount   int    `json:"likes_count"`
	RepliesCount int    `json:"replies_count"`
	CreatedAt    string `json:"created_at"`
}

type LogMovieRequest struct {
	Watched bool    `json:"watched"`
	Rating  float64 `json:"rating" validate:"min=0,max=5"`
	Liked   bool    `json:"liked"`
}

type FeedResponse struct {
	Posts      []PostResponseDTO `json:"posts"`
	NextCursor uint              `json:"next_cursor"`
}

func (dto *CreatePostRequest) Validate() error {
	if err := validate.Struct(dto); err != nil {
		return errors.New("Erro de validação: PostType inválido ou conteúdo passou de 280 caracteres")
	}
	return nil
}

func (dto *LogMovieRequest) Validate() error {
	if err := validate.Struct(dto); err != nil {
		return errors.New("Erro de validação: A nota (rating) deve estar entre 0 e 5")
	}
	return nil
}