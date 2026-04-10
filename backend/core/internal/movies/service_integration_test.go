package movies_test

import (
	"context"
	"testing"

	"github.com/StartLivin/screek/backend/internal/shared/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/StartLivin/screek/backend/internal/movies"
	moviestore "github.com/StartLivin/screek/backend/internal/movies/store"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
)

func Test_integ_cache_aside_fluxo_real(t *testing.T) {
	db := testutil.SetupTestDB(t)
	require.NoError(t, movies.AutoMigrate(db))
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	store := moviestore.NewStore(db)
	tmdbMock := new(movies.MockTMDBService)
	uProv := new(movies.MockUserSearchProvider)
	lProv := new(movies.MockListSearchProvider)
	svc := movies.NewService(tmdbMock, store, uProv, lProv)

	tmdbID := 999
	tmdbDetails := &movietmdb.TMDBMovieDetails{
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

	var dbMovie movies.Movie
	err = db.Where("tmdb_id = ?", tmdbID).First(&dbMovie).Error
	require.NoError(t, err, "O filme deveria estar persistido no banco de dados")
}
