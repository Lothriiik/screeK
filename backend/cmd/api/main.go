package main

import (
	"log"

	"github.com/StartLivin/screek/backend/internal/platform/config"
)

func main() {
	cfg := config.LoadConfig()

	app := NewApplication(cfg)

	if err := app.Run(); err != nil {
		log.Fatal("Erro na aplicação: ", err)
	}
}
