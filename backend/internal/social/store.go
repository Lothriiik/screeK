package social

import (
	"context"
	"errors"

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

func (s *Store) ReplyPost(ctx context.Context, userID uint, parentID uint, content string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var parent Post
		if err := tx.First(&parent, parentID).Error; err != nil {
			return errors.New("O Post que você está tentando comentar não existe ou foi apagado")
		}

		reply := Post{
			UserID:   userID,
			PostType: PostTypeText,
			Content:  content,
			ParentID: &parentID,
		}
		if err := tx.Create(&reply).Error; err != nil {
			return err
		}

		if err := tx.Model(&parent).UpdateColumn("replies_count", gorm.Expr("replies_count + ?", 1)).Error; err != nil {
			return err
		}

		return nil
	})
}


