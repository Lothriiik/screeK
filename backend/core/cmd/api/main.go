package main

import (
	"log/slog"
	"os"

	"github.com/StartLivin/screek/backend/internal/app"
	"github.com/StartLivin/screek/backend/internal/shared/config"
	"github.com/StartLivin/screek/backend/internal/shared/logging"
)

// @title screeK API
// @version 1.0
// @description API para a plataforma de cinema screeK.
// @termsOfService http://swagger.io/terms/

// @contact.name Suporte screeK
// @contact.url http://www.screek.com/support
// @contact.email suporte@screek.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8003
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	logging.Setup()

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("Falha ao carregar configurações", "error", err)
		os.Exit(1)
	}

	application := app.NewApplication(cfg)

	if err := application.Run(); err != nil {
		slog.Error("Falha fatal na aplicação", "error", err)
		os.Exit(1)
	}
}
