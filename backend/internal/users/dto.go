package users

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

var validate = validator.New()

type CreateUserDTO struct {
	Name                 string `json:"name" validate:"required"`
	Email                string `json:"email" validate:"required,email"`
	Username             string `json:"username" validate:"required,min=4"`
	Password             string `json:"password" validate:"required,min=6"`
	PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=Password"`
}

type UserDTO struct {
	ID       uuid.UUID    `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
}

type UserDetailsDTO struct {
	ID             uuid.UUID               `json:"id"`
	Name           string            `json:"name"`
	Username       string            `json:"username"`
	Email          string            `json:"email"`
	Bio            string            `json:"bio"`
	PhotoURL       string            `json:"photo_url"`
	Pronouns       string            `json:"pronouns"`
	DefaultCity    string            `json:"default_city"`
	FavoriteMovies []movies.MovieDTO `json:"favorite_movies"`
}

type ChangePasswordDTO struct {
	OldPassword          string `json:"old_password" validate:"required,min=6"`
	Password             string `json:"password" validate:"required,min=6"`
	PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=Password"`
}

func (dto *CreateUserDTO) Validate(ctx context.Context, svc *UserService) error {
	if err := validate.Struct(dto); err != nil {
		return errors.New("Erro de validação: verifique os campos fornecidos")
	}

	emailExists, _ := svc.EmailExists(ctx, dto.Email)
	if emailExists {
		return errors.New("Este e-mail já está em uso")
	}

	userExists, _ := svc.UsernameExists(ctx, dto.Username)
	if userExists {
		return errors.New("Este nome de usuário já está em uso")
	}

	return nil
}
