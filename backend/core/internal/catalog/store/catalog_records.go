package store

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MovieLogRecord struct {
	UserID    uuid.UUID    `gorm:"type:uuid;primaryKey"`
	MovieID   uint         `gorm:"primaryKey;autoIncrement:false"`
	Watched   bool         `gorm:"not null"`
	Rating    float64      `gorm:"not null"`
	Liked     bool         `gorm:"not null"`
	CreatedAt time.Time    `gorm:"not null;default:now()"`
	UpdatedAt time.Time    `gorm:"not null;default:now()"`

	User  userstore.UserRecord `gorm:"foreignKey:UserID"`
	Movie movies.Movie         `gorm:"foreignKey:MovieID"`
}

type MovieListRecord struct {
	ID          uint                `gorm:"primaryKey;autoIncrement"`
	UserID      uuid.UUID           `gorm:"type:uuid;not null"`
	Title       string              `gorm:"not null"`
	IsPublic    bool                `gorm:"not null;default:true"`
	Description string              `gorm:"not null"`
	CreatedAt   time.Time           `gorm:"not null;default:now()"`
	
	User  userstore.UserRecord     `gorm:"foreignKey:UserID"`
	Items []MovieListItemRecord    `gorm:"foreignKey:ListID"`
}

type MovieListItemRecord struct {
	ID      uint         `gorm:"primaryKey;autoIncrement"`
	ListID  uint         `gorm:"not null"`
	MovieID uint         `gorm:"not null"`
	AddedAt time.Time    `gorm:"not null;default:now()"`
	
	List  MovieListRecord `gorm:"foreignKey:ListID"`
	Movie movies.Movie    `gorm:"foreignKey:MovieID"`
}

type WatchlistItemRecord struct {
	UserID  uuid.UUID    `gorm:"type:uuid;primaryKey"`
	MovieID uint         `gorm:"primaryKey;autoIncrement:false"`
	AddedAt time.Time    `gorm:"not null;default:now()"`
	
	User  userstore.UserRecord `gorm:"foreignKey:UserID"`
	Movie movies.Movie         `gorm:"foreignKey:MovieID"`
}

type MovieStatsRecord struct {
	MovieID       uint    `gorm:"primaryKey"`
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
	TotalLikes    int     `json:"total_likes"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&MovieLogRecord{},
		&MovieListRecord{}, &MovieListItemRecord{},
		&WatchlistItemRecord{},
		&MovieStatsRecord{},
	)
}
