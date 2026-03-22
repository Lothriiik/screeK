package bookings

import "time"

type SessionResponseDTO struct {
	ID          int         `json:"id"`
	StartTime   time.Time   `json:"start_time"`
	Price       int		    `json:"price"`
	RoomType    RoomType    `json:"room_type"`
	SessionType SessionType `json:"session_type"`
}

type CinemaSessionsResponseDTO struct {
	CinemaID    int                    `json:"cinema_id"`
	CinemaName  string                 `json:"cinema_name"`
	CinemaCity  string                 `json:"cinema_city"`
	Sessions    []SessionResponseDTO `json:"sessions"`
}

type ReserveRequestDTO struct {
	SessionID int   `json:"session_id"`
	SeatIDs   []int `json:"seat_ids"`
}

type PayRequestDTO struct {
	PaymentMethod string `json:"payment_method" validate:"required"`
}

type TicketResponseDTO struct {
	ID        int    `json:"ticket_id"`
	MovieName string `json:"movie_name"`
	Cinema    string `json:"cinema"`
	Date      string `json:"date"`
	Room   string `json:"room"`
	Seat   string `json:"seat"`
	Status    string `json:"status"`
    QRCode    string `json:"qr_code,omitempty"`
}
