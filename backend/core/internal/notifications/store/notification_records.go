package store

import (
	"time"

	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRecord struct {
	ID        uint                `gorm:"primaryKey;autoIncrement"`
	UserID    uuid.UUID           `gorm:"type:uuid;not null"`
	Type      string              `gorm:"not null"`
	Title     string              `gorm:"not null"`
	Message   string              `gorm:"not null"`
	IsRead    bool                `gorm:"not null;default:false"`
	Link      string              `gorm:"not null"`
	CreatedAt time.Time           `gorm:"not null;default:now()"`
	
	User userstore.UserRecord `gorm:"foreignKey:UserID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&NotificationRecord{})
}
