package movies

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_TMDBClient_SearchMovies(t *testing.T) {
	
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer valid_token", r.Header.Get("Authorization"))
		assert.Equal(t, "/search/movie", r.URL.Path)
		assert.Equal(t, "Matrix", r.URL.Query().Get("query"))

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"results": [{"id": 1, "title": "The Matrix"}]}`)
	}))
	defer server.Close()

	client := &TMDBClient{
		token:      "valid_token",
		httpClient: server.Client(), 
		BaseURL:    server.URL,
	}

	movies, err := client.SearchMovies(context.Background(), "Matrix")
	assert.NoError(t, err)
	assert.Len(t, movies, 1)
	assert.Equal(t, "The Matrix", movies[0].Title)
}

func Test_TMDBClient_GetMovieDetails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"id": 1, "title": "Inception", "runtime": 148}`)
	}))
	defer server.Close()

	client := &TMDBClient{
		token:      "token",
		httpClient: server.Client(),
		BaseURL:    server.URL,
	}

	details, err := client.GetMovieDetails(context.Background(), 1)
	assert.NoError(t, err)
	assert.Equal(t, "Inception", details.Title)
	assert.Equal(t, 148, details.Runtime)
}
