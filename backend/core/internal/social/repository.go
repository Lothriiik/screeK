package social

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type SocialRepository interface {
	CreatePost(ctx context.Context, post *Post) error
	GetPostByID(ctx context.Context, postID uint) (*Post, error)
	GetPostWithReplies(ctx context.Context, postID uint) (*Post, []Post, error)
	UpdatePost(ctx context.Context, post *Post) error
	DeletePost(ctx context.Context, postID uint) error
	GetGlobalFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error)
	GetFollowingFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) ([]Post, error)
	ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error)
	GetFollowers(ctx context.Context, userID uuid.UUID) ([]users.User, error)
	GetFollowing(ctx context.Context, userID uuid.UUID) ([]users.User, error)
}
