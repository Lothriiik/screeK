package redis

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis(redisURL string) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Falha ao conectar no Redis em %s: %v", redisURL, err)
	}

	log.Println("Conexão com Redis estabelecida com sucesso")
	return client
}
