package users

import (
	"context"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
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
	UsernameExists(ctx context.Context, username string) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)

	// Admin (Novo)
	UpdateUserRole(ctx context.Context, userID uuid.UUID, role httputil.Role) error
}
