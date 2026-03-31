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

	"github.com/StartLivin/screek/backend/internal/analytics"
	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/catalog"
	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/management"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/StartLivin/screek/backend/internal/platform/config"
	"github.com/StartLivin/screek/backend/internal/platform/database"
	"github.com/StartLivin/screek/backend/internal/platform/email"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/platform/jobs"
	"github.com/StartLivin/screek/backend/internal/platform/redis"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	redisclient "github.com/redis/go-redis/v9"
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

	// Repositories
	userStore := users.NewStore(app.db)
	movieStore := movies.NewStore(app.db)
	bookingStore := bookings.NewStore(app.db)
	mgmtStore := management.NewStore(app.db)
	analyticsStore := analytics.NewStore(app.db)
	catalogStore := catalog.NewStore(app.db)
	socialStore := social.NewStore(app.db)
	notifStore := notifications.NewStore(app.db)

	// Platform Services
	jwtService := auth.NewJWTService(&app.config)
	authMiddleware := auth.AuthMiddleware(jwtService, app.redis)
	tmdbClient := movies.NewTMDBClient(app.config.TMDBToken)
	resendClient := email.NewResendClient(app.config.ResendKey)
	paymentSvc := payment.NewStripeService(app.config.StripeKey, app.config.StripeWebhookSecret)

	// Business Services (with Late Binding for Circular Dependencies)
	userAdapter := &userSearchAdapter{}
	listAdapter := &listSearchAdapter{}
	sessionAdapter := &sessionSearchAdapter{}

	movieService := movies.NewService(
		tmdbClient,
		movieStore,
		userAdapter,
		listAdapter,
	)

	userService := users.NewService(userStore, movieStore)
	notifService := notifications.NewService(notifStore, app.hub)
	
	authSvc := auth.NewAuthService(userStore, jwtService, app.redis, resendClient)
	mgmtSvc := management.NewService(mgmtStore, movieService)
	analyticsSvc := analytics.NewService(analyticsStore, movieService)
	catalogSvc := catalog.NewService(catalogStore, userService, movieService)
	socialSvc := social.NewService(socialStore, userService, notifService, sessionAdapter)
	bookingSvc := bookings.NewService(bookingStore, app.redis, paymentSvc, resendClient, movieService)

	// Set adapters dependencies
	userAdapter.svc = userService
	listAdapter.svc = catalogSvc
	sessionAdapter.svc = bookingSvc

	// Handlers Registration
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(app.router, authMiddleware)

	authAdminHandler := auth.NewAdminHandler(authSvc)
	authAdminHandler.RegisterRoutes(app.router, authMiddleware)

	userHandler := users.NewHandler(userService)
	userHandler.RegisterRoutes(app.router, authMiddleware)

	movieHandler := movies.NewHandler(movieService)
	movieHandler.RegisterRoutes(app.router)

	mgmtHandler := management.NewHandler(mgmtSvc)
	mgmtHandler.RegisterRoutes(app.router, authMiddleware)

	analyticsHandler := analytics.NewHandler(analyticsSvc)
	analyticsHandler.RegisterRoutes(app.router, authMiddleware)

	catalogHandler := catalog.NewHandler(catalogSvc)
	catalogHandler.RegisterRoutes(app.router, authMiddleware)

	socialHandler := social.NewHandler(socialSvc)
	socialHandler.RegisterRoutes(app.router, authMiddleware)

	bookingHandler := bookings.NewHandler(bookingSvc)
	bookingHandler.RegisterRoutes(app.router, authMiddleware)

	notifHandler := notifications.NewHandler(notifService)
	notifHandler.RegisterRoutes(app.router, authMiddleware)

	webhookHandler := bookings.NewWebhookHandler(bookingSvc, paymentSvc)
	app.router.Post("/webhooks/stripe", webhookHandler.StripeWebhook)

	// Background Jobs
	app.jobs.Register("@every 1m", "Reserva Cleanup", func() {
		bookingSvc.CleanupExpiredReservations(context.Background())
	})
	
	app.jobs.Register("@midnight", "Analytics Diário", func() {
		analyticsSvc.RunAnalyticsAggregation(context.Background(), time.Now().AddDate(0, 0, -1))
	})

	app.jobs.Register("@daily", "Watchlist Matches", func() {
		matches, err := mgmtStore.GetWatchlistMatches(context.Background())
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
		notifService.ProcessWatchlistMatches(context.Background(), dtos)
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
	domain.AutoMigrate(app.db)
	movies.AutoMigrate(app.db)
	users.AutoMigrate(app.db)
	bookings.AutoMigrate(app.db)
	social.AutoMigrate(app.db)
	catalog.AutoMigrate(app.db)
	analytics.AutoMigrate(app.db)
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

// Search Adapters to avoid direct circular dependencies between modules

type userSearchAdapter struct {
	svc *users.UserService
}

func (a *userSearchAdapter) SearchUsers(ctx context.Context, query string) ([]movies.UserSearchResult, error) {
	usersList, err := a.svc.SearchUsers(ctx, query)
	if err != nil {
		return nil, err
	}
	var results []movies.UserSearchResult
	for _, u := range usersList {
		results = append(results, movies.UserSearchResult{
			ID:       u.ID.String(),
			Username: u.Username,
			Name:     u.Name,
			PhotoURL: u.PhotoURL,
		})
	}
	return results, nil
}

type listSearchAdapter struct {
	svc *catalog.CatalogService
}

func (a *listSearchAdapter) SearchLists(ctx context.Context, query string) ([]movies.ListSearchResult, error) {
	lists, err := a.svc.SearchLists(ctx, query)
	if err != nil {
		return nil, err
	}
	var results []movies.ListSearchResult
	for _, l := range lists {
		results = append(results, movies.ListSearchResult{
			ID:          l.ID,
			Title:       l.Title,
			Description: l.Description,
			Username:    l.User.Username,
		})
	}
	return results, nil
}

type sessionSearchAdapter struct {
	svc bookings.Service
}

func (a *sessionSearchAdapter) GetSessionPostData(ctx context.Context, sessionID uint) (*social.PostSessionData, error) {
	if a.svc == nil {
		return nil, errors.New("bookings service not initialized in adapter")
	}
	session, err := a.svc.GetSessionByID(ctx, int(sessionID))
	if err != nil {
		return nil, err
	}

	return &social.PostSessionData{
		SessionID:  session.ID,
		MovieTitle: session.Movie.Title,
		PosterURL:  session.Movie.PosterURL,
		StartTime:  session.StartTime.Format("02/01 15:04"),
		RoomName:   session.Room.Name,
		CinemaName: session.Room.Cinema.Name,
	}, nil
}
