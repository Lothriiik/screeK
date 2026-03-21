package auth

import (
	"context"
	"errors"
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/platform/crypto"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInvalidCredentials = errors.New("usuário ou senha inválidos")
	ErrTokenGeneration    = errors.New("erro ao gerar token")
	ErrInvalidToken       = errors.New("token inválido")
	ErrLogoutProcess      = errors.New("erro ao processar logout no servidor")
	ErrUserNotFound       = errors.New("usuário não encontrado")
	ErrSamePassword       = errors.New("a nova senha não pode ser igual à senha antiga")
	ErrPasswordProcess    = errors.New("erro ao processar nova senha")
	ErrPasswordUpdate     = errors.New("erro ao atualizar senha")
)

type AuthService struct {
	userRepo users.UserRepository
	jwt      *JWTService
	redis    *redis.Client
}

func NewAuthService(userRepo users.UserRepository, jwt *JWTService, redisClient *redis.Client) *AuthService {
	return &AuthService{userRepo: userRepo, jwt: jwt, redis: redisClient}
}

func (s *AuthService) Login(username, password string) (string, error) {
	user, err := s.userRepo.GetUserByUsername(username)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if !crypto.VerifyPassword(password, user.Password) {
		return "", ErrInvalidCredentials
	}

	token, err := s.jwt.GenerateToken(user.ID, user.Username)
	if err != nil {
		return "", ErrTokenGeneration
	}

	return token, nil
}

func (s *AuthService) Logout(ctx context.Context, tokenString string) error {
	claims, err := s.jwt.ValidateToken(tokenString)
	if err != nil {
		return ErrInvalidToken
	}

	expirationTime := claims.ExpiresAt.Time
	timeUntilExpiry := time.Until(expirationTime)

	if timeUntilExpiry > 0 {
		err := s.redis.Set(ctx, "blacklist:"+tokenString, "true", timeUntilExpiry).Err()
		if err != nil {
			return ErrLogoutProcess
		}
	}

	return nil
}

func (s *AuthService) ForgotPassword(email string) (string, error) {
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return "", ErrUserNotFound
	}

	token, err := s.jwt.GeneratePasswordResetToken(user.ID)
	if err != nil {
		return "", ErrTokenGeneration
	}

	return token, nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	claims, err := s.jwt.ValidateToken(token)
	if err != nil {
		return ErrInvalidToken
	}

	user, err := s.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		return ErrUserNotFound
	}

	if crypto.VerifyPassword(newPassword, user.Password) {
		return ErrSamePassword
	}

	hashedPassword, err := crypto.HashPassword(newPassword)
	if err != nil {
		return ErrPasswordProcess
	}

	user.Password = hashedPassword
	if err := s.userRepo.UpdateUser(user); err != nil {
		return ErrPasswordUpdate
	}

	return nil
}
