package domain

import (
    "time"
    "github.com/StartLivin/screek/backend/internal/movies"
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
	ID          int          `json:"id" gorm:"primaryKey;autoIncrement"`
	MovieID     int          `json:"movie_id" gorm:"not null;index"`
	RoomID      int          `json:"room_id" gorm:"not null;index"`
	StartTime   time.Time    `json:"start_time" gorm:"not null;index"`
	Price       int          `json:"price" gorm:"not null"`
	SessionType SessionType  `json:"session_type" gorm:"type:varchar(20);not null;default:'REGULAR'"`
	IsFree      bool         `json:"is_free" gorm:"default:false"`
	Movie       movies.Movie `json:"movie" gorm:"foreignKey:MovieID"`
	Room        Room         `json:"room" gorm:"foreignKey:RoomID"`
}
