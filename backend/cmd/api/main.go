package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/StartLivin/cine-pass/backend/internal/bookings"
	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/database"
	"github.com/StartLivin/cine-pass/backend/internal/social"
	"github.com/StartLivin/cine-pass/backend/internal/users"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não está configurada no .env")
	}

	db, err := database.InitDB(dsn)
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	log.Println("Rodando migrações do banco de dados...")
	movies.AutoMigrate(db)
	users.AutoMigrate(db)
	bookings.AutoMigrate(db)
	social.AutoMigrate(db)

	userStore := users.NewStore(db)
	userHandler := users.NewHandler(userStore)

	tmdbClient := movies.NewTMDBClient()
	movieStore := movies.NewStore(db)
	movieHandler := movies.NewHandler(tmdbClient, movieStore)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Bem-vindo à API do Cine Pass! 🎬",
		})
	})

	userHandler.RegisterRoutes(r)
	movieHandler.RegisterRoutes(r)

	log.Println("Servidor rodando em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
