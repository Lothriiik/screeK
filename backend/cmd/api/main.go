package main

import (
	"log"
	"net/http"
	"os"

	"github.com/StartLivin/cine-pass/backend/internal/handlers"
	"github.com/StartLivin/cine-pass/backend/internal/services"
	"github.com/StartLivin/cine-pass/backend/internal/store"
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

	db, err := store.InitDB(dsn)
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	storage := store.NewGormStore(db)
	userHandler := handlers.NewUserHandler(storage)

	tmdbClient := services.NewTMDBClient()
	movieHandler := handlers.NewMovieHandler(tmdbClient, storage)

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Bem-vindo à API do Cine Pass! 🎬",
		})
	})

	e.POST("/users", userHandler.CreateUser)
	e.GET("/users/:id", userHandler.GetByID)
	e.PUT("/users/:id", userHandler.UpdateUser)
	e.DELETE("/users/:id", userHandler.DeleteUser)

	e.GET("/movies/search", movieHandler.Search)
	e.GET("/movies/:id", movieHandler.GetDetails)

	e.Logger.Fatal(e.Start(":8080"))
}
