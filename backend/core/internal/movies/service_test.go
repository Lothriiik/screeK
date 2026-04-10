package movies

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
)

func Test_deve_buscar_filmes_e_salvar_localmente(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	tmdb.On("SearchMovies", mock.Anything, "Batman", 0).Return([]movietmdb.TMDBMovie{
		{ID: 268, Title: "Batman", Overview: "Dark Knight", PosterPath: "/batman.jpg", ReleaseDate: "2008-07-18"},
		{ID: 155, Title: "The Dark Knight", Overview: "Rises", PosterPath: "/dk.jpg", ReleaseDate: "2012-07-20"},
	}, nil)

	repo.On("SaveMovie", mock.Anything, mock.AnythingOfType("*movies.Movie")).Return(nil)

	results, err := svc.SearchMovies(context.Background(), "Batman")

	require.NoError(t, err)
	assert.Len(t, results, 2)
	assert.Equal(t, "Batman", results[0].Title)
	assert.Equal(t, 268, results[0].TMDBID)
	assert.Contains(t, results[0].PosterURL, "image.tmdb.org")
	repo.AssertNumberOfCalls(t, "SaveMovie", 2)
}

func Test_deve_retornar_erro_quando_tmdb_falha_na_busca(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	tmdb.On("SearchMovies", mock.Anything, "xyz", 0).Return([]movietmdb.TMDBMovie{}, errors.New("TMDB offline"))

	results, err := svc.SearchMovies(context.Background(), "xyz")

	assert.Error(t, err)
	assert.Nil(t, results)
}

func Test_deve_retornar_filme_do_cache_local(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	cachedMovie := &Movie{
		ID:     1,
		TMDBID: 550,
		Title:  "Fight Club",
	}
	repo.On("GetMovieByTMDBID", mock.Anything, 550).Return(cachedMovie, nil)

	movie, err := svc.GetMovieDetails(context.Background(), 550)

	require.NoError(t, err)
	assert.Equal(t, "Fight Club", movie.Title)
	tmdb.AssertNotCalled(t, "GetMovieDetails")
}

func Test_deve_buscar_detalhes_do_tmdb_quando_nao_ha_cache(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	repo.On("GetMovieByTMDBID", mock.Anything, 550).Return(nil, errors.New("not found"))
	tmdb.On("GetMovieDetails", mock.Anything, 550).Return(&movietmdb.TMDBMovieDetails{
		ID:          550,
		Title:       "Fight Club",
		Overview:    "First rule...",
		PosterPath:  "/fc.jpg",
		ReleaseDate: "1999-10-15",
		Runtime:     139,
	}, nil)
	repo.On("SaveMovieDetails", mock.Anything, mock.AnythingOfType("*movies.TMDBMovieDetails")).Return(&Movie{
		ID:      1,
		TMDBID:  550,
		Title:   "Fight Club",
		Runtime: 139,
	}, nil)

	movie, err := svc.GetMovieDetails(context.Background(), 550)

	require.NoError(t, err)
	assert.Equal(t, "Fight Club", movie.Title)
	assert.Equal(t, 139, movie.Runtime)
	tmdb.AssertExpectations(t)
	repo.AssertExpectations(t)
}

func Test_deve_retornar_erro_quando_tmdb_falha_nos_detalhes(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	repo.On("GetMovieByTMDBID", mock.Anything, 999).Return(nil, errors.New("not found"))
	tmdb.On("GetMovieDetails", mock.Anything, 999).Return(nil, errors.New("TMDB 404"))

	movie, err := svc.GetMovieDetails(context.Background(), 999)

	assert.Error(t, err)
	assert.Nil(t, movie)
}

func Test_deve_retornar_pessoa_do_cache_local(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	repo.On("GetPersonByTMDBID", mock.Anything, 6193).Return(&Person{
		ID:     1,
		TMDBID: 6193,
		Name:   "Leonardo DiCaprio",
	}, nil)

	person, err := svc.GetPersonDetails(context.Background(), 6193)

	require.NoError(t, err)
	assert.Equal(t, "Leonardo DiCaprio", person.Name)
	tmdb.AssertNotCalled(t, "GetPersonDetails")
}

func Test_deve_buscar_recomendacoes_do_tmdb(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	tmdb.On("GetMoviesRecommendations", mock.Anything, 550).Return([]movietmdb.TMDBMovie{
		{ID: 680, Title: "Pulp Fiction"},
		{ID: 13, Title: "Forrest Gump"},
	}, nil)

	recs, err := svc.GetMovieRecommendations(context.Background(), 550)

	require.NoError(t, err)
	assert.Len(t, recs, 2)
	assert.Equal(t, "Pulp Fiction", recs[0].Title)
}

func Test_deve_buscar_creditos_de_pessoa(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	tmdb.On("GetPersonCredits", mock.Anything, 6193).Return(&movietmdb.TMDBPersonCredits{
		Cast: []movietmdb.TMDBPersonMovieCast{
			{ID: 550, Title: "Fight Club", Character: "Tyler Durden"},
			{ID: 27205, Title: "Inception", Character: "Cobb"},
		},
	}, nil)

	credits, err := svc.GetPersonCredits(context.Background(), 6193)

	require.NoError(t, err)
	assert.Len(t, credits, 2)
	assert.Equal(t, "Tyler Durden", credits[0].Character)
}

func Test_deve_parsear_data_de_lancamento_corretamente(t *testing.T) {
	tmdb := new(MockTMDBService)
	repo := new(MockMoviesRepo)
	uProv := new(MockUserSearchProvider)
	lProv := new(MockListSearchProvider)
	svc := NewService(tmdb, repo, uProv, lProv)

	tmdb.On("SearchMovies", mock.Anything, "Inception", 0).Return([]movietmdb.TMDBMovie{
		{ID: 27205, Title: "Inception", ReleaseDate: "2010-07-16", PosterPath: "/inc.jpg"},
	}, nil)
	repo.On("SaveMovie", mock.Anything, mock.AnythingOfType("*movies.Movie")).Return(nil)

	results, err := svc.SearchMovies(context.Background(), "Inception")

	require.NoError(t, err)
	expected, _ := time.Parse("2006-01-02", "2010-07-16")
	assert.Equal(t, expected, results[0].ReleaseDate)
}
