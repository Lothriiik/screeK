package notifications

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Notification struct {
	ID        uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;not null"`
	Type      string     `json:"type" gorm:"not null"`
	Title     string     `json:"title" gorm:"not null"`
	Message   string     `json:"message" gorm:"not null"`
	IsRead    bool       `json:"is_read" gorm:"not null;default:false"`
	Link      string     `json:"link" gorm:"not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;default:now()"`
	
	User users.User `json:"user" gorm:"foreignKey:UserID"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&Notification{})
}
