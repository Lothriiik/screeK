package testutil

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=password dbname=screek_test port=5432 sslmode=disable TimeZone=America/Sao_Paulo"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "falha ao conectar no banco de teste")

	return db
}

func CleanupDB(t *testing.T, db *gorm.DB) {
	t.Helper()

	tables := []string{
		"tickets",
		"transactions",
		"daily_cinema_stats",
		"daily_movie_stats",
		"sessions",
		"seats",
		"rooms",
		"cinema_managers",
		"cinemas",
		"comments",
		"likes",
		"posts",
		"movie_lists",
		"follows",
		"notifications",
		"movie_favorites",
		"users",
		"movie_genres",
		"genres",
		"movies",
		"movie_details",
		"people",
	}

	for _, table := range tables {
		db.Exec("TRUNCATE TABLE " + table + " RESTART IDENTITY CASCADE")
	}
}
