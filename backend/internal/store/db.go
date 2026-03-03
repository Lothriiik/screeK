package store

import (
	"log"

	"github.com/StartLivin/cine-pass/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	log.Println("Conexão com PostgreSQL estabelecida com sucesso! 🐘")

	log.Println("Rodando migrações do banco de dados...")
	err = db.AutoMigrate(
		&models.User{},
		&models.Movie{}, &models.Genre{}, &models.Person{}, &models.MovieCredit{},
		&models.Cinema{}, &models.Room{}, &models.Seat{}, &models.Session{},
		&models.Transaction{}, &models.Ticket{},
		&models.Review{}, &models.ReviewLike{}, &models.ReviewComment{},
		&models.WatchedMovie{}, &models.WatchlistItem{},
		&models.MovieList{}, &models.MovieListItem{},
		&models.Follow{}, &models.Notification{},
	)

	if err != nil {
		log.Printf("Erro na migração: %v\n", err)
		return nil, err
	}

	return db, nil
}
