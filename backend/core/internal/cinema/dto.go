package cinema

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/shared/validation"
)

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

type CreateRoomRequest struct {
	CinemaID int    `json:"cinema_id" validate:"required"`
	Name     string `json:"name" validate:"required"`
	Capacity int    `json:"capacity" validate:"required,min=1"`
	Type     string `json:"type" validate:"required,oneof=STANDARD IMAX VIP"`
}

type CreateSessionRequest struct {
	MovieID     int       `json:"movie_id" validate:"required"`
	RoomID      int       `json:"room_id" validate:"required"`
	StartTime   time.Time `json:"start_time" validate:"required"`
	Price       int       `json:"price" validate:"required,min=0"`
	SessionType string    `json:"session_type" validate:"required,oneof=REGULAR PREMIERE RESCREENING FESTIVAL UNIVERSITY SHOWCASE"`
}

func (d *CreateCinemaRequest) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *CreateRoomRequest) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *CreateSessionRequest) Validate() error {
	return validation.Validate.Struct(d)
}
