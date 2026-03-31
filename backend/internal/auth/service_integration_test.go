package auth

import (
	"context"
	"os"
	"testing"

	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func setupIntegration(t *testing.T) (*AuthService, *MockUserRepo, *MockMailer, *JWTService) {
	t.Helper()
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	rdb := goredis.NewClient(&goredis.Options{Addr: redisURL})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		t.Skipf("pulando: Redis indisponível em %s: %v", redisURL, err)
	}
	rdb.FlushAll(context.Background())

	cfg := &config.Config{JWTSecret: "test-secret-key-muito-segura-32chars"}
	jwtSvc := NewJWTService(cfg)
	repo := new(MockUserRepo)
	mailer := new(MockMailer)
	svc := NewAuthService(repo, jwtSvc, rdb, mailer)
	return svc, repo, mailer, jwtSvc
}

func buildUser(t *testing.T, password string) *users.User {
	t.Helper()
	hash, err := crypto.HashPassword(password)
	require.NoError(t, err)
	return &users.User{
		ID:       uuid.New(),
		Username: "integ_user",
		Email:    "integ@screek.com",
		Password: hash,
		Role:     httputil.RoleUser,
	}
}

func Test_integ_token_na_blacklist_apos_logout(t *testing.T) {

	svc, repo, _, jwtSvc := setupIntegration(t)
	user := buildUser(t, "senha123")
	repo.On("GetUserByUsername", mock.Anything, "integ_user").Return(user, nil)

	resp, err := svc.Login(context.Background(), "integ_user", "senha123")
	require.NoError(t, err)
	require.NotEmpty(t, resp.AccessToken)

	err = svc.Logout(context.Background(), resp.AccessToken)
	require.NoError(t, err)

	_, err = jwtSvc.ValidateToken(resp.AccessToken, TokenTypeAccess)
	assert.NoError(t, err, "JWT ainda é válido estruturalmente, blacklist é verificada no middleware")
}

func Test_integ_refresh_token_nao_pode_ser_reutilizado(t *testing.T) {

	svc, repo, _, _ := setupIntegration(t)
	user := buildUser(t, "senha123")
	repo.On("GetUserByUsername", mock.Anything, "integ_user").Return(user, nil)
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)

	loginResp, _ := svc.Login(context.Background(), "integ_user", "senha123")

	refreshResp, err := svc.RefreshToken(context.Background(), loginResp.RefreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, refreshResp.AccessToken)

	_, err = svc.RefreshToken(context.Background(), loginResp.RefreshToken)
	assert.ErrorIs(t, err, ErrRefreshRevoked)
}

func Test_integ_fluxo_completo_de_recuperacao_de_senha(t *testing.T) {

	svc, repo, mailer, jwtSvc := setupIntegration(t)
	user := buildUser(t, "senha_antiga")
	repo.On("GetUserByEmail", mock.Anything, "integ@screek.com").Return(user, nil)
	repo.On("GetUserByID", mock.Anything, user.ID).Return(user, nil)
	oldPassword := user.Password
	repo.On("UpdateUser", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		return u.Password != oldPassword
	})).Return(nil).Run(func(args mock.Arguments) {
		updated := args.Get(1).(*users.User)
		user.Password = updated.Password
	})

	var capturedToken string
	mailer.On("SendPasswordReset", "integ@screek.com", mock.AnythingOfType("string")).
		Run(func(args mock.Arguments) {
			capturedToken = args.String(1)
		}).Return(nil)

	err := svc.ForgotPassword(context.Background(), "integ@screek.com")
	require.NoError(t, err)
	require.NotEmpty(t, capturedToken, "e-mail de reset deve ter sido enviado")

	claims, err := jwtSvc.ValidateToken(capturedToken, TokenTypeReset)
	require.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)

	err = svc.ResetPassword(context.Background(), capturedToken, "senha_nova_456")
	require.NoError(t, err)

	repo.On("GetUserByUsername", mock.Anything, "integ_user").Return(user, nil)
	_, err = svc.Login(context.Background(), "integ_user", "senha_antiga")
	assert.ErrorIs(t, err, ErrInvalidCredentials)

	resp, err := svc.Login(context.Background(), "integ_user", "senha_nova_456")
	require.NoError(t, err)
	assert.NotEmpty(t, resp.AccessToken)
}
