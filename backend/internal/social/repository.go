package social

import (
	"context"

	"github.com/google/uuid"
)

type SocialRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	CreatePost(ctx context.Context, post *Post) error
	GetFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error)
	ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error)
}