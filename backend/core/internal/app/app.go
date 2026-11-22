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
	analyticalhandler "github.com/StartLivin/screek/backend/internal/analytics/handler"
	analyticalstore "github.com/StartLivin/screek/backend/internal/analytics/store"
	"github.com/StartLivin/screek/backend/internal/auth"
	authhandler "github.com/StartLivin/screek/backend/internal/auth/handler"
	authjwt "github.com/StartLivin/screek/backend/internal/auth/jwt"
	"github.com/StartLivin/screek/backend/internal/bookings"
	bookinghandler "github.com/StartLivin/screek/backend/internal/bookings/handler"
	"github.com/StartLivin/screek/backend/internal/bookings/infra/payment"
	bookingstore "github.com/StartLivin/screek/backend/internal/bookings/store"
	"github.com/StartLivin/screek/backend/internal/catalog"
	cataloghandler "github.com/StartLivin/screek/backend/internal/catalog/handler"
	catalogstore "github.com/StartLivin/screek/backend/internal/catalog/store"
	"github.com/StartLivin/screek/backend/internal/cinema"
	cinemahandler "github.com/StartLivin/screek/backend/internal/cinema/handler"
	cinemastore "github.com/StartLivin/screek/backend/internal/cinema/store"
	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	lbxdhandler "github.com/StartLivin/screek/backend/internal/imports/letterboxd/handler"
	"github.com/StartLivin/screek/backend/internal/movies"
	moviehandler "github.com/StartLivin/screek/backend/internal/movies/handler"
	moviestore "github.com/StartLivin/screek/backend/internal/movies/store"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
	"github.com/StartLivin/screek/backend/internal/notifications"
	notifhandler "github.com/StartLivin/screek/backend/internal/notifications/handler"
	"github.com/StartLivin/screek/backend/internal/notifications/realtime"
	notifstore "github.com/StartLivin/screek/backend/internal/notifications/store"
	"github.com/StartLivin/screek/backend/internal/recommendation"
	recommendationhandler "github.com/StartLivin/screek/backend/internal/recommendation/handler"
	recommendationstore "github.com/StartLivin/screek/backend/internal/recommendation/store"
	"github.com/StartLivin/screek/backend/internal/shared/config"
	"github.com/StartLivin/screek/backend/internal/shared/database"
	"github.com/StartLivin/screek/backend/internal/shared/email"
	"github.com/StartLivin/screek/backend/internal/shared/events"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/shared/jobs"
	"github.com/StartLivin/screek/backend/internal/shared/logging"
	"github.com/StartLivin/screek/backend/internal/shared/redis"
	"github.com/StartLivin/screek/backend/internal/social"
	socialhandler "github.com/StartLivin/screek/backend/internal/social/handler"
	socialstore "github.com/StartLivin/screek/backend/internal/social/store"
	"github.com/StartLivin/screek/backend/internal/users"
	userhandler "github.com/StartLivin/screek/backend/internal/users/handler"
	userstore "github.com/StartLivin/screek/backend/internal/users/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	redisclient "github.com/redis/go-redis/v9"
	"github.com/rs/cors"
	"gorm.io/gorm"

	_ "github.com/StartLivin/screek/backend/docs"
	httpSwagger "github.com/swaggo/http-swagger"
)

