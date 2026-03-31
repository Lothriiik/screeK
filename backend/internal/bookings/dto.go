package bookings

import (
	"time"
	"github.com/StartLivin/screek/backend/internal/platform/validation"
	"github.com/google/uuid"
)

type SessionResponseDTO struct {
	ID          int         `json:"id"`
	StartTime   time.Time   `json:"start_time"`
	Price       int		    `json:"price"`
	RoomType    string      `json:"room_type"`
	SessionType string      `json:"session_type"`
}

type CinemaSessionsResponseDTO struct {
	CinemaID    int                    `json:"cinema_id"`
	CinemaName  string                 `json:"cinema_name"`
	CinemaCity  string                 `json:"cinema_city"`
	Sessions    []SessionResponseDTO   `json:"sessions"`
}

type TicketRequest struct {
	SeatID int        `json:"seat_id"`
	Type   TicketType `json:"type" validate:"required,oneof=STANDARD HALF FREE"`
}

type ReserveRequestDTO struct {
	SessionID        int             `json:"session_id" validate:"required"`
	TicketsRequested []TicketRequest `json:"tickets_request" validate:"required,min=1"`
}

type PayRequestDTO struct {
	PaymentMethod string `json:"payment_method" validate:"required"`
}

type TicketResponseDTO struct {
	ID        uuid.UUID  `json:"ticket_id"`
	MovieName string     `json:"movie_name"`
	Cinema    string     `json:"cinema"`
	Date      string     `json:"date"`
	Room      string     `json:"room"`
	Seat      string     `json:"seat"`
	Status    string     `json:"status"`
    QRCode    string     `json:"qr_code,omitempty"`
}

type ReserveResponseDTO struct {
	Message            string    `json:"message"`
	TransactionID       uuid.UUID `json:"transaction_id"`
	ValorTotalCentavos int       `json:"valor_total_centavos"`
}

type PayResponseDTO struct {
	Message      string `json:"message"`
	ClientSecret string `json:"client_secret"`
}

func (d *ReserveRequestDTO) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *PayRequestDTO) Validate() error {
	return validation.Validate.Struct(d)
}
