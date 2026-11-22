package store

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/recommendation"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FeedbackRecord struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey;index:idx_recommendation_feedback_user"`
	MovieID   int       `gorm:"primaryKey;not null"`
	Feedback  string    `gorm:"not null"`
	UpdatedAt time.Time
}

func (FeedbackRecord) TableName() string { return "recommendation_feedbacks" }

type FeedbackStore struct {
	db *gorm.DB
}

func NewFeedbackStore(db *gorm.DB) *FeedbackStore { return &FeedbackStore{db: db} }

func (s *FeedbackStore) Save(ctx context.Context, userID uuid.UUID, movieID int, feedback string) error {
	record := FeedbackRecord{UserID: userID, MovieID: movieID, Feedback: feedback}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "movie_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"feedback", "updated_at"}),
	}).Create(&record).Error
}

func (s *FeedbackStore) Delete(ctx context.Context, userID uuid.UUID, movieID int) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).
		Delete(&FeedbackRecord{}).Error
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&FeedbackRecord{})
}

var _ recommendation.FeedbackRepository = (*FeedbackStore)(nil)
