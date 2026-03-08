package users

import (
	"errors"
	"gorm.io/gorm"
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
	result := s.db.First(&user, id)
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

func (s *Store) DeleteUser(id int) error {
	result := s.db.Delete(&User{}, id)
	return result.Error
}
