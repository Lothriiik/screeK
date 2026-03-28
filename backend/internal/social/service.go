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
	// 1. Você usa o validate.Struct(req) aqui e retorna res.ValidationError...

	// 2. Você monta a struct do Gorm
	log := &MovieLog{
		UserID:  userID,
		MovieID: movieID,
		Watched: req.Watched,
		Rating:  req.Rating,
		Liked:   req.Liked,
	}
	// 3. Repassa o "ctx" lá pro Banco!
	return s.store.UpsertMovieLog(ctx, log)
}