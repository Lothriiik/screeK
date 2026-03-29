package auth

import (
	"errors"
	"time"

	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenType string

const (
	TokenTypeSession TokenType = "session"
	TokenTypeReset   TokenType = "reset"
)

type Claims struct {
	UserID    uuid.UUID     `json:"user_id"`
	Username  string        `json:"username"`
	Role      httputil.Role `json:"role"`
	TokenType TokenType     `json:"token_type"`
	jwt.RegisteredClaims
}

type JWTService struct {
	cfg *config.Config
}

func NewJWTService(cfg *config.Config) *JWTService {
	return &JWTService{cfg: cfg}
}

func (s *JWTService) GenerateToken(userID uuid.UUID, username string, role httputil.Role) (string, error) {

	claims := Claims{
		UserID:    userID,
		Username:  username,
		Role:      role,
		TokenType: TokenTypeSession,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *JWTService) GeneratePasswordResetToken(userID uuid.UUID) (string, error) {

	claims := Claims{
		UserID:    userID,
		TokenType: TokenTypeReset,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute * 15)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *JWTService) ValidateToken(tokenString string, expectedType TokenType) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		if claims.TokenType != expectedType {
			return nil, errors.New("tipo de token inválido para esta operação")
		}
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}
