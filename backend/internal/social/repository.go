package social

import "context"

type SocialRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	CreatePost(ctx context.Context, post *Post) error
	GetFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error)
	ReplyPost(ctx context.Context, userID uint, parentID uint, content string) error
}