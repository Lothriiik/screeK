package config

import (
	"os"
	"log"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port string
	TMDBToken string
	//JWTSecret string
}

func LoadConfig() Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema.")
	}
	DatabaseURL := os.Getenv("DATABASE_URL")
	if DatabaseURL == "" {
		log.Fatal("DATABASE_URL não está configurada no .env")
	}
	TMDBToken := os.Getenv("TMDB_TOKEN")
	if TMDBToken == "" {
		log.Fatal("TMDB_TOKEN não está configurada no .env")
	}
	//JWTSecret := os.Getenv("JWT_SECRET")
	//if JWTSecret == "" {
	//	log.Fatal("JWT_SECRET não está configurada no .env")
	//}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		DatabaseURL: DatabaseURL,
		Port: port,
		TMDBToken: TMDBToken,
		//JWTSecret: JWTSecret,
	}
}