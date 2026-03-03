package store

import (
	"errors"
	"github.com/StartLivin/cine-pass/backend/internal/models"
	"gorm.io/gorm"
)

func (s *GormStore) CreateUser(user *models.User) error {
	result := s.db.Create(user)
	return result.Error
}

func (s *GormStore) GetUserByID(id int) (*models.User, error) {
	var user models.User
	result := s.db.First(&user, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, errors.New("user not found")
	}
	return &user, result.Error
}

func (s *GormStore) UpdateUser(user *models.User) error {
	result := s.db.Save(user)
	return result.Error
}

func (s *GormStore) DeleteUser(id int) error {
	result := s.db.Delete(&models.User{}, id)
	return result.Error
}
