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
	ID        int
	Name      string
	Address   string
	City      string
	Phone     string
	Email     string
	CreatedAt time.Time
	UpdatedAt time.Time
	Rooms     []Room
}

type Room struct {
	ID       int
	CinemaID int
	Name     string
	Capacity int
	Type     RoomType
	Seats    []Seat
}

type Seat struct {
	ID         int
	RoomID     int
	Row        string
	Number     int
	PosX       int
	PosY       int
	Type       string
	IsOccupied bool
}

type CinemaManager struct {
	UserID    uuid.UUID
	CinemaID  int
	CreatedAt time.Time
}
