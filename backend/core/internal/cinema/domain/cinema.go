package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomType string

const (
	RoomTypeStandard RoomType = "STANDARD"
	RoomTypeIMAX     RoomType = "IMAX"
	RoomTypeVIP      RoomType = "VIP"
)

type Cinema struct {
	ID        int            `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string         `json:"name" gorm:"not null"`
	Address   string         `json:"address" gorm:"not null"`
	City      string         `json:"city" gorm:"not null;index"`
	Phone     string         `json:"phone"`
	Email     string         `json:"email"`
	CreatedAt time.Time      `json:"created_at" gorm:"not null;default:now()"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"not null;default:now()"`

	Rooms []Room `json:"rooms,omitempty" gorm:"foreignKey:CinemaID"`
}

type Room struct {
	ID       int      `json:"id" gorm:"primaryKey;autoIncrement"`
	CinemaID int      `json:"cinema_id" gorm:"not null;index"`
	Name     string   `json:"name" gorm:"not null"`
	Capacity int      `json:"capacity" gorm:"not null"`
	Type     RoomType `json:"type" gorm:"type:varchar(20);default:'STANDARD'"`

	Cinema Cinema `json:"-" gorm:"foreignKey:CinemaID"`
	Seats  []Seat `json:"seats,omitempty" gorm:"foreignKey:RoomID"`
}

type CinemaManager struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	CinemaID  int       `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&Cinema{}, &Room{}, &CinemaManager{}, &Seat{}, &Session{})
}
