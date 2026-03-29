package users

import (
	"time"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleUser    Role = "USER"
	RoleManager Role = "MANAGER"
	RoleAdmin   Role = "ADMIN"
)

type User struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	Username       string         `json:"username" gorm:"not null;uniqueIndex"`
	Name           string         `json:"name" gorm:"not null"`
	Email          string         `json:"email" gorm:"not null;uniqueIndex"`
	Password       string         `json:"-" gorm:"not null"`
	Bio            string         `json:"bio"`
	PhotoURL       string         `json:"photo_url"`
	Pronouns       string         `json:"pronouns"`
	Role           Role           `json:"role" gorm:"type:varchar(20);default:'USER'"`
	DefaultCity    string         `json:"default_city"`
	FavoriteMovies []movies.Movie `json:"favorite_movies" gorm:"many2many:user_favorite_movies;"`
	IsActive       bool           `json:"is_active" gorm:"not null;default:true"`
	CreatedAt      time.Time      `json:"created_at" gorm:"not null;default:now()"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&User{})
}
