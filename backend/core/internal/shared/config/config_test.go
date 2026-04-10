package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadConfig_Validation(t *testing.T) {
	// Limpar variáveis para o teste
	os.Setenv("DATABASE_URL", "")
	os.Setenv("TMDB_TOKEN", "")
	os.Setenv("JWT_SECRET", "")

	t.Run("Deve falhar se DATABASE_URL estiver ausente", func(t *testing.T) {
		_, err := LoadConfig()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "DATABASE_URL")
	})

	t.Run("Deve carregar com sucesso se todas as vars estiverem presentes", func(t *testing.T) {
		os.Setenv("DATABASE_URL", "postgres://localhost:5432/db")
		os.Setenv("TMDB_TOKEN", "secret_token")
		os.Setenv("JWT_SECRET", "super_secret")
		
		cfg, err := LoadConfig()
		assert.NoError(t, err)
		assert.Equal(t, "8003", cfg.Port) // Default
		assert.Equal(t, "postgres://localhost:5432/db", cfg.DatabaseURL)
	})
}
