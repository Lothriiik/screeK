package main

import (
	"log"

	"github.com/StartLivin/screek/backend/internal/app"
	"github.com/StartLivin/screek/backend/internal/platform/config"
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
	// 1. Carregar Configurações
	cfg := config.LoadConfig()

	// 2. Instanciar a Aplicação (internal/app)
	application := app.NewApplication(cfg)

	// 3. Rodar a aplicação (com Graceful Shutdown embutido)
	if err := application.Run(); err != nil {
		log.Fatal("Erro fatal na aplicação: ", err)
	}
}
