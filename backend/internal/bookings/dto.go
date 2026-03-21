package bookings

import "time"

type SessionResponse struct {
	ID          int         `json:"id"`
	StartTime   time.Time   `json:"start_time"`
	Price       float64     `json:"price"`
	RoomType    RoomType    `json:"room_type"`
	SessionType SessionType `json:"session_type"`
}

type CinemaSessionsResponse struct {
	CinemaID    int               `json:"cinema_id"`
	CinemaName  string            `json:"cinema_name"`
	CinemaCity  string            `json:"cinema_city"`
	Sessions    []SessionResponse `json:"sessions"`
}
