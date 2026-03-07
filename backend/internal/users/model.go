package users

import (
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"gorm.io/gorm"
)

type User struct {
	ID             int            `json:"id" gorm:"primaryKey;autoIncrement"`
	Username       string         `json:"username" gorm:"not null;uniqueIndex"`
	Name           string         `json:"name" gorm:"not null"`
	Email          string         `json:"email" gorm:"not null;uniqueIndex"`
	Password       string         `json:"password" gorm:"not null"`
	Bio            string         `json:"bio"`
	PhotoURL       string         `json:"photo_url"`
	Pronouns       string         `json:"pronouns"`
	DefaultCity    string         `json:"default_city"`
	FavoriteMovies []movies.Movie `json:"favorite_movies" gorm:"many2many:user_favorite_movies;"`
	IsActive       bool           `json:"is_active" gorm:"not null;default:true"`
	CreatedAt      time.Time      `json:"created_at" gorm:"not null;default:now()"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&User{})
}
