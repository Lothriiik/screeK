package recommendation

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeMovieProvider struct {
	byID   map[int]*Movie
	byTMDB map[int]*Movie
}

func (f *fakeMovieProvider) GetByID(_ context.Context, id int) (*Movie, error) {
	if movie, ok := f.byID[id]; ok {
		return movie, nil
	}
	return nil, errors.New("não encontrado")
}

func (f *fakeMovieProvider) GetByTMDBID(_ context.Context, tmdbID int) (*Movie, error) {
	if movie, ok := f.byTMDB[tmdbID]; ok {
		return movie, nil
	}
	return nil, errors.New("não encontrado")
}

func TestServiceRecommendationsHydratesInternalIDs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/recommendations/user-1", r.URL.Path)
		assert.Equal(t, "5", r.URL.Query().Get("limit"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "user-1",
			"recommendations": [
				{"movie_id": 10, "tmdb_id": 550, "score": 0.9, "reason": "mesmo diretor"}
			],
			"algorithm": "test",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	provider := &fakeMovieProvider{byID: map[int]*Movie{
		10: {ID: 10, TMDBID: 550, Title: "Fight Club"},
	}}
	svc := NewService(NewClient(server.URL), provider)

	result, err := svc.Recommendations(context.Background(), "user-1", 5)

	require.NoError(t, err)
	require.Len(t, result.Recommendations, 1)
	item := result.Recommendations[0]
	assert.Equal(t, 10, item.MovieID)
	assert.Equal(t, 550, item.TMDBID)
	assert.Equal(t, "Fight Club", item.Movie.Title)
	assert.Equal(t, "internal", result.IDType)
}

func TestServiceRecommendationsFallsBackToTMDB(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "lothriik",
			"recommendations": [{"movie_id": 550, "score": 0.8}],
			"algorithm": "test",
			"id_type": "tmdb",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	provider := &fakeMovieProvider{byTMDB: map[int]*Movie{
		550: {ID: 99, TMDBID: 550, Title: "Fight Club"},
	}}
	svc := NewService(NewClient(server.URL), provider)

	result, err := svc.Recommendations(context.Background(), "lothriik", 20)

	require.NoError(t, err)
	require.Len(t, result.Recommendations, 1)
	assert.Equal(t, 550, result.Recommendations[0].MovieID)
	assert.Equal(t, 550, result.Recommendations[0].TMDBID)
	assert.Equal(t, 99, result.Recommendations[0].Movie.ID)
}

func TestServiceRecommendationsKeepsItemWhenHydrationFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "user-1",
			"recommendations": [{"movie_id": 4040, "tmdb_id": 1234, "score": 0.7}],
			"algorithm": "test",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	svc := NewService(NewClient(server.URL), &fakeMovieProvider{})

	result, err := svc.Recommendations(context.Background(), "user-1", 20)

	require.NoError(t, err)
	require.Len(t, result.Recommendations, 1)
	assert.Nil(t, result.Recommendations[0].Movie)
	assert.Equal(t, 4040, result.Recommendations[0].MovieID)
	assert.Equal(t, 1234, result.Recommendations[0].TMDBID)
}

func TestServiceSimilarHydratesReferenceAndItems(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/similar/10", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"movie_id": 10,
			"tmdb_id": 550,
			"similar_movies": [{"movie_id": 11, "tmdb_id": 551, "similarity_score": 0.95}],
			"algorithm": "test",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	provider := &fakeMovieProvider{byID: map[int]*Movie{
		10: {ID: 10, TMDBID: 550, Title: "Fight Club"},
		11: {ID: 11, TMDBID: 551, Title: "Se7en"},
	}}
	svc := NewService(NewClient(server.URL), provider)

	result, err := svc.Similar(context.Background(), 10, 20)

	require.NoError(t, err)
	require.NotNil(t, result.Movie)
	assert.Equal(t, "Fight Club", result.Movie.Title)
	require.Len(t, result.SimilarMovies, 1)
	assert.Equal(t, "Se7en", result.SimilarMovies[0].Movie.Title)
	assert.InDelta(t, 0.95, result.SimilarMovies[0].SimilarityScore, 0.0001)
}

func TestClientMapsHTTPErrors(t *testing.T) {
	tests := []struct {
		name        string
		status      int
		wantErr     error
		callSimilar bool
	}{
		{name: "motor não implementado", status: http.StatusNotImplemented, wantErr: ErrNotReady},
		{name: "usuário ausente", status: http.StatusNotFound, wantErr: ErrUserNotFound},
		{name: "filme ausente", status: http.StatusNotFound, wantErr: ErrMovieNotFound, callSimilar: true},
		{name: "falha genérica", status: http.StatusInternalServerError, wantErr: ErrUnavailable},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tt.status)
			}))
			defer server.Close()

			client := NewClient(server.URL)

			var err error
			if tt.callSimilar {
				_, err = client.Similar(context.Background(), 1, 20)
			} else {
				_, err = client.Recommendations(context.Background(), "user", 20)
			}

			require.Error(t, err)
			assert.True(t, errors.Is(err, tt.wantErr), "erro %v não é %v", err, tt.wantErr)
		})
	}
}

func TestClientHandlesUnavailableService(t *testing.T) {
	client := NewClient("http://127.0.0.1:1")

	_, err := client.Recommendations(context.Background(), "user", 20)

	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrUnavailable))
}

func TestServiceMovieGraphHydratesNodes(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/similar/10/graph", r.URL.Path)
		assert.Equal(t, "2", r.URL.Query().Get("depth"))
		assert.Equal(t, "4", r.URL.Query().Get("branching"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"root": 10,
			"id_type": "internal",
			"nodes": [
				{"movie_id": 10, "title": "Raw", "depth": 0, "score": 1.0},
				{"movie_id": 20, "title": "Titane", "depth": 1, "score": 0.85}
			],
			"edges": [
				{"source": 10, "target": 20, "score": 0.85, "reason": "Mesma direção de Julia Ducournau"}
			]
		}`))
	}))
	defer server.Close()

	provider := &fakeMovieProvider{byID: map[int]*Movie{
		10: {ID: 10, TMDBID: 100, Title: "Raw"},
		20: {ID: 20, TMDBID: 200, Title: "Titane"},
	}}
	svc := NewService(NewClient(server.URL), provider)

	graph, err := svc.MovieGraph(context.Background(), 10, GraphParams{Depth: 2, Branching: 4})
	require.NoError(t, err)
	assert.Equal(t, 10, graph.Root)
	require.Len(t, graph.Nodes, 2)
	require.NotNil(t, graph.Nodes[1].Movie)
	assert.Equal(t, 200, graph.Nodes[1].TMDBID)
	require.Len(t, graph.Edges, 1)
	assert.Contains(t, graph.Edges[0].Reason, "Julia Ducournau")
}
