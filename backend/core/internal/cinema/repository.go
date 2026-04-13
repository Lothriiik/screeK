package cinema

import (
	"context"
	"time"

	"github.com/google/uuid"
)


type CinemaRepository interface {
	CreateCinema(ctx context.Context, cinema *Cinema) error
	GetCinemaByID(ctx context.Context, id int) (*Cinema, error)
	UpdateCinema(ctx context.Context, cinema *Cinema) error
	DeleteCinema(ctx context.Context, id int) error
	ListCinemas(ctx context.Context) ([]Cinema, error)

	CreateRoom(ctx context.Context, room *Room, seats []Seat) error
	GetRoomByID(ctx context.Context, id int) (*Room, error)
	UpdateRoom(ctx context.Context, room *Room) error
	DeleteRoom(ctx context.Context, id int) error

	CreateSession(ctx context.Context, session *Session) error
	CreateSessionWithOverlapCheck(ctx context.Context, session *Session, movieRuntime int) error
	UpdateSession(ctx context.Context, session *Session) error
	UpdateSessionWithOverlapCheck(ctx context.Context, session *Session, movieRuntime int) error
	ListSessions(ctx context.Context, cinemaID int, date string) ([]Session, error)
	GetSessionsByRoom(ctx context.Context, roomID int, date time.Time) ([]Session, error)
	GetSession(ctx context.Context, sessionID int) (*Session, error)
	DeleteSession(ctx context.Context, sessionID int) error
	GetSessionBookingsCount(ctx context.Context, sessionID int) (int, error)
	GetWatchlistMatches(ctx context.Context) ([]WatchlistMatch, error)
	GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]WatchlistMatch, error)

	IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error)
}
