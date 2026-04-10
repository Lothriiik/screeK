package main

import (
	"log"

	"github.com/StartLivin/screek/backend/internal/app"
	"github.com/StartLivin/screek/backend/internal/shared/config"
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
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Erro ao carregar configurações: ", err)
	}

	application := app.NewApplication(cfg)

	if err := application.Run(); err != nil {
		log.Fatal("Erro fatal na aplicação: ", err)
	}
}
