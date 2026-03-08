package main

import (
	"encoding/json"
	"log"
	"net/http"
	"github.com/StartLivin/cine-pass/backend/internal/bookings"
	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/database"
	"github.com/StartLivin/cine-pass/backend/internal/social"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

type Config struct {
	DSN  string
	Port string
}

type Application struct {
	config Config
	db     *gorm.DB
	router *chi.Mux
}

func NewApplication(cfg Config) *Application {
	return &Application{
		config: cfg,
		router: chi.NewRouter(),
	}
}

func (app *Application) mount() {
	app.router.Use(middleware.Logger)
	app.router.Use(middleware.Recoverer)

	app.router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Bem-vindo à API do Cine Pass! 🎬",
		})
	})

	userStore := users.NewStore(app.db)
	userHandler := users.NewHandler(userStore)
	userHandler.RegisterRoutes(app.router)

	tmdbClient := movies.NewTMDBClient()
	movieStore := movies.NewStore(app.db)
	movieHandler := movies.NewHandler(tmdbClient, movieStore)
	movieHandler.RegisterRoutes(app.router)
}

func (app *Application) Run() error {
	db, err := database.InitDB(app.config.DSN)
	if err != nil {
		return err
	}
	app.db = db

	log.Println("Rodando migrações do banco de dados (AutoMigrate)...")
	movies.AutoMigrate(app.db)
	users.AutoMigrate(app.db)
	bookings.AutoMigrate(app.db)
	social.AutoMigrate(app.db)

	app.mount()

	log.Printf("Servidor rodando em http://localhost:%s", app.config.Port)
	return http.ListenAndServe(":"+app.config.Port, app.router)
}
