package recommendation

import (
	"context"

	"github.com/google/uuid"
)

const (
	FeedbackInterested    = "interested"
	FeedbackNotInterested = "not_interested"
)

type FeedbackRepository interface {
	Save(ctx context.Context, userID uuid.UUID, movieID int, feedback string) error
	Delete(ctx context.Context, userID uuid.UUID, movieID int) error
}
