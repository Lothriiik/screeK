package redis

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis(redisURL string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.Ping(ctx).Result()
	if err != nil {
		slog.Error("Falha ao conectar ao Redis", "address", redisURL, "error", err)
		return nil, fmt.Errorf("conectar ao Redis: %w", err)
	}

	slog.Info("Conexão com Redis estabelecida", "address", redisURL)
	return client, nil
}
