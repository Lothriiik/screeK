package auth_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
)

func Test_Auth_Login_BruteForce_Protection(t *testing.T) {

	db := testutil.SetupTestDB(t)
	users.AutoMigrate(db)
	testutil.CleanupDB(t, db)
	rdb := testutil.SetupTestRedis(t)
	defer testutil.CleanupRedis(t, rdb)

	userStore := users.NewStore(db)
	authSvc := auth.NewAuthService(userStore, nil, rdb, nil)
	handler := auth.NewHandler(authSvc)

	noopMiddleware := func(next http.Handler) http.Handler { return next }
	r := chi.NewRouter()
	handler.RegisterRoutes(r, noopMiddleware)

	loginPayload := map[string]string{
		"username": "attacker",
		"password": "wrong_password",
	}
	body, _ := json.Marshal(loginPayload)

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		
		if i < 5 {
			assert.Equal(t, http.StatusUnauthorized, w.Code)
		}
	}

	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code, "Deveria retornar 429 após múltiplas tentativas falhas")
}
