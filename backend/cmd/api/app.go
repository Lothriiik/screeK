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
	"github.com/StartLivin/cine-pass/backend/internal/platform/redis"
	redisclient "github.com/redis/go-redis/v9"
	"github.com/StartLivin/cine-pass/backend/internal/social"
	"github.com/StartLivin/cine-pass/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

type Application struct {
	config config.Config
	db     *gorm.DB
	redis  *redisclient.Client
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

	jwtService := auth.NewJWTService(&app.config)
	authMiddleware := auth.AuthMiddleware(jwtService, app.redis)
	tmdbClient := movies.NewTMDBClient(app.config.TMDBToken)

	authSvc := auth.NewAuthService(userStore, jwtService, app.redis)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(app.router, authMiddleware)
	userService := users.NewService(userStore, movieStore)
	userHandler := users.NewHandler(userService)
	userHandler.RegisterRoutes(app.router, authMiddleware)
	movieService := movies.NewService(tmdbClient, movieStore)
	movieHandler := movies.NewHandler(movieService)
	movieHandler.RegisterRoutes(app.router)

	bookingStore := bookings.NewStore(app.db)
	bookingService := bookings.NewService(bookingStore, app.redis)
	bookingHandler := bookings.NewHandler(bookingService)
	bookingHandler.RegisterRoutes(app.router, authMiddleware)

}

func (app *Application) Run() error {
	db, err := database.InitDB(app.config.DatabaseURL)
	if err != nil {
		return err
	}

	app.db = db
	app.redis = redis.InitRedis(app.config.RedisURL)
	
	log.Println("Rodando migrações do banco de dados (AutoMigrate)...")
	movies.AutoMigrate(app.db)
	users.AutoMigrate(app.db)
	bookings.AutoMigrate(app.db)
	social.AutoMigrate(app.db)

	bookings.StartExpirationWorker(app.db)

	app.mount()

	log.Printf("Servidor rodando em http://localhost:%s", app.config.Port)
	return http.ListenAndServe(":"+app.config.Port, app.router)
}
