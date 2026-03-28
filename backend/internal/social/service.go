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
	CreatePost(ctx context.Context, userID uint, req CreatePostRequest) (*PostResponseDTO, error)
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

func (s *SocialService) CreatePost(ctx context.Context, userID uint, req CreatePostRequest) (*PostResponseDTO, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	post := &Post{
		UserID:      userID,
		PostType:    PostType(req.PostType),
		Content:     req.Content,
		ReferenceID: req.ReferenceID,
	}

	if err := s.store.CreatePost(ctx, post); err != nil {
		return nil, err
	}

	dto := &PostResponseDTO{
		ID:           post.ID,
		PostType:     string(post.PostType),
		Content:      post.Content,
		LikesCount:   post.LikesCount,
		RepliesCount: post.RepliesCount,
		CreatedAt:    post.CreatedAt.Format("02/01/2006 15:04"),
	}

	return dto, nil
}
