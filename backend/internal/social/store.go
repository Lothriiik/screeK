package social

import (
	"context"
	"errors"

	"github.com/google/uuid"

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

func (s *Store) GetPostByID(ctx context.Context, postID uint) (*Post, error) {
	var post Post
	err := s.db.WithContext(ctx).Preload("User").First(&post, postID).Error
	return &post, err
}

func (s *Store) UpdatePost(ctx context.Context, post *Post) error {
	return s.db.WithContext(ctx).Save(post).Error
}

func (s *Store) DeletePost(ctx context.Context, postID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Decrementar replies_count do pai, se existir
		var post Post
		if err := tx.First(&post, postID).Error; err == nil && post.ParentID != nil {
			tx.Model(&Post{}).Where("id = ?", *post.ParentID).UpdateColumn("replies_count", gorm.Expr("replies_count - 1"))
		}

		// 2. Apagar curtidas (PostLike)
		if err := tx.Where("post_id = ?", postID).Delete(&PostLike{}).Error; err != nil {
			return err
		}

		// 3. Apagar o post (e recursivamente os replies)
		if err := tx.Where("parent_id = ?", postID).Delete(&Post{}).Error; err != nil {
			return err
		}

		return tx.Delete(&Post{}, postID).Error
	})
}

func (s *Store) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) ([]Post, error) {
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

func (s *Store) GetFollowingFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) ([]Post, error) {
	var posts []Post

	followingSubquery := s.db.WithContext(ctx).
		Model(&Follow{}).
		Select("followee_id").
		Where("follower_id = ?", userID)

	query := s.db.WithContext(ctx).
		Model(&Post{}).
		Where("user_id IN (?) OR user_id = ?", followingSubquery, userID)

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

func (s *Store) ReplyPost(ctx context.Context, userID uuid.UUID, parentID uint, content string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var parent Post
		if err := tx.First(&parent, parentID).Error; err != nil {
			return errors.New("O Post que você está tentando comentar não existe ou foi apagado")
		}

		reply := Post{
			UserID:   userID,
			PostType: PostType(PostTypeText),
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

func (s *Store) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
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

func (s *Store) ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeID uuid.UUID) (bool, error) {
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

// --- Watchlist ---

func (s *Store) AddToWatchlist(ctx context.Context, item *WatchlistItem) error {
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(item).Error
}

func (s *Store) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&WatchlistItem{}).Error
}

func (s *Store) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	var items []WatchlistItem
	err := s.db.WithContext(ctx).Preload("Movie").Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

// --- MovieLists ---

func (s *Store) CreateMovieList(ctx context.Context, list *MovieList) error {
	return s.db.WithContext(ctx).Create(list).Error
}

func (s *Store) GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error) {
	var lists []MovieList
	err := s.db.WithContext(ctx).Preload("Items").Where("user_id = ?", userID).Find(&lists).Error
	return lists, err
}

func (s *Store) GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error) {
	var list MovieList
	err := s.db.WithContext(ctx).Preload("User").Preload("Items.Movie").First(&list, listID).Error
	return &list, err
}

func (s *Store) AddMovieToList(ctx context.Context, listID uint, movieID uint) error {
	item := MovieListItem{ListID: listID, MovieID: movieID}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&item).Error
}

func (s *Store) RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error {
	return s.db.WithContext(ctx).Where("list_id = ? AND movie_id = ?", listID, movieID).Delete(&MovieListItem{}).Error
}

func (s *Store) DeleteMovieList(ctx context.Context, listID uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Apagar itens da lista
		if err := tx.Where("list_id = ?", listID).Delete(&MovieListItem{}).Error; err != nil {
			return err
		}
		return tx.Delete(&MovieList{}, listID).Error
	})
}
