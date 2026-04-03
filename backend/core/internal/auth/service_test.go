package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func newAuthServiceWithMock(t *testing.T) (*AuthService, *MockUserRepo, *MockMailer, *MockRedisClient) {
	t.Helper()
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)
	repo := new(MockUserRepo)
	mailer := new(MockMailer)
	redis := new(MockRedisClient)
	svc := NewAuthService(repo, jwtSvc, redis, mailer)
	return svc, repo, mailer, redis
}

func newAuthServiceWithFakeRedis(t *testing.T) (*AuthService, *MockUserRepo, *MockMailer, *fakeRedis) {
	t.Helper()
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)
	repo := new(MockUserRepo)
	mailer := new(MockMailer)
	redis := newFakeRedis()
	svc := NewAuthService(repo, jwtSvc, redis.client(), mailer)
	return svc, repo, mailer, redis
}

func userWithHashedPassword(t *testing.T, password string) *users.User {
	t.Helper()
	hash, err := crypto.HashPassword(password)
	require.NoError(t, err)
	return &users.User{
		ID:       uuid.New(),
		Username: "screekuser",
		Email:    "user@screek.com",
		Password: hash,
		Role:     httputil.RoleUser,
	}
}

func Test_login_deve_retornar_access_e_refresh_token(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	user := userWithHashedPassword(t, "senha123")
	repo.On("GetUserByUsername", mock.Anything, "screekuser").Return(user, nil)

	resp, err := svc.Login(context.Background(), "screekuser", "senha123")

	require.NoError(t, err)
	assert.NotEmpty(t, resp.AccessToken)
	assert.NotEmpty(t, resp.RefreshToken)
	assert.NotEqual(t, resp.AccessToken, resp.RefreshToken)
}

func Test_login_deve_rejeitar_senha_errada(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	user := userWithHashedPassword(t, "senha_certa")
	repo.On("GetUserByUsername", mock.Anything, "screekuser").Return(user, nil)

	resp, err := svc.Login(context.Background(), "screekuser", "senha_errada")

	assert.ErrorIs(t, err, ErrInvalidCredentials)
	assert.Nil(t, resp)
}

func Test_login_deve_rejeitar_usuario_inexistente(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	repo.On("GetUserByUsername", mock.Anything, "fantasma").Return(nil, errors.New("not found"))

	resp, err := svc.Login(context.Background(), "fantasma", "qualquer")

	assert.ErrorIs(t, err, ErrInvalidCredentials)
	assert.Nil(t, resp)
}

func Test_login_deve_propagar_role_do_usuario_no_token(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)

	user := userWithHashedPassword(t, "senha123")
	user.Role = httputil.RoleAdmin
	repo.On("GetUserByUsername", mock.Anything, "screekuser").Return(user, nil)

	resp, err := svc.Login(context.Background(), "screekuser", "senha123")

	require.NoError(t, err)
	claims, err := jwtSvc.ValidateToken(resp.AccessToken, TokenTypeAccess)
	require.NoError(t, err)
	assert.Equal(t, httputil.RoleAdmin, claims.Role)
}


func Test_logout_deve_rejeitar_token_invalido(t *testing.T) {
	svc, _, _, _ := newAuthServiceWithFakeRedis(t)

	err := svc.Logout(context.Background(), "token-invalido")

	assert.ErrorIs(t, err, ErrInvalidToken)
}

func Test_logout_deve_rejeitar_token_do_tipo_errado(t *testing.T) {
	svc, _, _, _ := newAuthServiceWithFakeRedis(t)
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)

	refreshToken, _ := jwtSvc.GenerateRefreshToken(uuid.New())

	err := svc.Logout(context.Background(), refreshToken)

	assert.ErrorIs(t, err, ErrInvalidToken)
}


func Test_forgot_password_deve_enviar_email_quando_usuario_existe(t *testing.T) {
	svc, repo, mailer, _ := newAuthServiceWithFakeRedis(t)
	user := userWithHashedPassword(t, "senha123")

	repo.On("GetUserByEmail", mock.Anything, "user@screek.com").Return(user, nil)
	mailer.On("SendPasswordReset", mock.Anything, "user@screek.com", mock.AnythingOfType("string")).Return(nil)

	err := svc.ForgotPassword(context.Background(), "user@screek.com")

	require.NoError(t, err)
	mailer.AssertExpectations(t)
}

func Test_forgot_password_deve_retornar_nil_quando_email_nao_existe(t *testing.T) {
	svc, repo, mailer, _ := newAuthServiceWithFakeRedis(t)
	repo.On("GetUserByEmail", mock.Anything, "naoexiste@screek.com").Return(nil, errors.New("not found"))

	err := svc.ForgotPassword(context.Background(), "naoexiste@screek.com")

	require.NoError(t, err, "ForgotPassword nunca deve retornar erro visível ao chamador")
	mailer.AssertNotCalled(t, "SendPasswordReset")
}


func Test_reset_password_deve_atualizar_senha_com_token_valido(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)

	user := userWithHashedPassword(t, "senha_antiga")
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)
	repo.On("UpdateUser", mock.Anything, mock.Anything).Return(nil)

	resetToken, _ := jwtSvc.GeneratePasswordResetToken(user.ID)

	err := svc.ResetPassword(context.Background(), resetToken, "senha_nova_123")

	require.NoError(t, err)
	repo.AssertCalled(t, "UpdateUser", mock.Anything, mock.Anything)
}

