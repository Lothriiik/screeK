package social

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

func (s *Store) ToggleLike(ctx context.Context, userID uint, postID uint) (bool, error) {
	var isLiked bool

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var like PostLike
		
		err := tx.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error
		
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			newLike := PostLike{
				PostID: postID,
				UserID: userID,
			}
			
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&newLike)
			if res.Error != nil {
				return res.Error
			}
			
			if res.RowsAffected > 0 {
				if err := tx.Model(&Post{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count + 1")).Error; err != nil {
					return err
				}
				isLiked = true
			}
			return nil
		}

		res := tx.Delete(&like)
		if res.Error != nil {
			return res.Error
		}

		if res.RowsAffected > 0 {
			if err := tx.Model(&Post{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count - 1")).Error; err != nil {
				return err
			}
			isLiked = false
		}
		
		return nil
	})

	return isLiked, err
}

func (s *Store) ToggleFollow(ctx context.Context, followerID uint, followeeID uint) (bool, error) {
	var isFollowing bool

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if followerID == followeeID {
			return errors.New("Você não pode seguir a si mesmo!")
		}

		var follow Follow
		err := tx.Where("follower_id = ? AND followee_id = ?", followerID, followeeID).First(&follow).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			newFollow := Follow{FollowerID: followerID, FolloweeID: followeeID}
			if res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&newFollow); res.Error != nil {
				return res.Error
			}
			isFollowing = true
			return nil
		}

		if err := tx.Delete(&follow).Error; err != nil {
			return err
		}
		isFollowing = false
		return nil
	})

	return isFollowing, err
}




