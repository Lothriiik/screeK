package movies

import (
	"context"
	"testing"

	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func Test_integ_cache_aside_fluxo_real(t *testing.T) {
	// 1. Setup do Banco Real
	db := testutil.SetupTestDB(t)
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	store := NewStore(db)
	tmdbMock := new(MockTMDBService)
	svc := NewService(tmdbMock, store)

	tmdbID := 999 // ID fictício para o teste
	tmdbDetails := &TMDBMovieDetails{
		ID:          tmdbID,
		Title:       "Teste Integração Cache",
		Overview:    "Validando se salva no banco",
		ReleaseDate: "2024-01-01",
		Runtime:     120,
	}

	// 2. Primeira chamada: DEVE chamar o TMDB (Mock) e salvar no Postgres
	// Usamos .Once() para garantir que se houver uma segunda chamada indevida, o teste falhe.
	tmdbMock.On("GetMovieDetails", mock.Anything, tmdbID).Return(tmdbDetails, nil).Once()

	movie, err := svc.GetMovieDetails(ctx, tmdbID)
	require.NoError(t, err)
	assert.Equal(t, "Teste Integração Cache", movie.Title)
	tmdbMock.AssertExpectations(t)

	// 3. Segunda chamada: DEVE ler do Postgres SEM chamar o TMDB novamente
	// O service.go deve encontrar no banco e retornar antes do mock.
	movieFromDB, err := svc.GetMovieDetails(ctx, tmdbID)
	require.NoError(t, err)
	assert.Equal(t, "Teste Integração Cache", movieFromDB.Title)
	assert.NotZero(t, movieFromDB.ID, "O ID do banco deveria estar populado")
	
	// Verifica no banco se o registro realmente existe
	var dbMovie Movie
	err = db.Where("tmdb_id = ?", tmdbID).First(&dbMovie).Error
	require.NoError(t, err, "O filme deveria estar persistido no banco de dados")
}
