package recommendation

import (
	"context"
	"errors"
	"log/slog"

	"github.com/google/uuid"
)

// MovieProvider resolve metadados do catálogo local a partir do ID canônico
// (`movies.id`) ou do TMDB ID.
type MovieProvider interface {
	GetByID(ctx context.Context, id int) (*Movie, error)
	GetByTMDBID(ctx context.Context, tmdbID int) (*Movie, error)
}

// Service orquestra o client Python e a hidratação de metadados no Go.
type Service struct {
	client   *Client
	movies   MovieProvider
	feedback FeedbackRepository
}

// NewService cria o serviço. `movies` pode ser nil em testes ou quando a
// hidratação não for desejada (a resposta continua com os IDs).
func NewService(client *Client, movies MovieProvider, feedback ...FeedbackRepository) *Service {
	svc := &Service{client: client, movies: movies}
	if len(feedback) > 0 {
		svc.feedback = feedback[0]
	}
	return svc
}

func (s *Service) SaveFeedback(ctx context.Context, userID uuid.UUID, movieID int, value string) error {
	if s.feedback == nil {
		return errors.New("feedback indisponível")
	}
	return s.feedback.Save(ctx, userID, movieID, value)
}

func (s *Service) DeleteFeedback(ctx context.Context, userID uuid.UUID, movieID int) error {
	if s.feedback == nil {
		return errors.New("feedback indisponível")
	}
	return s.feedback.Delete(ctx, userID, movieID)
}

// Recommendations devolve as recomendações do usuário com metadados locais.
func (s *Service) Recommendations(ctx context.Context, userID string, limit int, filters ...Filters) (*RecommendationsResult, error) {
	result, err := s.client.Recommendations(ctx, userID, limit, filters...)
	if err != nil {
		return nil, err
	}

	for i := range result.Recommendations {
		item := &result.Recommendations[i]
		if movie := s.resolve(ctx, item.MovieID, item.TMDBID, result.IDType); movie != nil {
			item.Movie = movie
			item.TMDBID = movie.TMDBID
		} else if item.TMDBID == 0 && result.IDType == "tmdb" {
			item.TMDBID = item.MovieID
		}
	}

	return result, nil
}

// Similar devolve filmes similares com metadados locais.
func (s *Service) Similar(ctx context.Context, movieID int, limit int) (*SimilarResult, error) {
	result, err := s.client.Similar(ctx, movieID, limit)
	if err != nil {
		return nil, err
	}

	result.Movie = s.resolve(ctx, result.MovieID, result.TMDBID, result.IDType)
	if result.Movie != nil {
		result.TMDBID = result.Movie.TMDBID
	}

	for i := range result.SimilarMovies {
		item := &result.SimilarMovies[i]
		if movie := s.resolve(ctx, item.MovieID, item.TMDBID, result.IDType); movie != nil {
			item.Movie = movie
			item.TMDBID = movie.TMDBID
		} else if item.TMDBID == 0 && result.IDType == "tmdb" {
			item.TMDBID = item.MovieID
		}
	}

	return result, nil
}

// MovieGraph devolve o subgrafo kNN de conexões de um filme com metadados locais hidratados.
func (s *Service) MovieGraph(ctx context.Context, movieID int, params GraphParams) (*MovieGraphResult, error) {
	result, err := s.client.MovieGraph(ctx, movieID, params)
	if err != nil {
		return nil, err
	}

	for i := range result.Nodes {
		node := &result.Nodes[i]
		if movie := s.resolve(ctx, node.MovieID, node.TMDBID, result.IDType); movie != nil {
			node.Movie = movie
			node.TMDBID = movie.TMDBID
			if movie.Title != "" {
				node.Title = movie.Title
			}
		} else if node.TMDBID == 0 && result.IDType == "tmdb" {
			node.TMDBID = node.MovieID
		}
	}

	return result, nil
}

func (s *Service) resolve(ctx context.Context, id int, tmdbID int, idType string) *Movie {
	if s.movies == nil {
		return nil
	}

	var (
		movie *Movie
		err   error
	)
	if idType == "tmdb" {
		candidate := id
		if candidate == 0 {
			candidate = tmdbID
		}
		if candidate == 0 {
			return nil
		}
		movie, err = s.movies.GetByTMDBID(ctx, candidate)
	} else {
		if id == 0 {
			return nil
		}
		movie, err = s.movies.GetByID(ctx, id)
	}

	if err != nil {
		slog.Debug("Falha ao hidratar filme recomendado", "id", id, "tmdb_id", tmdbID, "id_type", idType, "err", err)
		return nil
	}
	return movie
}
