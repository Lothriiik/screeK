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
	ID          int
	MovieID     int
	RoomID      int
	StartTime   time.Time
	Price       int
	SessionType SessionType
	IsFree      bool
	Room        Room
}
