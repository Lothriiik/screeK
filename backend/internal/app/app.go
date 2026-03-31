package app

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/database"
	"github.com/StartLivin/screek/backend/internal/platform/email"
	"github.com/StartLivin/screek/backend/internal/platform/redis"
	redisclient "github.com/redis/go-redis/v9"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/platform/jobs"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"

	_ "github.com/StartLivin/screek/backend/docs"
	httpSwagger "github.com/swaggo/http-swagger"
)

type Application struct {
	config config.Config
	db     *gorm.DB
	redis  *redisclient.Client
	router *chi.Mux
	hub    *notifications.Hub
	jobs   *jobs.JobRunner
}

func NewApplication(cfg config.Config) *Application {
	return &Application{
		config: cfg,
		router: chi.NewRouter(),
		hub:    notifications.NewHub(),
		jobs:   jobs.NewRunner(),
	}
}

func (app *Application) Router() *chi.Mux {
	return app.router
}

func (app *Application) mount() {
	app.router.Use(httputil.Logger)
	app.router.Use(middleware.Recoverer)
	app.router.Use(httputil.RateLimit(10, 15))

	app.router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Bem-vindo à API do screeK! 🎬",
		})
	})

	app.router.Get("/swagger/*", httpSwagger.WrapHandler)

	userStore := users.NewStore(app.db)
	movieStore := movies.NewStore(app.db)

	jwtService := auth.NewJWTService(&app.config)
	authMiddleware := auth.AuthMiddleware(jwtService, app.redis)
	tmdbClient := movies.NewTMDBClient(app.config.TMDBToken)

	resendClient := email.NewResendClient(app.config.ResendKey)

	authSvc := auth.NewAuthService(userStore, jwtService, app.redis, resendClient)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(app.router, authMiddleware)

	userService := users.NewService(userStore, movieStore)
	userHandler := users.NewHandler(userService)
	userHandler.RegisterRoutes(app.router, authMiddleware)

	adminHandler := users.NewAdminHandler(userService)
	adminHandler.RegisterRoutes(app.router, authMiddleware)

	movieService := movies.NewService(tmdbClient, movieStore)
	movieHandler := movies.NewHandler(movieService)
	movieHandler.RegisterRoutes(app.router)

	notificationStore := notifications.NewStore(app.db)
	notificationService := notifications.NewService(notificationStore, app.hub)
	notificationHandler := notifications.NewHandler(notificationService)
	notificationHandler.RegisterRoutes(app.router, authMiddleware)

	bookingStore := bookings.NewStore(app.db)
	paymentSvc := payment.NewStripeService(app.config.StripeKey, app.config.StripeWebhookSecret)
	bookingService := bookings.NewService(bookingStore, app.redis, paymentSvc, resendClient, movieService)
	bookingHandler := bookings.NewHandler(bookingService)
	bookingHandler.RegisterRoutes(app.router, authMiddleware)

	managerHandler := bookings.NewManagerHandler(bookingService)
	managerHandler.RegisterRoutes(app.router, authMiddleware)

	analyticsHandler := bookings.NewAnalyticsHandler(bookingService)
	analyticsHandler.RegisterRoutes(app.router, authMiddleware)

	webhookHandler := bookings.NewWebhookHandler(bookingService, paymentSvc)
	app.router.Post("/webhooks/stripe", webhookHandler.StripeWebhook)

	socialStore := social.NewStore(app.db)
	socialService := social.NewService(socialStore, userService, notificationService)
	socialHandler := social.NewHandler(socialService)
	socialHandler.RegisterRoutes(app.router, authMiddleware)

	app.jobs.Register("@every 1m", "Reserva Cleanup", func() {
		bookingService.CleanupExpiredReservations(context.Background())
	})
	app.jobs.Register("@midnight", "Analytics Diário", func() {
		bookingService.RunAnalyticsAggregation(context.Background(), time.Now().AddDate(0, 0, -1))
	})
	app.jobs.Register("@daily", "Watchlist Matches", func() {
		matches, err := bookingStore.GetWatchlistMatches(context.Background())
		if err != nil {
			return
		}
		var dtos []notifications.WatchlistMatchDTO
		for _, m := range matches {
			dtos = append(dtos, notifications.WatchlistMatchDTO{
				UserID:     m.UserID,
				MovieID:    m.MovieID,
				MovieTitle: m.MovieTitle,
				City:       m.City,
				Type:       m.Type,
			})
		}
		notificationService.ProcessWatchlistMatches(context.Background(), dtos)
	})
}

func (app *Application) Run() error {

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	db, err := database.InitDB(app.config.DatabaseURL)
	if err != nil {
		return err
	}

	app.db = db
	app.redis = redis.InitRedis(app.config.RedisURL)
	
	slog.Info("Sistema iniciado - Rodando migrações...", "db", "postgres")
	movies.AutoMigrate(app.db)
	users.AutoMigrate(app.db)
	bookings.AutoMigrate(app.db)
	social.AutoMigrate(app.db)
	notifications.AutoMigrate(app.db)
	
	go app.hub.Run()

	app.mount()

	app.jobs.Start()
	defer app.jobs.Stop()

	srv := &http.Server{
		Addr:    ":" + app.config.Port,
		Handler: app.router,
	}

	shutdownError := make(chan error)
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		slog.Warn("Sinal de encerramento recebido", "signal", s.String())

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		err := srv.Shutdown(ctx)
		if err != nil {
			shutdownError <- err
		}

		slog.Info("Limpando conexões e enviando logs finais...")
		sqlDB, _ := app.db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
		app.redis.Close()

		shutdownError <- nil
	}()

	slog.Info("Servidor rodando", "host", "http://localhost:"+app.config.Port)
	
	err = srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdownError
	if err != nil {
		return err
	}

	slog.Info("Desligamento completo com sucesso")
	return nil
}