type Application struct {
	config    config.Config
	db        *gorm.DB
	redis     *redisclient.Client
	router    *chi.Mux
	hub       *realtime.Hub
	jobs      *jobs.JobRunner
	events    *events.EventBus
	userSvc   *users.UserService
	socialSvc *social.SocialService
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
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"https://screek.app",
		},
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

	app.router.Get("/swagger/*", httpSwagger.Handler(httpSwagger.UIConfig(map[string]string{
		"requestInterceptor": `(request) => {
			const key = Object.keys(request.headers || {}).find((name) => name.toLowerCase() === "authorization");
			if (key) {
				const value = String(request.headers[key]).trim();
				request.headers[key] = /^Bearer\s/i.test(value) ? value : "Bearer " + value;
			}
			return request;
		}`,
	})))

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

	// listAdapter é inicializado em duas fases por causa de uma
	// dependência circular: movieService → listAdapter → catalogSvc → movieService
	listAdapter := &listSearchAdapter{}
	userMovieAdapt := &userMovieAdapter{}

	userService := users.NewService(userStore, userMovieAdapt)
	notifService := notifications.NewService(notifStore, app.hub)

	movieService := movies.NewService(
		tmdbClient,
		movieStore,
		&userSearchAdapter{svc: userService},
		listAdapter,
	)
	userMovieAdapt.svc = movieService

	authSvc := auth.NewAuthService(&authUserAdapter{svc: userService}, jwtService, app.redis, resendClient)
	mgmtSvc := cinema.NewService(mgmtStore, &cinemaMovieAdapter{svc: movieService}, app.events)
	analyticsSvc := analytics.NewService(analyticsStore, &analyticsMovieAdapter{svc: movieService}, &analyticsCinemaAdapter{svc: mgmtSvc})
	catalogSvc := catalog.NewService(catalogStore, &catalogUserAdapter{svc: userService}, &catalogMovieAdapter{svc: movieService})
	bookingSvc := bookings.NewService(bookingStore, app.redis, paymentSvc, resendClient, &bookingMovieAdapter{svc: movieService}, &bookingUserAdapter{svc: userService}, app.events)
	socialSvc := social.NewService(socialStore, app.events, &userSearchAdapter{svc: userService}, &sessionSearchAdapter{svc: bookingSvc, movieSvc: movieService, mgmtSvc: mgmtSvc})

	app.userSvc = userService
	app.socialSvc = socialSvc

	listAdapter.catalogSvc = catalogSvc
	listAdapter.userSvc = userService

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
	letterboxdSvc := letterboxd.NewService(&letterboxdMovieAdapter{svc: movieService}, &letterboxdCatalogAdapter{svc: catalogSvc})
	recommendationClient := recommendation.NewClient(app.config.RecommendationURL)
	letterboxdHandler := lbxdhandler.NewHandler(letterboxdSvc, recommendationClient)

	recommendationSvc := recommendation.NewService(
		recommendationClient,
		&recommendationMovieAdapter{svc: movieService},
		recommendationstore.NewFeedbackStore(app.db),
	)
	recommendationHandler := recommendationhandler.NewHandler(recommendationSvc)

	app.registerEventHandlers(notifService, mgmtSvc, socialSvc)

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
		recommendationHandler,
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
	logging.Setup()

	db, err := database.InitDB(app.config.DatabaseURL)
	if err != nil {
		return err
	}

	app.db = db
	app.redis, err = redis.InitRedis(app.config.RedisURL)
	if err != nil {
		return err
	}

	if app.config.RunMigrations {
		slog.Info("Executando migrações automáticas...")
		if err := userstore.AutoMigrate(app.db); err != nil {
			return err
		}
		if err := moviestore.AutoMigrate(app.db); err != nil {
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
		if err := recommendationstore.AutoMigrate(app.db); err != nil {
			return err
		}
		slog.Info("Migrações executadas com sucesso!", "db", "postgres")
	} else {
		slog.Info("Migrações automáticas desativadas (RUN_MIGRATIONS=false)")
	}

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
	recommendationH *recommendationhandler.Handler,
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
	recommendationH.RegisterRoutes(r, authMiddleware)

	return r
}

func (app *Application) registerEventHandlers(notifSvc *notifications.NotificationService, mgmtSvc *cinema.CinemaService, socialSvc *social.SocialService) {
	app.events.Subscribe(events.EventPostLiked, func(payload any) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		evt := payload.(events.PostLikedEvent)
		likerName := "Alguém"

		if user, err := app.userSvc.GetUserByID(ctx, evt.LikerID); err == nil && user != nil {
			likerName = user.Username
		}
		notifSvc.Notify(context.Background(), evt.OwnerID, "LIKE", "Novo Like", likerName+" curtiu seu post!", fmt.Sprintf("/posts/%d", evt.PostID))
	})

	app.events.Subscribe(events.EventUserFollowed, func(payload any) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		evt := payload.(events.UserFollowedEvent)
		followerName := "Alguém"

		if user, err := app.userSvc.GetUserByID(ctx, evt.FollowerID); err == nil && user != nil {
			followerName = user.Username
		}
		notifSvc.Notify(context.Background(), evt.FolloweeID, "FOLLOW", "Novo Seguidor", followerName+" começou a seguir você", fmt.Sprintf("/u/%s", followerName))
	})

	app.events.Subscribe(events.EventCommentAdded, func(payload any) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		evt := payload.(events.CommentAddedEvent)
		userName := "Alguém"

		if user, err := app.userSvc.GetUserByID(ctx, evt.UserID); err == nil && user != nil {
			userName = user.Username
		}
		notifSvc.Notify(context.Background(), evt.ParentOwnerID, "COMMENT", "Novo Comentário", userName+" respondeu ao seu post", fmt.Sprintf("/posts/%d", evt.PostID))
	})

	app.events.Subscribe(events.EventSessionScheduled, func(payload any) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		evt := payload.(events.SessionScheduledEvent)
		matches, err := mgmtSvc.GetWatchlistMatchesForSession(ctx, evt.SessionID)

		if err != nil {
			return
		}

		notifSvc.ProcessWatchlistMatches(context.Background(), matches)
	})

	app.events.Subscribe(events.EventTicketPurchased, func(payload any) {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		evt := payload.(events.TicketPurchasedEvent)

		for _, t := range evt.Tickets {
			if app.config.ResendKey != "" {
				resend := email.NewResendClient(app.config.ResendKey)
				resend.SendTicketEmail(ctx, evt.UserEmail, evt.UserName, t.QRCode)
			}
		}

		notifSvc.Notify(ctx, evt.UserID, "PURCHASE", "Compra Confirmada", "Seus ingressos já estão disponíveis!", "/users/me/tickets")
	})
}
