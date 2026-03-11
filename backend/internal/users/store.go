package users

import (
	"errors"
	"gorm.io/gorm"
	"github.com/StartLivin/cine-pass/backend/internal/movies"
)

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
		return nil, errors.New("user not found")
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

func (s *Store) DeleteUser(id int, password string) error {
	user, err := s.GetUserByID(id)
	if err != nil {
		return err
	}
	if VerifyPassword(password, user.Password) == false {
		return errors.New("Senha incorreta")
	}
	result := s.db.Delete(&User{}, id)
	return result.Error
}

func (s *Store) AddFavorite(userID int, tmdb_id int) error {
	var movie movies.Movie
	if err := s.db.Where("tmdb_id = ?", tmdb_id).First(&movie).Error; err != nil {
		return errors.New("filme não encontrado na base local")
	}
	result := s.db.Model(&User{ID: userID}).
	Association("FavoriteMovies").
	Append(&movie)

	return result
}

func (s *Store) RemoveFavorite(userID int, tmdb_id int) error {
	var movie movies.Movie
	if err := s.db.Where("tmdb_id = ?", tmdb_id).First(&movie).Error; err != nil {
		return errors.New("filme não encontrado na base local")
	}

	result := s.db.Model(&User{ID: userID}).
		Association("FavoriteMovies").
		Delete(&movie)

	return result
}

func (s *Store) Login(user *User) error {
	result := s.db.Where("username = ?", user.Username).First(&user)
	return result.Error
}

func (s *Store) GetUserByUsername(username string) (*User, error) {
	var user User
	result := s.db.Where("username = ?", username).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, errors.New("user not found")
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

func (s *Store) ChangePassword(id int, oldPassword string, newPassword string) error {
	user, err := s.GetUserByID(id)
	if err != nil {
		return err
	}
	if VerifyPassword(oldPassword, user.Password) == false {
		return errors.New("Senha antiga incorreta")
	}
	user.Password = newPassword
	return s.UpdateUser(user)
}

