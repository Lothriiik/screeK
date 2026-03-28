package social

import "context"

type SocialRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	CreatePost(ctx context.Context, post *Post) error
}