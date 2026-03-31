package auth

import (
	"testing"

	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestJWTService() *JWTService {
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	return NewJWTService(cfg)
}

func Test_deve_gerar_access_token_valido(t *testing.T) {
	jwt := newTestJWTService()
	userID := uuid.New()

	token, err := jwt.GenerateAccessToken(userID, "testuser", httputil.RoleUser)

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := jwt.ValidateToken(token, TokenTypeAccess)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, "testuser", claims.Username)
	assert.Equal(t, httputil.RoleUser, claims.Role)
	assert.Equal(t, TokenTypeAccess, claims.TokenType)
}

func Test_deve_gerar_refresh_token_valido(t *testing.T) {
	jwt := newTestJWTService()
	userID := uuid.New()

	token, err := jwt.GenerateRefreshToken(userID)

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := jwt.ValidateToken(token, TokenTypeRefresh)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, TokenTypeRefresh, claims.TokenType)
}

func Test_deve_gerar_reset_token_valido(t *testing.T) {
	jwt := newTestJWTService()
	userID := uuid.New()

	token, err := jwt.GeneratePasswordResetToken(userID)

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := jwt.ValidateToken(token, TokenTypeReset)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
}

func Test_deve_rejeitar_token_com_tipo_errado(t *testing.T) {
	jwt := newTestJWTService()
	userID := uuid.New()

	accessToken, _ := jwt.GenerateAccessToken(userID, "user", httputil.RoleUser)

	_, err := jwt.ValidateToken(accessToken, TokenTypeRefresh)
	assert.Error(t, err)
}

func Test_deve_rejeitar_token_com_assinatura_invalida(t *testing.T) {
	jwt := newTestJWTService()

	_, err := jwt.ValidateToken("eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoiZmFrZSJ9.invalidsig", TokenTypeAccess)
	assert.Error(t, err)
}

func Test_deve_rejeitar_token_completamente_invalido(t *testing.T) {
	jwt := newTestJWTService()

	_, err := jwt.ValidateToken("nao-e-um-jwt", TokenTypeAccess)
	assert.Error(t, err)
}

func Test_deve_rejeitar_token_vazio(t *testing.T) {
	jwt := newTestJWTService()

	_, err := jwt.ValidateToken("", TokenTypeAccess)
	assert.Error(t, err)
}

func Test_tokens_diferentes_para_usuarios_diferentes(t *testing.T) {
	jwt := newTestJWTService()

	token1, _ := jwt.GenerateAccessToken(uuid.New(), "user1", httputil.RoleUser)
	token2, _ := jwt.GenerateAccessToken(uuid.New(), "user2", httputil.RoleUser)

	assert.NotEqual(t, token1, token2)
}
