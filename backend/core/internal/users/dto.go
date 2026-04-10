package users

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/shared/validation"
	"github.com/google/uuid"
)

type CreateUserDTO struct {
	Name                 string `json:"name" validate:"required"`
	Email                string `json:"email" validate:"required,email"`
	Username             string `json:"username" validate:"required,min=4"`
	Password             string `json:"password" validate:"required,min=6"`
	PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=Password"`
}

type UserDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatar_url"`
}

type UserDetailsDTO struct {
	ID             uuid.UUID         `json:"id"`
	Name           string            `json:"name"`
	Username       string            `json:"username"`
	Bio            string            `json:"bio"`
	AvatarURL      string            `json:"avatar_url"`
	Pronouns       string            `json:"pronouns"`
	DefaultCity    string            `json:"default_city"`
	FavoriteMovies []movies.MovieDTO `json:"favorite_movies"`
}

type UserMeDetailsDTO struct {
	ID             uuid.UUID         `json:"id"`
	Name           string            `json:"name"`
	Username       string            `json:"username"`
	Email          string            `json:"email"`
	Bio            string            `json:"bio"`
	AvatarURL      string            `json:"avatar_url"`
	Pronouns       string            `json:"pronouns"`
	DefaultCity    string            `json:"default_city"`
	FavoriteMovies []movies.MovieDTO `json:"favorite_movies"`
}

type UpdateUserDTO struct {
	Name        string `json:"name" validate:"omitempty"`
	Bio         string `json:"bio" validate:"omitempty"`
	AvatarURL   string `json:"avatar_url" validate:"omitempty,url"`
	Pronouns    string `json:"pronouns" validate:"omitempty"`
	DefaultCity string `json:"default_city" validate:"omitempty"`
}

type ChangePasswordDTO struct {
	OldPassword          string `json:"old_password" validate:"required,min=6"`
	Password             string `json:"password" validate:"required,min=6"`
	PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=Password"`
}

type UpdateRoleDTO struct {
	Role httputil.Role `json:"role" validate:"required,oneof=USER MANAGER ADMIN"`
}

func (dto *CreateUserDTO) Validate(ctx context.Context, svc *UserService) error {
	if err := validation.Validate.Struct(dto); err != nil {
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

func (dto *UpdateUserDTO) Validate() error {
	return validation.Validate.Struct(dto)
}

func (dto *ChangePasswordDTO) Validate() error {
	return validation.Validate.Struct(dto)
}

func (dto *UpdateRoleDTO) Validate() error {
	return validation.Validate.Struct(dto)
}
