package social

import (
	"context"

	"gorm.io/gorm"
)

var _ SocialRepository = (*Store)(nil)


type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) UpsertMovieLog(ctx context.Context, log *MovieLog) error {
	return s.db.WithContext(ctx).Save(log).Error
}

func (s *Store) CreatePost(ctx context.Context, post *Post) error {
	return s.db.WithContext(ctx).Create(post).Error
}

func (s *Store) GetFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error) {
	var posts []Post

	query := s.db.WithContext(ctx).Model(&Post{})

	if cursorID > 0 {
		query = query.Where("id < ?", cursorID)
	}

	err := query.
		Preload("User").
		Order("id DESC").
		Limit(limit).
		Find(&posts).Error

	return posts, err
}

