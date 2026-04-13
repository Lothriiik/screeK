package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL         string
	Port                string
	TMDBToken           string
	JWTSecret           string
	RedisURL            string
	StripeKey           string
	StripeWebhookSecret string
	ResendKey           string
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema.")
	}
	DatabaseURL := os.Getenv("DATABASE_URL")
	if DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL não está configurada no .env")
	}
	TMDBToken := os.Getenv("TMDB_TOKEN")
	if TMDBToken == "" {
		return Config{}, errors.New("TMDB_TOKEN não está configurada no .env")
	}
	JWTSecret := os.Getenv("JWT_SECRET")
	if JWTSecret == "" {
		return Config{}, errors.New("JWT_SECRET não está configurada no .env")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	return Config{
		DatabaseURL:         DatabaseURL,
		Port:                port,
		TMDBToken:           TMDBToken,
		JWTSecret:           JWTSecret,
		RedisURL:            redisURL,
		StripeKey:           os.Getenv("STRIPE_KEY"),
		StripeWebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		ResendKey:           os.Getenv("RESEND_KEY"),
	}, nil
}
