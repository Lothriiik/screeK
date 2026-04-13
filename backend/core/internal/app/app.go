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

	"github.com/StartLivin/screek/backend/internal/analytics"
	analyticalstore "github.com/StartLivin/screek/backend/internal/analytics/store"
    analyticalhandler "github.com/StartLivin/screek/backend/internal/analytics/handler"
	"github.com/StartLivin/screek/backend/internal/auth"
	authhandler "github.com/StartLivin/screek/backend/internal/auth/handler"
    authjwt "github.com/StartLivin/screek/backend/internal/auth/jwt"
	"github.com/StartLivin/screek/backend/internal/bookings"
	bookingstore "github.com/StartLivin/screek/backend/internal/bookings/store"
    bookinghandler "github.com/StartLivin/screek/backend/internal/bookings/handler"
	"github.com/StartLivin/screek/backend/internal/bookings/infra/payment"
	"github.com/StartLivin/screek/backend/internal/catalog"
	catalogstore "github.com/StartLivin/screek/backend/internal/catalog/store"
    cataloghandler "github.com/StartLivin/screek/backend/internal/catalog/handler"
	"github.com/StartLivin/screek/backend/internal/cinema"
	cinemastore "github.com/StartLivin/screek/backend/internal/cinema/store"
	cinemahandler "github.com/StartLivin/screek/backend/internal/cinema/handler"
	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	lbxdhandler "github.com/StartLivin/screek/backend/internal/imports/letterboxd/handler"
	"github.com/StartLivin/screek/backend/internal/movies"
	moviestore "github.com/StartLivin/screek/backend/internal/movies/store"
    moviehandler "github.com/StartLivin/screek/backend/internal/movies/handler"
    movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
	"github.com/StartLivin/screek/backend/internal/notifications"
    notifhandler "github.com/StartLivin/screek/backend/internal/notifications/handler"
	notifstore "github.com/StartLivin/screek/backend/internal/notifications/store"
    "github.com/StartLivin/screek/backend/internal/notifications/realtime"
	"github.com/StartLivin/screek/backend/internal/shared/config"
	"github.com/StartLivin/screek/backend/internal/shared/database"
	"github.com/StartLivin/screek/backend/internal/shared/email"
	"github.com/StartLivin/screek/backend/internal/shared/events"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/shared/jobs"
	"github.com/StartLivin/screek/backend/internal/shared/redis"
	"github.com/StartLivin/screek/backend/internal/social"
	socialstore "github.com/StartLivin/screek/backend/internal/social/store"
    socialhandler "github.com/StartLivin/screek/backend/internal/social/handler"
	"github.com/StartLivin/screek/backend/internal/users"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
    userhandler "github.com/StartLivin/screek/backend/internal/users/handler"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	redisclient "github.com/redis/go-redis/v9"
	"github.com/rs/cors"
	"gorm.io/gorm"

	_ "github.com/StartLivin/screek/backend/docs"
	httpSwagger "github.com/swaggo/http-swagger"
)

type Application struct {
	config config.Config
	db     *gorm.DB
	redis  *redisclient.Client
	router *chi.Mux
	hub    *realtime.Hub
	jobs   *jobs.JobRunner
	events *events.EventBus
}

