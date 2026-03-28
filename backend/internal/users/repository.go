package users

import "context"

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetUserByID(ctx context.Context, id int) (*User, error)
	SearchUsers(ctx context.Context, query string) ([]User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id int) error
	AddFavorite(ctx context.Context, userID int, movieID int) error
	RemoveFavorite(ctx context.Context, userID int, movieID int) error
	GetUserByUsername(ctx context.Context, username string) (*User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	UsernameExists(ctx context.Context, username string) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
}