func Test_reset_password_deve_rejeitar_mesma_senha(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)

	user := userWithHashedPassword(t, "mesma_senha")
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)

	resetToken, _ := jwtSvc.GeneratePasswordResetToken(user.ID)

	err := svc.ResetPassword(context.Background(), resetToken, "mesma_senha")

	assert.ErrorIs(t, err, ErrSamePassword)
	repo.AssertNotCalled(t, "UpdateUser")
}

func Test_reset_password_deve_rejeitar_token_invalido(t *testing.T) {
	svc, _, _, _ := newAuthServiceWithFakeRedis(t)

	err := svc.ResetPassword(context.Background(), "token-invalido", "nova_senha")

	assert.ErrorIs(t, err, ErrInvalidToken)
}

func Test_reset_password_deve_rejeitar_access_token_no_lugar_de_reset_token(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)

	user := userWithHashedPassword(t, "senha")
	repo.On("GetUserByUsername", mock.Anything, "screekuser").Return(user, nil)

	accessToken, _ := jwtSvc.GenerateAccessToken(user.ID, "screekuser", httputil.RoleUser)

	err := svc.ResetPassword(context.Background(), accessToken, "nova_senha")

	assert.ErrorIs(t, err, ErrInvalidToken, "access token não deve ser aceito em ResetPassword")
}

func Test_change_password_deve_alterar_com_senha_antiga_correta(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	user := userWithHashedPassword(t, "senha_antiga")
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)
	repo.On("UpdateUser", mock.Anything, mock.Anything).Return(nil)

	err := svc.ChangePassword(context.Background(), user.ID, "senha_antiga", "senha_nova")

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_change_password_deve_rejeitar_senha_antiga_incorreta(t *testing.T) {
	svc, repo, _, _ := newAuthServiceWithFakeRedis(t)
	user := userWithHashedPassword(t, "senha_certa")
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)

	err := svc.ChangePassword(context.Background(), user.ID, "senha_errada", "nova")

	assert.ErrorIs(t, err, ErrOldPasswordInvalid)
	repo.AssertNotCalled(t, "UpdateUser")
}

func Test_RefreshToken_Reuso_Proibido(t *testing.T) {
	svc, repo, _, redis := newAuthServiceWithMock(t)
	user := userWithHashedPassword(t, "senha123")
	jwtSvc := svc.jwt

	refreshToken, _ := jwtSvc.GenerateRefreshToken(user.ID)
	
	redis.On("Exists", mock.Anything, []string{"refresh:"+user.ID.String()+":"+refreshToken}).Return(1, nil).Once()
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)
	redis.On("Del", mock.Anything, []string{"refresh:"+user.ID.String()+":"+refreshToken}).Return(1, nil)
	redis.On("Set", mock.Anything, mock.Anything, "true", time.Hour*24*7).Return("OK", nil)

	resp, err := svc.RefreshToken(context.Background(), refreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, resp.AccessToken)

	redis.On("Exists", mock.Anything, []string{"refresh:"+user.ID.String()+":"+refreshToken}).Return(0, nil).Once()
	redis.On("Scan", mock.Anything, uint64(0), "refresh:"+user.ID.String()+":*", int64(0)).
		Return([]string{"refresh:"+user.ID.String()+":other-token"}, 0, nil)
	redis.On("Del", mock.Anything, []string{"refresh:"+user.ID.String()+":other-token"}).Return(1, nil)
	
	_, err = svc.RefreshToken(context.Background(), refreshToken)
	assert.ErrorIs(t, err, ErrRefreshRevoked)
}

func Test_Logout_Invalida_Acesso_Imediato(t *testing.T) {
	svc, _, _, redis := newAuthServiceWithMock(t)
	user := userWithHashedPassword(t, "senha123")
	accessToken, _ := svc.jwt.GenerateAccessToken(user.ID, user.Username, httputil.RoleUser)

	redis.On("Set", mock.Anything, mock.MatchedBy(func(k string) bool {
		return k == "blacklist:"+accessToken
	}), "true", mock.Anything).Return("OK", nil)

	redis.On("Scan", mock.Anything, uint64(0), "refresh:"+user.ID.String()+":*", int64(0)).
		Return([]string{"refresh:"+user.ID.String()+":token1"}, 0, nil)
	redis.On("Del", mock.Anything, []string{"refresh:"+user.ID.String()+":token1"}).Return(1, nil)

	err := svc.Logout(context.Background(), accessToken)
	require.NoError(t, err)
	redis.AssertExpectations(t)
}

func Test_ForgotPassword_Token_Expiration(t *testing.T) {
	svc, repo, mailer, _ := newAuthServiceWithMock(t)
	user := userWithHashedPassword(t, "senha123")

	repo.On("GetUserByEmail", mock.Anything, user.Email).Return(user, nil)
	
	var capturedToken string
	mailer.On("SendPasswordReset", mock.Anything, user.Email, mock.AnythingOfType("string")).Run(func(args mock.Arguments) {
		capturedToken = args.String(2)
	}).Return(nil)

	err := svc.ForgotPassword(context.Background(), user.Email)
	require.NoError(t, err)

	claims, err := svc.jwt.ValidateToken(capturedToken, TokenTypeReset)
	require.NoError(t, err)
	
	diff := time.Until(claims.ExpiresAt.Time)
	assert.True(t, diff > 14*time.Minute && diff <= 15*time.Minute)
}
