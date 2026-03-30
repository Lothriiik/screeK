package auth

import "github.com/StartLivin/screek/backend/internal/platform/validation"

type LoginDTO struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ForgotPasswordDTO struct {
    Email string `json:"email" validate:"required,email"`
}

type ResetPasswordDTO struct {
    Token                string `json:"token" validate:"required"`
    NewPassword          string `json:"new_password" validate:"required,min=6"`
    PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=NewPassword"`
}

type ChangePasswordDTO struct {
	OldPassword          string `json:"old_password" validate:"required,min=6"`
	Password             string `json:"password" validate:"required,min=6"`
	PasswordConfirmation string `json:"password_confirmation" validate:"eqfield=Password"`
}

func (d *ForgotPasswordDTO) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *ResetPasswordDTO) Validate() error {
	return validation.Validate.Struct(d)
}

func (d *ChangePasswordDTO) Validate() error {
	return validation.Validate.Struct(d)
}

type AuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
