package auth

import (
	"context"
	"errors"
	"time"

	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/StartLivin/screek/backend/internal/platform/email"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
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
	ErrOldPasswordInvalid = errors.New("senha antiga incorreta")
	ErrRefreshRevoked     = errors.New("token de atualização revogado ou expirado")
)

type RedisClient interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.StatusCmd
	Get(ctx context.Context, key string) *redis.StringCmd
	Del(ctx context.Context, keys ...string) *redis.IntCmd
	Exists(ctx context.Context, keys ...string) *redis.IntCmd
	Scan(ctx context.Context, cursor uint64, match string, count int64) *redis.ScanCmd
}

type AuthService struct {
	userRepo users.UserRepository
	jwt      *JWTService
	redis    RedisClient
	mailer   email.Mailer
}

func NewAuthService(userRepo users.UserRepository, jwt *JWTService, redisClient RedisClient, mailer email.Mailer) *AuthService {
	return &AuthService{userRepo: userRepo, jwt: jwt, redis: redisClient, mailer: mailer}
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*AuthTokenResponse, error) {
	user, err := s.userRepo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !crypto.VerifyPassword(password, user.Password) {
		return nil, ErrInvalidCredentials
	}

	accessToken, err := s.jwt.GenerateAccessToken(user.ID, user.Username, httputil.Role(user.Role))
	if err != nil {
		return nil, ErrTokenGeneration
	}

	refreshToken, err := s.jwt.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, ErrTokenGeneration
	}

	err = s.redis.Set(ctx, "refresh:"+user.ID.String()+":"+refreshToken, "true", time.Hour*24*7).Err()
	if err != nil {
		return nil, ErrTokenGeneration
	}

	return &AuthTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshTokenString string) (*AuthTokenResponse, error) {
	claims, err := s.jwt.ValidateToken(refreshTokenString, TokenTypeRefresh)
	if err != nil {
		return nil, ErrInvalidToken
	}

	exists, err := s.redis.Exists(ctx, "refresh:"+claims.UserID.String()+":"+refreshTokenString).Result()
	if err != nil || exists == 0 {
		iter := s.redis.Scan(ctx, 0, "refresh:"+claims.UserID.String()+":*", 0).Iterator()
		for iter.Next(ctx) {
			s.redis.Del(ctx, iter.Val())
		}
		return nil, ErrRefreshRevoked
	}

	user, err := s.userRepo.GetUserByID(ctx, claims.UserID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	s.redis.Del(ctx, "refresh:"+claims.UserID.String()+":"+refreshTokenString)

	accessToken, err := s.jwt.GenerateAccessToken(user.ID, user.Username, httputil.Role(user.Role))
	if err != nil {
		return nil, ErrTokenGeneration
	}

	newRefreshToken, err := s.jwt.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, ErrTokenGeneration
	}

	err = s.redis.Set(ctx, "refresh:"+user.ID.String()+":"+newRefreshToken, "true", time.Hour*24*7).Err()
	if err != nil {
		return nil, ErrTokenGeneration
	}

	return &AuthTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, accessTokenString string) error {
	claims, err := s.jwt.ValidateToken(accessTokenString, TokenTypeAccess)
	if err != nil {
		return ErrInvalidToken
	}

	timeUntilExpiry := time.Until(claims.ExpiresAt.Time)
	if timeUntilExpiry > 0 {
		err := s.redis.Set(ctx, "blacklist:"+accessTokenString, "true", timeUntilExpiry).Err()
		if err != nil {
			return ErrLogoutProcess
		}
	}

	iter := s.redis.Scan(ctx, 0, "refresh:"+claims.UserID.String()+":*", 0).Iterator()
	for iter.Next(ctx) {
		s.redis.Del(ctx, iter.Val())
	}

	return nil
}

func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil 
	}

	token, err := s.jwt.GeneratePasswordResetToken(user.ID)
	if err != nil {
		return ErrTokenGeneration
	}

	if s.mailer != nil {
		s.mailer.SendPasswordReset(user.Email, token)
	}

	return nil
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	claims, err := s.jwt.ValidateToken(token, TokenTypeReset)
	if err != nil {
		return ErrInvalidToken
	}

	user, err := s.userRepo.GetUserByID(ctx, claims.UserID)
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
	if err := s.userRepo.UpdateUser(ctx, user); err != nil {
		return ErrPasswordUpdate
	}

	return nil
}

func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	if !crypto.VerifyPassword(oldPassword, user.Password) {
		return ErrOldPasswordInvalid
	}

	hashedPassword, err := crypto.HashPassword(newPassword)
	if err != nil {
		return ErrPasswordProcess
	}

	user.Password = hashedPassword
	if err := s.userRepo.UpdateUser(ctx, user); err != nil {
		return ErrPasswordUpdate
	}

	return nil
}
