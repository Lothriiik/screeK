package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/StartLivin/cine-pass/backend/internal/auth"
	"github.com/StartLivin/cine-pass/backend/internal/bookings"
	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/config"
	"github.com/StartLivin/cine-pass/backend/internal/platform/database"
	"github.com/StartLivin/cine-pass/backend/internal/social"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Application struct {
	config config.Config
	db     *gorm.DB
	redis  *redis.Client
	router *chi.Mux
}

func NewApplication(cfg config.Config) *Application {
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
	movieStore := movies.NewStore(app.db)

	authService := auth.NewJWTService(&app.config)
	authMiddleware := auth.AuthMiddleware(authService, app.redis)
	tmdbClient := movies.NewTMDBClient(app.config.TMDBToken)

	authHandler := auth.NewHandler(userStore, authService, app.redis)
	authHandler.RegisterRoutes(app.router, authMiddleware)
	userHandler := users.NewHandler(userStore)
	userHandler.RegisterRoutes(app.router, authMiddleware)
	movieHandler := movies.NewHandler(tmdbClient, movieStore)
	movieHandler.RegisterRoutes(app.router)

	bookingStore := bookings.NewStore(app.db)
	bookingHandler := bookings.NewHandler(bookingStore)
	bookingHandler.RegisterRoutes(app.router)
}

func (app *Application) Run() error {
	db, err := database.InitDB(app.config.DatabaseURL)
	if err != nil {
		return err
	}
	app.db = db

	app.redis = database.InitRedis(app.config.RedisURL)

	log.Println("Rodando migrações do banco de dados (AutoMigrate)...")
	movies.AutoMigrate(app.db)
	users.AutoMigrate(app.db)
	bookings.AutoMigrate(app.db)
	social.AutoMigrate(app.db)

	app.mount()

	log.Printf("Servidor rodando em http://localhost:%s", app.config.Port)
	return http.ListenAndServe(":"+app.config.Port, app.router)
}
