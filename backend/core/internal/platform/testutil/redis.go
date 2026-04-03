package testutil

import (
	"context"
	"os"
	"testing"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func SetupTestRedis(t *testing.T) *redis.Client {
	t.Helper()

	addr := os.Getenv("REDIS_URL")
	if addr == "" {
		addr = "localhost:6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr: addr,
		DB:   1, 
	})

	err := client.Ping(context.Background()).Err()
	require.NoError(t, err, "falha ao conectar no redis de teste")

	return client
}

func CleanupRedis(t *testing.T, client *redis.Client) {
	t.Helper()
	err := client.FlushDB(context.Background()).Err()
	require.NoError(t, err, "falha ao limpar o redis de teste")
}
