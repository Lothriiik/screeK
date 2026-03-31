package catalog

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MovieLog struct {
	UserID    uuid.UUID    `json:"user_id" gorm:"type:uuid;primaryKey"`
	MovieID   uint         `json:"movie_id" gorm:"primaryKey;autoIncrement:false"`
	Watched   bool         `json:"watched" gorm:"not null"`
	Rating    float64      `json:"rating" gorm:"not null"`
	Liked     bool         `json:"liked" gorm:"not null"`
	CreatedAt time.Time    `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt time.Time    `json:"updated_at" gorm:"not null;default:now()"`

	User  users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type MovieList struct {
	ID          uint            `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uuid.UUID       `json:"user_id" gorm:"type:uuid;not null"`
	Title       string          `json:"title" gorm:"not null"`
	IsPublic    bool            `json:"is_public" gorm:"not null;default:true"`
	Description string          `json:"description" gorm:"not null"`
	CreatedAt   time.Time       `json:"created_at" gorm:"not null;default:now()"`
	
	User  users.User      `json:"user" gorm:"foreignKey:UserID"`
	Items []MovieListItem `json:"items" gorm:"foreignKey:ListID"`
}

type MovieListItem struct {
	ID      uint         `json:"id" gorm:"primaryKey;autoIncrement"`
	ListID  uint         `json:"list_id" gorm:"not null"`
	MovieID uint         `json:"movie_id" gorm:"not null"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	
	List  MovieList    `json:"list" gorm:"foreignKey:ListID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

type WatchlistItem struct {
	UserID  uuid.UUID    `json:"user_id" gorm:"type:uuid;primaryKey"`
	MovieID uint         `json:"movie_id" gorm:"primaryKey;autoIncrement:false"`
	AddedAt time.Time    `json:"added_at" gorm:"not null;default:now()"`
	
	User  users.User   `json:"user" gorm:"foreignKey:UserID"`
	Movie movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&MovieLog{},
		&MovieList{}, &MovieListItem{},
		&WatchlistItem{},
	)
}
