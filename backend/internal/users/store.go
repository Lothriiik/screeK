package users

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var _ UserRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateUser(ctx context.Context, user *User) error {
	result := s.db.WithContext(ctx).Create(user)
	return result.Error
}

func (s *Store) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var user User
	result := s.db.WithContext(ctx).Preload("FavoriteMovies").First(&user, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) SearchUsers(ctx context.Context, query string) ([]User, error) {
	var users []User
	pattern := "%" + query + "%"
	result := s.db.WithContext(ctx).Where("username ILIKE ? OR name ILIKE ?", pattern, pattern).Find(&users)
	return users, result.Error
}

func (s *Store) UpdateUser(ctx context.Context, user *User) error {
	result := s.db.WithContext(ctx).Save(user)
	return result.Error
}

func (s *Store) DeleteUser(ctx context.Context, id uuid.UUID) error {
	result := s.db.WithContext(ctx).Delete(&User{}, id)
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

func (s *Store) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	result := s.db.WithContext(ctx).Where("username = ?", username).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	result := s.db.WithContext(ctx).Where("email = ?", email).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

func (s *Store) UsernameExists(ctx context.Context, username string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}
