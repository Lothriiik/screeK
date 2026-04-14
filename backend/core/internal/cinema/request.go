package cinema

import "time"

type CreateCinemaRequest struct {
	Name    string
	Address string
	City    string
	Phone   string
	Email   string
}

type CreateRoomRequest struct {
	CinemaID int
	Name     string
	Capacity int
	Type     string
}

type CreateSessionRequest struct {
	MovieID     int
	RoomID      int
	StartTime   time.Time
	Price       int
	SessionType string
}
