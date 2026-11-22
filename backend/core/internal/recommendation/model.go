package recommendation

import "time"

// Filters contém os filtros opcionais aceitos pelo serviço de recomendações.
type Filters struct {
	Genre         string
	MinYear       string
	MaxYear       string
	InTheaters    bool
	NowPlayingIDs []int
}

// Movie é o subconjunto de metadados necessário para exibir uma recomendação.
// O ID é sempre o canônico (`movies.id`); o TMDB ID fica para links externos.
type Movie struct {
	ID            int       `json:"id"`
	TMDBID        int       `json:"tmdb_id"`
	Title         string    `json:"title"`
	OriginalTitle string    `json:"original_title,omitempty"`
	Overview      string    `json:"overview,omitempty"`
	PosterURL     string    `json:"poster_url,omitempty"`
	BackdropURL   string    `json:"backdrop_url,omitempty"`
	ReleaseDate   time.Time `json:"release_date,omitempty"`
	Year          int       `json:"year,omitempty"`
	Runtime       int       `json:"runtime,omitempty"`
	VoteAverage   float64   `json:"vote_average,omitempty"`
	Genres        []string  `json:"genres,omitempty"`
}

// RecommendedMovie é uma recomendação já hidratada (quando o filme existe no
// catálogo local). Se a hidratação falhar, os IDs continuam disponíveis.
//
// `MovieID` é exatamente o ID devolvido pelo Python; a semântica está em
// `id_type` no resultado. `Movie.ID` é sempre o ID canônico interno.
type RecommendedMovie struct {
	MovieID        int     `json:"movie_id"`
	TMDBID         int     `json:"tmdb_id,omitempty"`
	Score          float64 `json:"score"`
	Reason         string  `json:"reason,omitempty"`
	Feedback       string  `json:"feedback,omitempty"`
	IsNicheBreaker bool    `json:"is_niche_breaker"`
	Movie          *Movie  `json:"movie,omitempty"`
}

// SimilarMovie é um filme similar já hidratado.
//
// `MovieID` segue a mesma regra de RecommendedMovie: é o ID devolvido pelo
// Python, interpretado conforme `id_type`.
type SimilarMovie struct {
	MovieID         int     `json:"movie_id"`
	TMDBID          int     `json:"tmdb_id,omitempty"`
	SimilarityScore float64 `json:"similarity_score"`
	Reason          string  `json:"reason,omitempty"`
	Movie           *Movie  `json:"movie,omitempty"`
}

// RecommendationsResult é a resposta do gateway para recomendações.
type RecommendationsResult struct {
	UserID          string             `json:"user_id"`
	Recommendations []RecommendedMovie `json:"recommendations"`
	Algorithm       string             `json:"algorithm"`
	IDType          string             `json:"id_type"`
	GeneratedAt     string             `json:"generated_at"`
}

// SimilarResult é a resposta do gateway para filmes similares.
type SimilarResult struct {
	MovieID       int            `json:"movie_id"`
	TMDBID        int            `json:"tmdb_id,omitempty"`
	Movie         *Movie         `json:"movie,omitempty"`
	SimilarMovies []SimilarMovie `json:"similar_movies"`
	Algorithm     string         `json:"algorithm"`
	IDType        string         `json:"id_type"`
	GeneratedAt   string         `json:"generated_at"`
}

// GraphParams contém os parâmetros opcionais para geração do subgrafo kNN.
type GraphParams struct {
	Depth     int
	Branching int
	MinScore  float64
}

// GraphNode representa um filme (vértice) no grafo semântico de recomendações.
type GraphNode struct {
	MovieID int     `json:"movie_id"`
	TMDBID  int     `json:"tmdb_id,omitempty"`
	Title   string  `json:"title"`
	Depth   int     `json:"depth"`
	Score   float64 `json:"score"`
	Movie   *Movie  `json:"movie,omitempty"`
}

// GraphEdge representa uma conexão explicada entre dois filmes no grafo.
type GraphEdge struct {
	Source int      `json:"source"`
	Target int      `json:"target"`
	Score  float64  `json:"score"`
	Reason string   `json:"reason"`
	Group  string   `json:"group,omitempty"`
	Terms  []string `json:"terms,omitempty"`
}

// MovieGraphResult é a resposta do gateway para o grafo semântico de um filme.
type MovieGraphResult struct {
	Root   int         `json:"root"`
	IDType string      `json:"id_type"`
	Nodes  []GraphNode `json:"nodes"`
	Edges  []GraphEdge `json:"edges"`
}
