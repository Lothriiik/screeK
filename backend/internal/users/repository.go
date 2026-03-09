package users

type UserRepository interface {
	CreateUser(user *User) error
	GetUserByID(id int) (*User, error)
	SearchUsers(query string) ([]User, error)
	UpdateUser(user *User) error
	DeleteUser(id int) error
	AddFavorite(userID int, movieID int) error
	RemoveFavorite(userID int, tmdb_id int) error

}