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
	db := testutil.SetupTestDB(t)
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	store := NewStore(db)
	tmdbMock := new(MockTMDBService)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdbMock, store, uProv, lProv)

	tmdbID := 999 
	tmdbDetails := &TMDBMovieDetails{
		ID:          tmdbID,
		Title:       "Teste Integração Cache",
		Overview:    "Validando se salva no banco",
		ReleaseDate: "2024-01-01",
		Runtime:     120,
	}

	tmdbMock.On("GetMovieDetails", mock.Anything, tmdbID).Return(tmdbDetails, nil).Once()

	movie, err := svc.GetMovieDetails(ctx, tmdbID)
	require.NoError(t, err)
	assert.Equal(t, "Teste Integração Cache", movie.Title)
	tmdbMock.AssertExpectations(t)

	movieFromDB, err := svc.GetMovieDetails(ctx, tmdbID)
	require.NoError(t, err)
	assert.Equal(t, "Teste Integração Cache", movieFromDB.Title)
	assert.NotZero(t, movieFromDB.ID, "O ID do banco deveria estar populado")
	
	var dbMovie Movie
	err = db.Where("tmdb_id = ?", tmdbID).First(&dbMovie).Error
	require.NoError(t, err, "O filme deveria estar persistido no banco de dados")
}
