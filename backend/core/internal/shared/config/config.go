package config

import (
	"errors"
	"log/slog"
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
	MeiliHost           string
	MeiliMasterKey      string
	RecommendationURL   string
	RunMigrations       bool
}

func LoadConfig() (Config, error) {
	if err := godotenv.Load(); err != nil {
		slog.Warn("Arquivo .env não encontrado; usando variáveis de ambiente do sistema")
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

	meiliHost := os.Getenv("MEILI_HOST")
	if meiliHost == "" {
		meiliHost = "http://localhost:7700"
	}

	meiliMasterKey := os.Getenv("MEILI_MASTER_KEY")
	if meiliMasterKey == "" {
		meiliMasterKey = "masterKey123"
	}

	recommendationURL := os.Getenv("RECOMMENDATION_SERVICE_URL")
	if recommendationURL == "" {
		recommendationURL = "http://localhost:8081/api/v1"
	}

	runMigrationsEnv := os.Getenv("RUN_MIGRATIONS")
	runMigrations := runMigrationsEnv != "false"

	return Config{
		DatabaseURL:         DatabaseURL,
		Port:                port,
		TMDBToken:           TMDBToken,
		JWTSecret:           JWTSecret,
		RedisURL:            redisURL,
		StripeKey:           os.Getenv("STRIPE_KEY"),
		StripeWebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		ResendKey:           os.Getenv("RESEND_KEY"),
		MeiliHost:           meiliHost,
		MeiliMasterKey:      meiliMasterKey,
		RecommendationURL:   recommendationURL,
		RunMigrations:       runMigrations,
	}, nil
}
