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

	err := db.Transaction(func(tx *gorm.DB) error {
		// Desabilita as triggers para evitar problemas de FK durante o truncate
		tx.Exec("SET CONSTRAINTS ALL DEFERRED")
		
		// Busca todas as tabelas do esquema public
		var tables []string
		tx.Raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'").Scan(&tables)

		for _, table := range tables {
			if table == "spatial_ref_sys" { // Ignorar tabelas de sistema/extensões
				continue
			}
			tx.Exec("TRUNCATE TABLE " + table + " RESTART IDENTITY CASCADE")
		}
		return nil
	})

	require.NoError(t, err, "falha ao limpar o banco de teste")
}
