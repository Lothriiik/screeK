package catalog

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type UserProvider interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error)
	IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error
}

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type CatalogRepository interface {
	UpsertMovieLog(ctx context.Context, log *MovieLog) error
	AddToWatchlist(ctx context.Context, item *WatchlistItem) error
	RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error
	GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error)
	
	CreateMovieList(ctx context.Context, list *MovieList) error
	UpdateMovieList(ctx context.Context, list *MovieList) error
	GetMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieList, error)
	GetMovieListByID(ctx context.Context, listID uint) (*MovieList, error)
	AddMovieToList(ctx context.Context, listID uint, movieID uint) error
	RemoveMovieFromList(ctx context.Context, listID uint, movieID uint) error
	DeleteMovieList(ctx context.Context, listID uint) error
	SearchLists(ctx context.Context, query string) ([]MovieList, error)
}

type CatalogService struct {
	repo          CatalogRepository
	userProvider  UserProvider
	movieProvider MovieProvider
}

func NewService(repo CatalogRepository, userProvider UserProvider, movieProvider MovieProvider) *CatalogService {
	return &CatalogService{
		repo:          repo,
		userProvider:  userProvider,
		movieProvider: movieProvider,
	}
}

func (s *CatalogService) LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, req LogMovieRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	log := &MovieLog{
		UserID:  userID,
		MovieID: movieID,
		Watched: req.Watched,
		Rating:  req.Rating,
		Liked:   req.Liked,
	}
	
	if err := s.repo.UpsertMovieLog(ctx, log); err != nil {
		return err
	}

	if req.Watched {
		movie, err := s.movieProvider.GetMovieDetails(ctx, int(movieID))
		runtime := 0
		if err == nil && movie != nil {
			runtime = movie.Runtime
		}
		
		_ = s.userProvider.IncrementStats(ctx, userID, 1, runtime)
	}

	return nil
}

func (s *CatalogService) AddToWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	item := &WatchlistItem{UserID: userID, MovieID: movieID}
	return s.repo.AddToWatchlist(ctx, item)
}

func (s *CatalogService) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.repo.RemoveFromWatchlist(ctx, userID, movieID)
}

func (s *CatalogService) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	return s.repo.GetWatchlist(ctx, userID)
}

func (s *CatalogService) CreateMovieList(ctx context.Context, userID uuid.UUID, req CreateMovieListRequest) (*MovieListResponseDTO, error) {
	list := &MovieList{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		IsPublic:    req.IsPublic,
	}

	if err := s.repo.CreateMovieList(ctx, list); err != nil {
		return nil, err
	}

	return &MovieListResponseDTO{
		ID:          list.ID,
		Title:       list.Title,
		Description: list.Description,
		IsPublic:    list.IsPublic,
		CreatedAt:   list.CreatedAt.Format("02/01/2006"),
	}, nil
}

func (s *CatalogService) UpdateMovieList(ctx context.Context, userID uuid.UUID, listID uint, req CreateMovieListRequest) error {
	list, err := s.repo.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}

	if list.UserID != userID {
		return errors.New("Você não tem permissão para editar esta lista")
	}

	list.Title = req.Title
	list.Description = req.Description
	list.IsPublic = req.IsPublic

	return s.repo.UpdateMovieList(ctx, list)
}

func (s *CatalogService) GetMyMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieListResponseDTO, error) {
	lists, err := s.repo.GetMovieLists(ctx, userID)
	if err != nil {
		return nil, err
	}

	var dtos []MovieListResponseDTO
	for _, l := range lists {
		dtos = append(dtos, MovieListResponseDTO{
			ID:          l.ID,
			Title:       l.Title,
			Description: l.Description,
			IsPublic:    l.IsPublic,
			ItemCount:   len(l.Items),
			CreatedAt:   l.CreatedAt.Format("02/01/2006"),
		})
	}
	return dtos, nil
}

func (s *CatalogService) GetMovieListDetail(ctx context.Context, listID uint, requesterID uuid.UUID) (*MovieList, error) {
	list, err := s.repo.GetMovieListByID(ctx, listID)
	if err != nil {
		return nil, err
	}

	if !list.IsPublic && list.UserID != requesterID {
		return nil, errors.New("Esta lista é privada")
	}

	return list, nil
}

func (s *CatalogService) AddMovieToList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error {
	list, err := s.repo.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para editar esta lista")
	}
	return s.repo.AddMovieToList(ctx, listID, movieID)
}

func (s *CatalogService) RemoveMovieFromList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error {
	list, err := s.repo.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para editar esta lista")
	}
	return s.repo.RemoveMovieFromList(ctx, listID, movieID)
}

func (s *CatalogService) DeleteMovieList(ctx context.Context, userID uuid.UUID, listID uint) error {
	list, err := s.repo.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para excluir esta lista")
	}
	return s.repo.DeleteMovieList(ctx, listID)
}

func (s *CatalogService) SearchLists(ctx context.Context, query string) ([]MovieList, error) {
	return s.repo.SearchLists(ctx, query)
}
