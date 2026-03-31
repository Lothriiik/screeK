package auth

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Auth_TokenRotation_FamilyRevocation(t *testing.T) {
	db := testutil.SetupTestDB(t)
	users.AutoMigrate(db)
	testutil.CleanupDB(t, db)

	rdb := testutil.SetupTestRedis(t)
	defer testutil.CleanupRedis(t, rdb)

	cfg := &config.Config{JWTSecret: "test_secret"}
	jwtSvc := NewJWTService(cfg)
	userStore := users.NewStore(db)
	authSvc := NewAuthService(userStore, jwtSvc, rdb, nil)

	userID := uuid.New()
	hashedPassword, _ := crypto.HashPassword("rotation_password")
	user := users.User{
		ID:       userID,
		Username: "rotation_user",
		Email:    "rotation@test.com",
		Password: hashedPassword,
		Role:     "USER",
	}
	require.NoError(t, db.Create(&user).Error)

	ctx := context.Background()

	// Fluxo Unificado para evitar vazamento de estado
	testutil.CleanupRedis(t, rdb)

	// 1. Login e obtenção do primeiro RT
	resp1, err := authSvc.Login(ctx, user.Username, "rotation_password")
	require.NoError(t, err)
	rt1 := resp1.RefreshToken

	// Sleep de > 1s para garantir que o NumericDate (segundos) mude
	time.Sleep(1100 * time.Millisecond)

	// 2. Primeira Rotação (RT1 -> RT2)
	resp2, err := authSvc.RefreshToken(ctx, rt1)
	require.NoError(t, err)
	rt2 := resp2.RefreshToken
	assert.NotEqual(t, rt1, rt2)

	// RT1 deve ter sido removido, RT2 deve existir
	exists, _ := rdb.Exists(ctx, "refresh:"+userID.String()+":"+rt1).Result()
	assert.Equal(t, int64(0), exists, "RT1 deveria ter sido removido")
	exists, _ = rdb.Exists(ctx, "refresh:"+userID.String()+":"+rt2).Result()
	assert.Equal(t, int64(1), exists, "RT2 deveria existir")

	// 3. Detecção de Reuso (Reuse RT1)
	_, err = authSvc.RefreshToken(ctx, rt1)
	assert.ErrorIs(t, err, ErrRefreshRevoked)

	// 4. Validação da Revogação da Família (RT2 deve ter sido invalidado)
	exists, _ = rdb.Exists(ctx, "refresh:"+userID.String()+":"+rt2).Result()
	assert.Equal(t, int64(0), exists, "RT2 deveria ter sido revogado após reuso de RT1")

	_, err = authSvc.RefreshToken(ctx, rt2)
	assert.ErrorIs(t, err, ErrRefreshRevoked)
}
