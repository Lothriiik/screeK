package users

import (
	"context"

	"github.com/google/uuid"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetUserByID(ctx context.Context, id uuid.UUID) (*User, error)
	SearchUsers(ctx context.Context, query string) ([]User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id uuid.UUID) error
	AddFavorite(ctx context.Context, userID uuid.UUID, movieID int) error
	RemoveFavorite(ctx context.Context, userID uuid.UUID, movieID int) error
	GetUserByUsername(ctx context.Context, username string) (*User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	UsernameExists(ctx context.Context, username string) (bool, error)

	GetUserStats(ctx context.Context, userID uuid.UUID) (*UserStats, error)
	UpdateUserStats(ctx context.Context, stats *UserStats) error
	IncrementUserStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error
	GetTopGenreByUsage(ctx context.Context, userID uuid.UUID) (*int, error)
}