func NewApplication(cfg config.Config) *Application {
	return &Application{
		config: cfg,
		router: chi.NewRouter(),
		hub:    realtime.NewHub(),
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

	userStore := userstore.NewStore(app.db)
	movieStore := moviestore.NewStore(app.db)
	bookingStore := bookingstore.NewStore(app.db)
	mgmtStore := cinemastore.NewStore(app.db)
	analyticsStore := analyticalstore.NewStore(app.db)
	catalogStore := catalogstore.NewStore(app.db)
	socialStore := socialstore.NewStore(app.db)
	notifStore := notifstore.NewStore(app.db)

	jwtService := authjwt.NewJWTService(&app.config)
	tmdbClient := movietmdb.NewTMDBClient(app.config.TMDBToken)
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
	mgmtSvc := cinema.NewService(mgmtStore, movieService, app.events)
	analyticsSvc := analytics.NewService(analyticsStore, movieService, mgmtSvc)
	catalogSvc := catalog.NewService(catalogStore, userService, movieService)
	socialSvc := social.NewService(socialStore, userStore, app.events, sessionAdapter)
	bookingSvc := bookings.NewService(bookingStore, app.redis, paymentSvc, resendClient, movieService, userService, app.events)

	userAdapter.svc = userService
	listAdapter.catalogSvc = catalogSvc
	listAdapter.userSvc = userService
	sessionAdapter.svc = bookingSvc
	sessionAdapter.movieSvc = movieService
	sessionAdapter.mgmtSvc = mgmtSvc

	authHandler := authhandler.NewHandler(authSvc)
	authAdminHandler := authhandler.NewAdminHandler(authSvc)
	userHandler := userhandler.NewHandler(userService)
	movieHandler := moviehandler.NewHandler(movieService)
	mgmtHandler := cinemahandler.NewHandler(mgmtSvc)
	analyticsHandler := analyticalhandler.NewHandler(analyticsSvc)
	catalogHandler := cataloghandler.NewHandler(catalogSvc)
	socialHandler := socialhandler.NewHandler(socialSvc)
	bookingHandler := bookinghandler.NewHandler(bookingSvc)
	notifHandler := notifhandler.NewHandler(notifService)
	webhookHandler := bookinghandler.NewWebhookHandler(bookingSvc, paymentSvc)
	letterboxdSvc := letterboxd.NewService(movieService, catalogSvc)
	letterboxdHandler := lbxdhandler.NewHandler(letterboxdSvc)

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
		letterboxdHandler,
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
	if err := userstore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := movies.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := cinemastore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := bookingstore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := catalogstore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := socialstore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := analyticalstore.AutoMigrate(app.db); err != nil {
		return err
	}
	if err := notifstore.AutoMigrate(app.db); err != nil {
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
	catalogSvc *catalog.CatalogService
	userSvc    *users.UserService
}

func (a *listSearchAdapter) SearchLists(ctx context.Context, query string) ([]movies.ListSearchResult, error) {
	lists, err := a.catalogSvc.SearchLists(ctx, query)
	if err != nil {
		return nil, err
	}
	var results []movies.ListSearchResult
	for _, l := range lists {
		username := "Usuário Desconhecido"
		if user, err := a.userSvc.GetUserByID(ctx, l.UserID); err == nil && user != nil {
			username = user.Username
		}

		results = append(results, movies.ListSearchResult{
			ID:          l.ID,
			Title:       l.Title,
			Description: l.Description,
			Username:    username,
		})
	}
	return results, nil
}

type sessionSearchAdapter struct {
	svc      bookings.Service
	movieSvc *movies.MovieService
	mgmtSvc  *cinema.CinemaService
}

func (a *sessionSearchAdapter) GetSessionPostData(ctx context.Context, sessionID uint) (*social.PostSessionData, error) {
	if a.svc == nil {
		return nil, errors.New("bookings service not initialized in adapter")
	}
	session, err := a.svc.GetSessionByID(ctx, int(sessionID))
	if err != nil {
		return nil, err
	}

	movieTitle := "Desconhecido"
	posterURL := ""
	if m, err := a.movieSvc.GetMovieDetails(ctx, session.MovieID); err == nil && m != nil {
		movieTitle = m.Title
		posterURL = m.PosterURL
	}

	cinemaName := "Desconhecido"
	if c, err := a.mgmtSvc.GetCinemaByID(ctx, session.Room.CinemaID); err == nil && c != nil {
		cinemaName = c.Name
	}

	return &social.PostSessionData{
		SessionID:  session.ID,
		MovieTitle: movieTitle,
		PosterURL:  posterURL,
		StartTime:  session.StartTime.Format("02/01 15:04"),
		RoomName:   session.Room.Name,
		CinemaName: cinemaName,
	}, nil
}

func (app *Application) buildRoutes(
	authH *authhandler.Handler,
	authAdminH *authhandler.AdminHandler,
	userH *userhandler.Handler,
	movieH *moviehandler.Handler,
	mgmtH *cinemahandler.ManagerHandler,
	analyticsH *analyticalhandler.AnalyticsHandler,
	catalogH *cataloghandler.CatalogHandler,
	socialH *socialhandler.Handler,
	bookingH *bookinghandler.Handler,
	notifH *notifhandler.Handler,
	letterboxdH *lbxdhandler.ImportHandler,
) http.Handler {
	r := chi.NewRouter()

	authMiddleware := authhandler.AuthMiddleware(authjwt.NewJWTService(&app.config), app.redis)

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
	letterboxdH.RegisterRoutes(r, authMiddleware)

	return r
}

func (app *Application) registerEventHandlers(notifSvc *notifications.NotificationService, mgmtSvc *cinema.CinemaService) {
	app.events.Subscribe(events.EventPostLiked, func(data events.Data) {
		userID := data["user_id"].(uuid.UUID)
		senderName := data["sender_name"].(string)
		postID := data["post_id"].(int)
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
		postID := data["post_id"].(int)
		notifSvc.Notify(context.Background(), userID, "COMMENT", "Novo Comentário", senderName+" respondeu ao seu post", fmt.Sprintf("/posts/%d", postID))
	})

	app.events.Subscribe(events.EventSessionScheduled, func(data events.Data) {
		sessionID := data["session_id"].(int)

		matches, err := mgmtSvc.GetWatchlistMatchesForSession(context.Background(), int(sessionID))
		if err != nil {
			return
		}

		notifSvc.ProcessWatchlistMatches(context.Background(), matches)
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
