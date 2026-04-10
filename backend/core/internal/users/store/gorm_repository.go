package store

import (
	"context"
	"errors"
	"time"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var _ users.UserRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateUser(ctx context.Context, user *users.User) error {
	result := s.db.WithContext(ctx).Create(user)
	return result.Error
}

func (s *Store) GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error) {
	var user users.User
	result := s.db.WithContext(ctx).Preload("FavoriteMovies").First(&user, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, users.ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) SearchUsers(ctx context.Context, query string) ([]users.User, error) {
	var users []users.User
	pattern := "%" + query + "%"
	result := s.db.WithContext(ctx).
		Where("is_active = ?", true).
		Where("username ILIKE ? OR name ILIKE ?", pattern, pattern).
		Limit(20).
		Find(&users)
	return users, result.Error
}

func (s *Store) UpdateUser(ctx context.Context, user *users.User) error {
	result := s.db.WithContext(ctx).Save(user)
	return result.Error
}

func (s *Store) DeleteUser(ctx context.Context, id uuid.UUID) error {
	result := s.db.WithContext(ctx).Delete(&users.User{}, id)
	return result.Error
}

func (s *Store) AddFavorite(ctx context.Context, userID uuid.UUID, movieID int) error {
	result := s.db.WithContext(ctx).Exec("INSERT INTO user_favorite_movies (user_id, movie_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userID, movieID)
	return result.Error
}

func (s *Store) RemoveFavorite(ctx context.Context, userID uuid.UUID, movieID int) error {
	result := s.db.WithContext(ctx).Exec("DELETE FROM user_favorite_movies WHERE user_id = ? AND movie_id = ?", userID, movieID)
	return result.Error
}

func (s *Store) GetUserByUsername(ctx context.Context, username string) (*users.User, error) {
	var user users.User
	result := s.db.WithContext(ctx).Where("username = ?", username).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, users.ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*users.User, error) {
	var user users.User
	result := s.db.WithContext(ctx).Where("email = ?", email).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, users.ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&users.User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

func (s *Store) UsernameExists(ctx context.Context, username string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&users.User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func (s *Store) UpdateUserRole(ctx context.Context, userID uuid.UUID, role httputil.Role) error {
	return s.db.WithContext(ctx).Model(&users.User{}).Where("id = ?", userID).Update("role", role).Error
}

func (s *Store) GetUserStats(ctx context.Context, userID uuid.UUID) (*users.UserStats, error) {
	var stats users.UserStats
	err := s.db.WithContext(ctx).Preload("Genre").Where("user_id = ?", userID).First(&stats).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &stats, nil
}

func (s *Store) UpdateUserStats(ctx context.Context, stats *users.UserStats) error {
	return s.db.WithContext(ctx).Save(stats).Error
}

func (s *Store) IncrementUserStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var stats users.UserStats
		if err := tx.Where("user_id = ?", userID).First(&stats).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				stats = users.UserStats{
					UserID:       userID,
					TotalMovies:  movies,
					TotalMinutes: minutes,
					LastRecalcAt: time.Now().Add(-1 * time.Hour),
				}
				return tx.Create(&stats).Error
			}
			return err
		}

		return tx.Model(&stats).Updates(map[string]interface{}{
			"total_movies":  gorm.Expr("total_movies + ?", movies),
			"total_minutes": gorm.Expr("total_minutes + ?", minutes),
			"updated_at":    time.Now(),
		}).Error
	})
}

func (s *Store) GetTopGenreByUsage(ctx context.Context, userID uuid.UUID) (*int, error) {
	var result struct {
		GenreID int
	}

	err := s.db.WithContext(ctx).Raw(`
		SELECT mg.genre_id
		FROM movie_logs ml
		JOIN movie_genres mg ON ml.movie_id = mg.movie_id
		WHERE ml.user_id = ?
		GROUP BY mg.genre_id
		ORDER BY COUNT(*) DESC
		LIMIT 1
	`, userID).Scan(&result).Error

	if err != nil {
		return nil, err
	}

	if result.GenreID == 0 {
		return nil, nil
	}

	return &result.GenreID, nil
}
