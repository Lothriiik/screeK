package cinema

import (
	"time"
)

type SessionType string

const (
	SessionTypeRegular    SessionType = "REGULAR"
	SessionTypePremiere   SessionType = "PREMIERE"
	SessionTypeRescreen   SessionType = "RESCREENING"
	SessionTypeFestival   SessionType = "FESTIVAL"
	SessionTypeUniversity SessionType = "UNIVERSITY"
	SessionTypeShowcase   SessionType = "SHOWCASE"
)

type Session struct {
	ID          int         `json:"id"`
	MovieID     int         `json:"movie_id"`
	RoomID      int         `json:"room_id"`
	StartTime   time.Time   `json:"start_time"`
	Price       int         `json:"price"`
	SessionType SessionType `json:"session_type"`
	IsFree      bool        `json:"is_free"`
	Room        Room        `json:"room"`
}
