package main

import (
	"log"
	"net/http"
	"os"

	"github.com/StartLivin/cine-pass/backend/internal/bookings"
	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/database"
	"github.com/StartLivin/cine-pass/backend/internal/social"
	"github.com/StartLivin/cine-pass/backend/internal/users"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não está configurada no .env")
	}

	// 1. Inicializar Conexão Principal com o Banco
	db, err := database.InitDB(dsn)
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	// 2. Rodar Migrations por Módulo
	log.Println("Rodando migrações do banco de dados (Modular)...")
	movies.AutoMigrate(db)
	users.AutoMigrate(db)
	bookings.AutoMigrate(db)
	social.AutoMigrate(db)

	// 3. Inicializar Módulo de Usuários
	userStore := users.NewStore(db)
	userHandler := users.NewHandler(userStore)

	// 4. Inicializar Módulo de Filmes
	tmdbClient := movies.NewTMDBClient()
	movieStore := movies.NewStore(db)
	movieHandler := movies.NewHandler(tmdbClient, movieStore)

	// 5. Configurar o Web Server
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Bem-vindo à API do Cine Pass! 🎬 (Modular Monolith Edition)",
		})
	})

	// 6. Registrar Rotas
	userHandler.RegisterRoutes(e)
	movieHandler.RegisterRoutes(e)

	e.Logger.Fatal(e.Start(":8080"))
}
