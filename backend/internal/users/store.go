package users

import (
	"errors"
	"gorm.io/gorm"
)

var _ UserRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateUser(user *User) error {
	result := s.db.Create(user)
	return result.Error
}

func (s *Store) GetUserByID(id int) (*User, error) {
	var user User
	result := s.db.Preload("FavoriteMovies").First(&user, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) SearchUsers(query string) ([]User, error) {
	var users []User
	pattern := "%" + query + "%"
	result := s.db.Where("username ILIKE ? OR name ILIKE ?", pattern, pattern).Find(&users)
	return users, result.Error
}

func (s *Store) UpdateUser(user *User) error {
	result := s.db.Save(user)
	return result.Error
}

func (s *Store) DeleteUser(id int) error {
	result := s.db.Delete(&User{}, id)
	return result.Error
}

func (s *Store) AddFavorite(userID int, movieID int) error {
	result := s.db.Exec("INSERT INTO user_favorite_movies (user_id, movie_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userID, movieID)
	return result.Error
}

func (s *Store) RemoveFavorite(userID int, movieID int) error {
	result := s.db.Exec("DELETE FROM user_favorite_movies WHERE user_id = ? AND movie_id = ?", userID, movieID)
	return result.Error
}

func (s *Store) Login(user *User) error {
	result := s.db.Where("username = ?", user.Username).First(&user)
	return result.Error
}

func (s *Store) GetUserByUsername(username string) (*User, error) {
	var user User
	result := s.db.Where("username = ?", username).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) GetUserByEmail(email string) (*User, error) {
	var user User
	result := s.db.Where("email = ?", email).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, result.Error
}

func (s *Store) EmailExists(email string) (bool, error) {
	var count int64
	err := s.db.Model(&User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

func (s *Store) UsernameExists(username string) (bool, error) {
	var count int64
	err := s.db.Model(&User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}


