package store

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/google/uuid"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var _ social.SocialRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreatePost(ctx context.Context, post *social.Post) error {
	record := ToPostRecord(post)
	if err := s.db.WithContext(ctx).Create(record).Error; err != nil {
		return err
	}
	post.ID = record.ID
	return nil
}

func (s *Store) GetPostByID(ctx context.Context, postID uint) (*social.Post, error) {
	var record PostRecord
	err := s.db.WithContext(ctx).First(&record, postID).Error
	if err != nil {
		return nil, err
	}
	return ToPostDomain(&record), nil
}

func (s *Store) UpdatePost(ctx context.Context, post *social.Post) error {
	record := ToPostRecord(post)
	return s.db.WithContext(ctx).Save(record).Error
}

func (s *Store) DeletePost(ctx context.Context, postID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var post PostRecord
		if err := tx.First(&post, postID).Error; err == nil && post.ParentID != nil {
			tx.Model(&PostRecord{}).Where("id = ?", *post.ParentID).UpdateColumn("replies_count", gorm.Expr("replies_count - 1"))
		}

		if err := tx.Where("post_id = ?", postID).Delete(&PostLikeRecord{}).Error; err != nil {
			return err
		}

		if err := tx.Where("parent_id = ?", postID).Delete(&PostRecord{}).Error; err != nil {
			return err
		}

		return tx.Delete(&PostRecord{}, postID).Error
	})
}

func (s *Store) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) ([]social.Post, error) {
	var records []PostRecord
	query := s.db.WithContext(ctx).Model(&PostRecord{})
	if cursorID > 0 {
		query = query.Where("id < ?", cursorID)
	}
	err := query.Order("id DESC").Limit(limit).Find(&records).Error
	return ToPostList(records), err
}

func (s *Store) GetFollowingFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) ([]social.Post, error) {
	var records []PostRecord
	followingSubquery := s.db.WithContext(ctx).Model(&FollowRecord{}).Select("followee_id").Where("follower_id = ?", userID)
	query := s.db.WithContext(ctx).Model(&PostRecord{}).Where("user_id IN (?) OR user_id = ?", followingSubquery, userID)
	if cursorID > 0 {
		query = query.Where("id < ?", cursorID)
	}
	err := query.Order("id DESC").Limit(limit).Find(&records).Error
	return ToPostList(records), err
}

func (s *Store) ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var parent PostRecord
		if err := tx.First(&parent, parentID).Error; err != nil {
			return errors.New("post original não encontrado")
		}

		reply := PostRecord{
			UserID:   userID,
			PostType: social.PostTypeText,
			Content:  content,
			ParentID: &parentID,
		}
		if err := tx.Create(&reply).Error; err != nil {
			return err
		}

		return tx.Model(&parent).UpdateColumn("replies_count", gorm.Expr("replies_count + 1")).Error
	})
}

func (s *Store) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	var isLiked bool
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var like PostLikeRecord
		err := tx.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			newLike := PostLikeRecord{PostID: postID, UserID: userID}
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&newLike)
			if res.RowsAffected > 0 {
				tx.Model(&PostRecord{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count + 1"))
				isLiked = true
			}
			return res.Error
		}
		res := tx.Delete(&like)
		if res.RowsAffected > 0 {
			tx.Model(&PostRecord{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count - 1"))
			isLiked = false
		}
		return res.Error
	})
	return isLiked, err
}

func (s *Store) ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error) {
	var isFollowing bool
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if followerID == followeeID {
			return errors.New("você não pode seguir a si mesmo")
		}
		var follow FollowRecord
		err := tx.Where("follower_id = ? AND followee_id = ?", followerID, followeeID).First(&follow).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			newFollow := FollowRecord{FollowerID: followerID, FolloweeID: followeeID}
			tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&newFollow)
			isFollowing = true
			return nil
		}
		tx.Delete(&follow)
		isFollowing = false
		return nil
	})
	return isFollowing, err
}

func (s *Store) GetPostWithReplies(ctx context.Context, postID uint) (*social.Post, []social.Post, error) {
	var record PostRecord
	if err := s.db.WithContext(ctx).First(&record, postID).Error; err != nil {
		return nil, nil, err
	}

	var replyRecords []PostRecord
	err := s.db.WithContext(ctx).Where("parent_id = ?", postID).Order("id ASC").Find(&replyRecords).Error
	return ToPostDomain(&record), ToPostList(replyRecords), err
}

func (s *Store) GetFollowers(ctx context.Context, userID uuid.UUID) ([]users.User, error) {
	var userRecords []userstore.UserRecord
	err := s.db.WithContext(ctx).
		Table("users").
		Joins("JOIN follows ON follows.follower_id = users.id").
		Where("follows.followee_id = ?", userID).
		Find(&userRecords).Error
	return userstore.ToUserList(userRecords), err
}

func (s *Store) GetFollowing(ctx context.Context, userID uuid.UUID) ([]users.User, error) {
	var userRecords []userstore.UserRecord
	err := s.db.WithContext(ctx).
		Table("users").
		Joins("JOIN follows ON follows.followee_id = users.id").
		Where("follows.follower_id = ?", userID).
		Find(&userRecords).Error
	return userstore.ToUserList(userRecords), err
}
