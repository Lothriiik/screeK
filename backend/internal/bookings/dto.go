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
	RoomType    RoomType    `json:"room_type"`
	SessionType SessionType `json:"session_type"`
}

type CinemaSessionsResponseDTO struct {
	CinemaID    int                    `json:"cinema_id"`
	CinemaName  string                 `json:"cinema_name"`
	CinemaCity  string                 `json:"cinema_city"`
	Sessions    []SessionResponseDTO `json:"sessions"`
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

func (d *ReserveRequestDTO) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *PayRequestDTO) Validate() error {
	return validation.Validate.Struct(d)
}

type TicketResponseDTO struct {
	ID        uuid.UUID  `json:"ticket_id"`
	MovieName string `json:"movie_name"`
	Cinema    string `json:"cinema"`
	Date      string `json:"date"`
	Room   string `json:"room"`
	Seat   string `json:"seat"`
	Status    string `json:"status"`
    QRCode    string `json:"qr_code,omitempty"`
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

type CinemaAdminResponseDTO struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	City    string `json:"city"`
	Address string `json:"address"`
}

type SessionAdminResponseDTO struct {
	ID          int       `json:"id"`
	MovieTitle  string    `json:"movie_title"`
	RoomName    string    `json:"room_name"`
	StartTime   time.Time `json:"start_time"`
	Price       int       `json:"price"`
	SessionType string    `json:"session_type"`
}

type CreateCinemaRequest struct {
	Name    string `json:"name" validate:"required"`
	Address string `json:"address" validate:"required"`
	City    string `json:"city" validate:"required"`
	Phone   string `json:"phone" validate:"required"`
	Email   string `json:"email" validate:"required,email"`
}

func (d *CreateCinemaRequest) Validate() error {
	return validation.Validate.Struct(d)
}

type CreateRoomRequest struct {
	CinemaID int    `json:"cinema_id" validate:"required"`
	Name     string `json:"name" validate:"required"`
	Capacity int    `json:"capacity" validate:"required,min=1"`
	Type     string `json:"type" validate:"required,oneof=STANDARD IMAX VIP"`
}

func (d *CreateRoomRequest) Validate() error {
	return validation.Validate.Struct(d)
}

type CreateSessionRequest struct {
	MovieID     int       `json:"movie_id" validate:"required"`
	RoomID      int       `json:"room_id" validate:"required"`
	StartTime   time.Time `json:"start_time" validate:"required"`
	Price       int       `json:"price" validate:"required,min=0"`
	SessionType string    `json:"session_type" validate:"required,oneof=REGULAR PREMIERE RESCREENING FESTIVAL UNIVERSITY SHOWCASE"`
}

func (d *CreateSessionRequest) Validate() error {
	return validation.Validate.Struct(d)
}
