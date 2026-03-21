package users

type UserRepository interface {
	CreateUser(user *User) error
	GetUserByID(id int) (*User, error)
	SearchUsers(query string) ([]User, error)
	UpdateUser(user *User) error
	DeleteUser(id int) error
	AddFavorite(userID int, movieID int) error
	RemoveFavorite(userID int, movieID int) error
	GetUserByUsername(username string) (*User, error)
	EmailExists(email string) (bool, error)
	UsernameExists(username string) (bool, error)
	GetUserByEmail(email string) (*User, error)
}
