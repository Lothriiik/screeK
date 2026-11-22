package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/StartLivin/screek/backend/internal/recommendation"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var testUserID = uuid.MustParse("11111111-1111-1111-1111-111111111111")

func testRouter(pythonURL string, authenticated bool) *chi.Mux {
	svc := recommendation.NewService(recommendation.NewClient(pythonURL), nil)
	handler := NewHandler(svc)

	auth := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if authenticated {
				ctx := context.WithValue(r.Context(), httputil.UserIDKey, testUserID)
				r = r.WithContext(ctx)
			}
			next.ServeHTTP(w, r)
		})
	}

	router := chi.NewRouter()
	handler.RegisterRoutes(router, auth)
	return router
}

func TestGetMyRecommendationsUsesAuthenticatedUser(t *testing.T) {
	var gotPath string
	var gotLimit string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotLimit = r.URL.Query().Get("limit")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "` + testUserID.String() + `",
			"recommendations": [{"movie_id": 10, "score": 0.9}],
			"algorithm": "test",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	router := testRouter(server.URL, true)
	req := httptest.NewRequest(http.MethodGet, "/recommendations?limit=500", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	assert.Equal(t, "/recommendations/"+testUserID.String(), gotPath)
	assert.Equal(t, "100", gotLimit, "limit deve ser limitado a 100")

	var payload recommendation.RecommendationsResult
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&payload))
	require.Len(t, payload.Recommendations, 1)
	assert.Equal(t, 10, payload.Recommendations[0].MovieID)
}

func TestGetMyRecommendationsAliasUsesAuthenticatedUser(t *testing.T) {
	var gotPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "` + testUserID.String() + `",
			"recommendations": [],
			"algorithm": "test",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	router := testRouter(server.URL, true)
	req := httptest.NewRequest(http.MethodGet, "/users/me/recommendations", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	assert.Equal(t, "/recommendations/"+testUserID.String(), gotPath)
}

func TestGetMyRecommendationsRequiresAuth(t *testing.T) {
	router := testRouter("http://127.0.0.1:1", false)
	req := httptest.NewRequest(http.MethodGet, "/recommendations", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestRecommendationsMapsNotReady(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotImplemented)
	}))
	defer server.Close()

	router := testRouter(server.URL, true)
	req := httptest.NewRequest(http.MethodGet, "/recommendations", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotImplemented, rec.Code)
}

func TestSimilarRejectsInvalidID(t *testing.T) {
	router := testRouter("http://127.0.0.1:1", true)
	req := httptest.NewRequest(http.MethodGet, "/similar/abc", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestSimilarMapsMovieNotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	router := testRouter(server.URL, true)
	req := httptest.NewRequest(http.MethodGet, "/similar/999", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestRecommendationsForwardsInTheatersAndFilters(t *testing.T) {
	var gotInTheaters, gotNowPlaying, gotGenre string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotInTheaters = r.URL.Query().Get("in_theaters")
		gotNowPlaying = r.URL.Query().Get("now_playing_ids")
		gotGenre = r.URL.Query().Get("genre")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"user_id": "lothriik",
			"recommendations": [{"movie_id": 563, "score": 0.85, "reason": "Porque está em cartaz nos cinemas"}],
			"algorithm": "screek-content-engine",
			"id_type": "internal",
			"generated_at": "2026-01-01T00:00:00Z"
		}`))
	}))
	defer server.Close()

	router := testRouter(server.URL, true)
	req := httptest.NewRequest(http.MethodGet, "/recommendations/lothriik?in_theaters=true&now_playing_ids=563,807&genre=Terror", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "true", gotInTheaters)
	assert.Equal(t, "563,807", gotNowPlaying)
	assert.Equal(t, "Terror", gotGenre)
}

func TestGetMovieGraphEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/similar/10/graph", r.URL.Path)
		assert.Equal(t, "2", r.URL.Query().Get("depth"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"root": 10,
			"id_type": "internal",
			"nodes": [{"movie_id": 10, "title": "Raw", "depth": 0, "score": 1.0}],
			"edges": []
		}`))
	}))
	defer server.Close()

	router := testRouter(server.URL, false)
	req := httptest.NewRequest(http.MethodGet, "/similar/10/graph?depth=2", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	var payload recommendation.MovieGraphResult
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&payload))
	assert.Equal(t, 10, payload.Root)
	require.Len(t, payload.Nodes, 1)
}
