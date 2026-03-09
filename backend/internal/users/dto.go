package users

import "github.com/StartLivin/cine-pass/backend/internal/movies"

type CreateUserDTO struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserDTO struct {
	ID int `json:"id"`
	Name string `json:"name"`
	Username string `json:"username"`
}

type UserDetailsDTO struct {
	ID int `json:"id"`
	Name string `json:"name"`
	Username string `json:"username"`
	Email string `json:"email"`
	Bio string `json:"bio"`
	PhotoURL string `json:"photo_url"`
	Pronouns string `json:"pronouns"`
	DefaultCity string `json:"default_city"`
	FavoriteMovies []movies.MovieDTO `json:"favorite_movies"`
}
