package app

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/StartLivin/screek/backend/internal/analytics"
	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/catalog"
	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func SetupTestApp(t *testing.T) (*Application, *gorm.DB, *goredis.Client) {
	t.Helper()

	db := testutil.SetupTestDB(t)
	require.NoError(t, domain.AutoMigrate(db))
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, bookings.AutoMigrate(db))
	require.NoError(t, social.AutoMigrate(db))
	require.NoError(t, catalog.AutoMigrate(db))
	require.NoError(t, analytics.AutoMigrate(db))
	require.NoError(t, notifications.AutoMigrate(db))
	testutil.CleanupDB(t, db)

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rct := goredis.NewClient(&goredis.Options{Addr: redisURL})
	require.NoError(t, rct.Ping(context.Background()).Err())
	rct.FlushDB(context.Background())

	cfg := config.Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    redisURL,
		JWTSecret:   "test-secret-key-muito-segura-32-chars",
		Port:        "8003",
	}

	app := NewApplication(cfg)
	app.db = db
	app.redis = rct
	app.mount()

	return app, db, rct
}

func executeRequest(handler http.Handler, method, path string, body interface{}, token string) *httptest.ResponseRecorder {
	var bodyReader *bytes.Buffer
	if body != nil {
		jsonData, _ := json.Marshal(body)
		bodyReader = bytes.NewBuffer(jsonData)
	} else {
		bodyReader = bytes.NewBuffer([]byte{})
	}

	req, _ := http.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	return rr
}

func loginHelper(t *testing.T, app *Application, username, password string) string {
	t.Helper()
	regReq := users.CreateUserDTO{
		Username:             username,
		Name:                 username,
		Email:                username + "@test.com",
		Password:             password,
		PasswordConfirmation: password,
	}
	executeRequest(app.router, "POST", "/api/v1/users/register", regReq, "")

	logReq := auth.LoginRequest{
		Username: username,
		Password: password,
	}
	rr := executeRequest(app.router, "POST", "/api/v1/auth/login", logReq, "")
	require.Equal(t, http.StatusOK, rr.Code)

	var resp auth.AuthTokenResponse
	err := json.Unmarshal(rr.Body.Bytes(), &resp)
	require.NoError(t, err)

	return resp.AccessToken
}
