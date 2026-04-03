package social

import (
	"errors"

	"github.com/StartLivin/screek/backend/internal/platform/validation"
)

type CreatePostRequest struct {
	PostType    string `json:"post_type" validate:"required,oneof=TEXT REVIEW SESSION_SHARE REPOST"`
	Content     string `json:"content" validate:"required,max=280"`
	IsSpoiler   bool   `json:"is_spoiler"`
	ReferenceID *uint  `json:"reference_id,omitempty"` 
}

type UpdatePostRequest struct {
	Content   string `json:"content" validate:"required,max=280"`
	IsSpoiler bool   `json:"is_spoiler"`
}

type PostResponseDTO struct {
	ID           uint             `json:"id"`
	Author       string           `json:"author"`
	PostType     string           `json:"post_type"`
	Content      string           `json:"content"`
	IsSpoiler    bool             `json:"is_spoiler"`
	LikesCount   int              `json:"likes_count"`
	RepliesCount int              `json:"replies_count"`
	CreatedAt    string           `json:"created_at"`
	SessionData  *PostSessionData `json:"session_data,omitempty"`
}

type PostSessionData struct {
	SessionID int    `json:"session_id"`
	MovieTitle string `json:"movie_title"`
	PosterURL  string `json:"poster_url"`
	StartTime  string `json:"start_time"`
	RoomName   string `json:"room_name"`
	CinemaName string `json:"cinema_name"`
}

type FeedResponse struct {
	Posts      []PostResponseDTO `json:"posts"`
	NextCursor uint              `json:"next_cursor"`
}

type ReplyRequest struct {
	Content string `json:"content" validate:"required,max=280"`
}

type ToggleLikeResponse struct {
	Message string `json:"message"`
	Liked   bool   `json:"liked"`
}

type ToggleFollowResponse struct {
	Message     string `json:"message"`
	IsFollowing bool   `json:"is_following"`
}

type PostDetailResponseDTO struct {
	Post    PostResponseDTO   `json:"post"`
	Replies []PostResponseDTO `json:"replies"`
}

type UserFollowResponseDTO struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

func (dto *ReplyRequest) Validate() error {
	if err := validation.Validate.Struct(dto); err != nil {
		return errors.New("erro de validação: o conteúdo da resposta ultrapassou 280 caracteres")
	}
	return nil
}

func (dto *CreatePostRequest) Validate() error {
	if err := validation.Validate.Struct(dto); err != nil {
		return errors.New("erro de validação: PostType inválido ou conteúdo passou de 280 caracteres")
	}

	isReviewOrSession := dto.PostType == "REVIEW" || dto.PostType == "SESSION_SHARE"
	
	if isReviewOrSession && dto.ReferenceID == nil {
		return errors.New("erro de validação: posts do tipo REVIEW ou SESSION_SHARE obrigam o envio de um reference_id válido")
	}

	if dto.PostType == "TEXT" && dto.ReferenceID != nil {
		return errors.New("erro de validação: posts do tipo TEXT não podem ter um reference_id")
	}

	return nil
}

func (dto *UpdatePostRequest) Validate() error {
	if err := validation.Validate.Struct(dto); err != nil {
		return errors.New("erro de validação: o conteúdo atualizado ultrapassou 280 caracteres")
	}
	return nil
}

