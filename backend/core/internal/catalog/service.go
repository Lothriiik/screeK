package catalog

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

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

	alreadyWatched := false
	existing, _ := s.repo.GetMovieLog(ctx, userID, movieID)
	if existing != nil && existing.Watched {
		alreadyWatched = true
	}

	if err := s.repo.UpsertMovieLog(ctx, log); err != nil {
		return err
	}

	if req.Watched && !alreadyWatched {
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

func (s *CatalogService) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistRichItem, error) {
	items, err := s.repo.GetWatchlist(ctx, userID)
	if err != nil {
		return nil, err
	}

	var richItems []WatchlistRichItem

	for _, item := range items {
		rich := WatchlistRichItem{
			MovieID: item.MovieID,
			AddedAt: item.AddedAt,
		}

		movie, err := s.movieProvider.GetMovieDetails(ctx, int(item.MovieID))
		if err == nil && movie != nil {
			rich.Title = movie.Title
			rich.PosterURL = movie.PosterURL
			rich.ReleaseYear = movie.ReleaseDate.Year()
		}
		richItems = append(richItems, rich)
	}
	return richItems, nil
}

func (s *CatalogService) CreateMovieList(ctx context.Context, userID uuid.UUID, req CreateMovieListRequest) (*MovieList, error) {
	list := &MovieList{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		IsPublic:    req.IsPublic,
	}

	if err := s.repo.CreateMovieList(ctx, list); err != nil {
		return nil, err
	}

	for _, movieID := range req.MovieIDs {
		err := s.repo.AddMovieToList(ctx, list.ID, movieID)
		if err != nil {
			return nil, ErrAddMovieToList
		}
	}
	return list, nil
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

func (s *CatalogService) GetMyMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieListSummary, error) {
	lists, err := s.repo.GetMovieLists(ctx, userID)
	if err != nil {
		return nil, err
	}

	var summaries []MovieListSummary
	for _, l := range lists {
		summaries = append(summaries, MovieListSummary{
			ID:          l.ID,
			Title:       l.Title,
			Description: l.Description,
			IsPublic:    l.IsPublic,
			ItemCount:   len(l.Items),
			CreatedAt:   l.CreatedAt,
		})
	}
	return summaries, nil
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

func (s *CatalogService) GetMovieDetail(ctx context.Context, tmdbID int) (*MovieDetailSummary, error) {
	movie, err := s.movieProvider.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}

	stats, _ := s.repo.GetMovieStats(ctx, uint(movie.ID))

	summaries := &MovieDetailSummary{
		ID:          movie.ID,
		TMDBID:      movie.TMDBID,
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		BackdropURL: movie.BackdropURL,
		ReleaseDate: movie.ReleaseDate,
		Runtime:     movie.Runtime,
	}

	if stats != nil {
		summaries.AverageRating = stats.AverageRating
		summaries.TotalReviews = stats.TotalReviews
		summaries.TotalLikes = stats.TotalLikes
	}

	return summaries, nil
}

func (s *CatalogService) GetMyHistory(ctx context.Context, userID uuid.UUID) ([]MovieLogSummary, error) {
	logs, err := s.repo.GetUserLogs(ctx, userID)
	if err != nil {
		return nil, err
	}

	var summaries []MovieLogSummary
	for _, log := range logs {
		movie, _ := s.movieProvider.GetMovieDetails(ctx, int(log.MovieID))

		var movieSummary MovieDetailSummary
		if movie != nil {
			movieSummary = MovieDetailSummary{
				ID:          movie.ID,
				TMDBID:      movie.TMDBID,
				Title:       movie.Title,
				Overview:    movie.Overview,
				PosterURL:   movie.PosterURL,
				BackdropURL: movie.BackdropURL,
				ReleaseDate: movie.ReleaseDate,
				Runtime:     movie.Runtime,
			}
		}

		summaries = append(summaries, MovieLogSummary{
			MovieID:   log.MovieID,
			Watched:   log.Watched,
			Rating:    log.Rating,
			Liked:     log.Liked,
			UpdatedAt: log.UpdatedAt,
			Movie:     movieSummary,
		})
	}
	return summaries, nil
}
