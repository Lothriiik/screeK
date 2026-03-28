package social

import "context"

type SocialService struct {
	store SocialRepository
}

func NewService(store SocialRepository) *SocialService {
	return &SocialService{
		store: store,
	}
}

type Service interface {
	LogMovie(ctx context.Context, userID uint, movieID uint, req LogMovieRequest) error
}

func (s *SocialService) LogMovie(ctx context.Context, userID uint, movieID uint, req LogMovieRequest) error {
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
	
	return s.store.UpsertMovieLog(ctx, log)
}