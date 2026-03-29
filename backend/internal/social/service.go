package social

import (
	"context"

	"github.com/google/uuid"
)

type UserProvider interface {
	GetIDByUsername(ctx context.Context, username string) (uuid.UUID, error)
}

type SocialService struct {
	store        SocialRepository
	userProvider UserProvider
}

func NewService(store SocialRepository, userProvider UserProvider) *SocialService {
	return &SocialService{
		store:        store,
		userProvider: userProvider,
	}
}

type Service interface {
	LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, req LogMovieRequest) error
	CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*PostResponseDTO, error)
	GetFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error)
	ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeUsername string) (bool, error)



}

func (s *SocialService) LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, req LogMovieRequest) error {
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

func (s *SocialService) CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*PostResponseDTO, error) {
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

func (s *SocialService) GetFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error) {

	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetFeed(ctx, cursorID, limit)
	if err != nil {
		return nil, err
	}

	var dtos []PostResponseDTO
	for _, p := range posts {
		dtos = append(dtos, PostResponseDTO{
			ID:           p.ID,
			Author:       p.User.Username, 
			PostType:     string(p.PostType),
			Content:      p.Content,
			LikesCount:   p.LikesCount,
			RepliesCount: p.RepliesCount,
			CreatedAt:    p.CreatedAt.Format("02/01/2006 15:04"),
		})
	}

	var nextCursor uint
	if len(posts) > 0 {
		nextCursor = posts[len(posts)-1].ID
	}

	return &FeedResponse{
		Posts:      dtos,
		NextCursor: nextCursor,
	}, nil
}

func (s *SocialService) ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return s.store.ReplyPost(ctx, userID, parentID, req.Content)
}

func (s *SocialService) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	return s.store.ToggleLike(ctx, userID, postID)
}

func (s *SocialService) ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeUsername string) (bool, error) {
	followeeID, err := s.userProvider.GetIDByUsername(ctx, followeeUsername)
	if err != nil {
		return false, err
	}
	return s.store.ToggleFollow(ctx, followerID, followeeID)
}



