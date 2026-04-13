package store

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRecord struct {
	ID             uuid.UUID      	`json:"id" gorm:"type:uuid;primaryKey"`
	Username       string       	`json:"username" gorm:"not null;uniqueIndex"`
	Name           string        	`json:"name" gorm:"not null"`
	Email          string        	`json:"email" gorm:"not null;uniqueIndex"`
	Password       string        	`json:"-" gorm:"not null"`
	Bio            string        	`json:"bio"`
	AvatarURL      string         	`json:"avatar_url"`
	Pronouns       string        	`json:"pronouns"`
	Role           httputil.Role  	`json:"role" gorm:"type:varchar(20);default:'USER'"`
	DefaultCity    string         	`json:"default_city"`
	FavoriteMovies []movies.Movie	`json:"favorite_movies" gorm:"many2many:user_favorite_movies;"`
	IsActive       bool           	`json:"is_active" gorm:"not null;default:true"`
	CreatedAt      time.Time      	`json:"created_at" gorm:"not null;default:now()"`
}


type UserStatsRecord struct {
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;primaryKey"`
	TotalMovies  int       `json:"total_movies" gorm:"not null;default:0"`
	TotalMinutes int       `json:"total_minutes" gorm:"not null;default:0"`
	TopGenreID   *int      `json:"top_genre_id" gorm:"index"`
	LastRecalcAt time.Time `json:"last_recalc_at" gorm:"not null;default:now()"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"not null;default:now()"`

	User  UserRecord          `json:"-" gorm:"foreignKey:UserID"`
	Genre *movies.Genre `json:"genre,omitempty" gorm:"foreignKey:TopGenreID"`
}


func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&UserRecord{}, &UserStatsRecord{})
}
