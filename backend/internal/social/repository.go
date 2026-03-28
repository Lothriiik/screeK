package social

import "context"

type SocialRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	CreatePost(ctx context.Context, post *Post) error
	GetFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error)
	ReplyPost(ctx context.Context, userID uint, parentID uint, content string) error
	ToggleLike(ctx context.Context, userID uint, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uint, followeeID uint) (bool, error)
}