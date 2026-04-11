package cinema

import (
	"time"

	"github.com/google/uuid"
)

type RoomType string

const (
	RoomTypeStandard RoomType = "STANDARD"
	RoomTypeIMAX     RoomType = "IMAX"
	RoomTypeVIP      RoomType = "VIP"
)

type Cinema struct {
	ID        int            `json:"id"`
	Name      string         `json:"name"`
	Address   string         `json:"address"`
	City      string         `json:"city"`
	Phone     string         `json:"phone"`
	Email     string         `json:"email"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	Rooms []Room `json:"rooms,omitempty"`
}

type Room struct {
	ID       int      `json:"id"`
	CinemaID int      `json:"cinema_id"`
	Name     string   `json:"name"`
	Capacity int      `json:"capacity"`
	Type     RoomType `json:"type"`
	Seats  	 []Seat `json:"seats,omitempty"`
}

type CinemaManager struct {
	UserID    uuid.UUID 
	CinemaID  int       
	CreatedAt time.Time 
}

