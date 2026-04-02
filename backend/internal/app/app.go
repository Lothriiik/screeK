package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"

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
	"github.com/StartLivin/screek/backend/internal/platform/events"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
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
	events *events.EventBus
}

func NewApplication(cfg config.Config) *Application {
	return &Application{
		config: cfg,
		router: chi.NewRouter(),
		hub:    notifications.NewHub(),
		jobs:   jobs.NewRunner(),
		events: events.NewEventBus(),
	}
}

func (app *Application) Router() *chi.Mux {
	return app.router
}

func (app *Application) mount() {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://screek.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	app.router.Use(c.Handler)

	app.router.Use(httputil.Logger)
	app.router.Use(middleware.Recoverer)
	app.router.Use(httputil.RateLimit(10, 15))

	app.router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Bem-vindo à API do screeK! 🎬",
			"version": "1.0.0",
		})
	})

	app.router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		status := "OK"
		dbStatus := "UP"
		sqlDB, err := app.db.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "DOWN"
			status = "ERROR"
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		json.NewEncoder(w).Encode(map[string]string{
			"status":   status,
			"database": dbStatus,
			"time":     time.Now().Format(time.RFC3339),
		})
	})

	app.router.Get("/swagger/*", httpSwagger.WrapHandler)

	userStore := users.NewStore(app.db)
	movieStore := movies.NewStore(app.db)
	bookingStore := bookings.NewStore(app.db)
	mgmtStore := management.NewStore(app.db)
	analyticsStore := analytics.NewStore(app.db)
	catalogStore := catalog.NewStore(app.db)
	socialStore := social.NewStore(app.db)
	notifStore := notifications.NewStore(app.db)

	jwtService := auth.NewJWTService(&app.config)
	tmdbClient := movies.NewTMDBClient(app.config.TMDBToken)
	resendClient := email.NewResendClient(app.config.ResendKey)
	paymentSvc := payment.NewStripeService(app.config.StripeKey, app.config.StripeWebhookSecret)

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
	mgmtSvc := management.NewService(mgmtStore, movieService, app.events)
	analyticsSvc := analytics.NewService(analyticsStore, movieService)
	catalogSvc := catalog.NewService(catalogStore, userService, movieService)
	socialSvc := social.NewService(socialStore, userStore, app.events, sessionAdapter)
	bookingSvc := bookings.NewService(bookingStore, app.redis, paymentSvc, resendClient, movieService, app.events)

	userAdapter.svc = userService
	listAdapter.svc = catalogSvc
	sessionAdapter.svc = bookingSvc

	authHandler := auth.NewHandler(authSvc)
	authAdminHandler := auth.NewAdminHandler(authSvc)
	userHandler := users.NewHandler(userService)
	movieHandler := movies.NewHandler(movieService)
	mgmtHandler := management.NewHandler(mgmtSvc)
	analyticsHandler := analytics.NewHandler(analyticsSvc)
	catalogHandler := catalog.NewHandler(catalogSvc)
	socialHandler := social.NewHandler(socialSvc)
	bookingHandler := bookings.NewHandler(bookingSvc)
	notifHandler := notifications.NewHandler(notifService)
	webhookHandler := bookings.NewWebhookHandler(bookingSvc, paymentSvc)

	app.registerEventHandlers(notifService, mgmtSvc)

	app.router.Mount("/api/v1", app.buildRoutes(
		authHandler, 
		authAdminHandler,
		userHandler, 
		movieHandler, 
		mgmtHandler, 
		analyticsHandler, 
		catalogHandler, 
		socialHandler, 
		bookingHandler, 
		notifHandler,
	))

	app.router.Post("/webhooks/stripe", webhookHandler.StripeWebhook)

	app.jobs.Register("@every 1m", "Reserva Cleanup", func() {
		bookingSvc.CleanupExpiredReservations(context.Background())
	})
	
	app.jobs.Register("@midnight", "Analytics Diário", func() {
		analyticsSvc.RunAnalyticsAggregation(context.Background(), time.Now().AddDate(0, 0, -1))
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

	slog.Info("Executando migrações automáticas...")
	if err := users.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := movies.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := domain.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := bookings.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := catalog.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := social.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := analytics.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := notifications.AutoMigrate(app.db); err != nil {
		return err
	}
	
	slog.Info("Sistema iniciado - Rodando migrações...", "db", "postgres")
	
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
			ID:        u.ID.String(),
			Username:  u.Username,
			Name:      u.Name,
			AvatarURL: u.AvatarURL,
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

func (app *Application) buildRoutes(
	authH *auth.Handler,
	authAdminH *auth.AdminHandler,
	userH *users.Handler,
	movieH *movies.Handler,
	mgmtH *management.ManagerHandler,
	analyticsH *analytics.AnalyticsHandler,
	catalogH *catalog.CatalogHandler,
	socialH *social.Handler,
	bookingH *bookings.Handler,
	notifH *notifications.Handler,
) http.Handler {
	r := chi.NewRouter()
	
	authMiddleware := auth.AuthMiddleware(auth.NewJWTService(&app.config), app.redis)

	authH.RegisterRoutes(r, authMiddleware)
	authAdminH.RegisterRoutes(r, authMiddleware)
	userH.RegisterRoutes(r, authMiddleware)
	movieH.RegisterRoutes(r)
	mgmtH.RegisterRoutes(r, authMiddleware)
	analyticsH.RegisterRoutes(r, authMiddleware)
	catalogH.RegisterRoutes(r, authMiddleware)
	socialH.RegisterRoutes(r, authMiddleware)
	bookingH.RegisterRoutes(r, authMiddleware)
	notifH.RegisterRoutes(r, authMiddleware)

	return r
}

func (app *Application) registerEventHandlers(notifSvc *notifications.NotificationService, mgmtSvc *management.ManagementService) {
	app.events.Subscribe(events.EventPostLiked, func(data events.Data) {
		userID := data["user_id"].(uuid.UUID)
		senderName := data["sender_name"].(string)
		postID := data["post_id"].(uint)
		notifSvc.Notify(context.Background(), userID, "LIKE", "Novo Like", senderName+" curtiu seu post!", fmt.Sprintf("/posts/%d", postID))
	})

	app.events.Subscribe(events.EventUserFollowed, func(data events.Data) {
		userID := data["user_id"].(uuid.UUID)
		senderName := data["sender_name"].(string)
		notifSvc.Notify(context.Background(), userID, "FOLLOW", "Novo Seguidor", senderName+" começou a seguir você", fmt.Sprintf("/u/%s", senderName))
	})

	app.events.Subscribe(events.EventCommentAdded, func(data events.Data) {
		userID := data["user_id"].(uuid.UUID)
		senderName := data["sender_name"].(string)
		postID := data["post_id"].(uint)
		notifSvc.Notify(context.Background(), userID, "COMMENT", "Novo Comentário", senderName+" respondeu ao seu post", fmt.Sprintf("/posts/%d", postID))
	})

	app.events.Subscribe(events.EventSessionScheduled, func(data events.Data) {
		sessionID := data["session_id"].(uint)
		
		matches, err := mgmtSvc.GetWatchlistMatchesForSession(context.Background(), int(sessionID))
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
		notifSvc.ProcessWatchlistMatches(context.Background(), dtos)
	})

	app.events.Subscribe(events.EventTicketPurchased, func(data events.Data) {
		userEmail := data["user_email"].(string)
		userName := data["user_name"].(string)
		tickets := data["tickets"].([]bookings.Ticket)

		bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		for _, t := range tickets {
			if app.config.ResendKey != "" {
				resend := email.NewResendClient(app.config.ResendKey)
				resend.SendTicketEmail(bgCtx, userEmail, userName, t.QRCode)
			}
		}
		
		userID := data["user_id"].(uuid.UUID)
		notifSvc.Notify(bgCtx, userID, "PURCHASE", "Compra Confirmada", "Seus ingressos já estão disponíveis!", "/users/me/tickets")
	})
}
