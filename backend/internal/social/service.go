package social

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type UserProvider interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error)
	GetUserByUsername(ctx context.Context, username string) (*users.User, error)
}

type NotificationProvider interface {
	Notify(ctx context.Context, userID uuid.UUID, nType, title, message, link string) error
}

type SessionProvider interface {
	GetSessionPostData(ctx context.Context, sessionID uint) (*PostSessionData, error)
}

type Service interface {
	CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*PostResponseDTO, error)
	UpdatePost(ctx context.Context, userID uuid.UUID, postID uint, req UpdatePostRequest) error
	DeletePost(ctx context.Context, userID uuid.UUID, postID uint, role httputil.Role) error
	GetFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) (*FeedResponse, error)
	GetGlobalFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error)
	ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, targetUsername string) (bool, error)
}

type socialService struct {
	store         SocialRepository
	userProvider  UserProvider
	notifications NotificationProvider
	sessionProvider SessionProvider
}

func NewService(store SocialRepository, userProvider UserProvider, notifications NotificationProvider, sessionProvider SessionProvider) Service {
	return &socialService{
		store:         store,
		userProvider:  userProvider,
		notifications: notifications,
		sessionProvider: sessionProvider,
	}
}

func (s *socialService) CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*PostResponseDTO, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	post := &Post{
		UserID:      userID,
		PostType:    PostType(req.PostType),
		Content:     req.Content,
		IsSpoiler:   req.IsSpoiler,
		ReferenceID: req.ReferenceID,
	}

	if err := s.store.CreatePost(ctx, post); err != nil {
		return nil, err
	}

	user, _ := s.userProvider.GetUserByID(ctx, userID)
	username := "Usuário Desconhecido"
	if user != nil {
		username = user.Username
	}
	
	return &PostResponseDTO{
		ID:           post.ID,
		Author:       username,
		PostType:     string(post.PostType),
		Content:      post.Content,
		IsSpoiler:    post.IsSpoiler,
		LikesCount:   0,
		RepliesCount: 0,
		CreatedAt:    "agora", 
	}, nil
}

func (s *socialService) UpdatePost(ctx context.Context, userID uuid.UUID, postID uint, req UpdatePostRequest) error {
	post, err := s.store.GetPostByID(ctx, postID)
	if err != nil {
		return errors.New("post não encontrado")
	}

	if post.UserID != userID {
		return errors.New("você só pode editar seus próprios posts")
	}

	post.Content = req.Content
	post.IsSpoiler = req.IsSpoiler

	return s.store.UpdatePost(ctx, post)
}

func (s *socialService) DeletePost(ctx context.Context, userID uuid.UUID, postID uint, role httputil.Role) error {
	post, err := s.store.GetPostByID(ctx, postID)
	if err != nil {
		return errors.New("post não encontrado")
	}

	isAdmin := role == httputil.RoleAdmin
	if post.UserID != userID && !isAdmin {
		return errors.New("sem permissão para apagar este post")
	}

	return s.store.DeletePost(ctx, postID)
}

func (s *socialService) GetFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) (*FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetFollowingFeed(ctx, userID, cursorID, limit)
	if err != nil {
		return nil, err
	}

	return s.formatFeedResponse(posts, limit), nil
}

func (s *socialService) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetGlobalFeed(ctx, cursorID, limit)
	if err != nil {
		return nil, err
	}

	return s.formatFeedResponse(posts, limit), nil
}

func (s *socialService) formatFeedResponse(posts []Post, limit int) *FeedResponse {
	var dtos []PostResponseDTO
	for _, p := range posts {
		dto := PostResponseDTO{
			ID:           p.ID,
			Author:       p.User.Username,
			PostType:     string(p.PostType),
			Content:      p.Content,
			IsSpoiler:    p.IsSpoiler,
			LikesCount:   p.LikesCount,
			RepliesCount: p.RepliesCount,
			CreatedAt:    p.CreatedAt.Format("02/01 15:04"),
		}

		// Enriquecimento de post de sessão
		if p.PostType == PostTypeSessionShare && p.ReferenceID != nil && s.sessionProvider != nil {
			sessionData, err := s.sessionProvider.GetSessionPostData(context.Background(), *p.ReferenceID)
			if err == nil {
				dto.SessionData = sessionData
			}
		}

		dtos = append(dtos, dto)
	}

	var nextCursor uint
	if len(posts) == limit {
		nextCursor = posts[len(posts)-1].ID
	}

	return &FeedResponse{
		Posts:      dtos,
		NextCursor: nextCursor,
	}
}

func (s *socialService) ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return s.store.ReplyPost(ctx, userID, parentID, req.Content)
}

func (s *socialService) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	return s.store.ToggleLike(ctx, userID, postID)
}

func (s *socialService) ToggleFollow(ctx context.Context, followerID uuid.UUID, targetUsername string) (bool, error) {
	targetUser, err := s.userProvider.GetUserByUsername(ctx, targetUsername)
	if err != nil {
		return false, errors.New("usuário alvo não encontrado")
	}

	isFollowing, err := s.store.ToggleFollow(ctx, followerID, targetUser.ID)
	if err == nil && isFollowing {
		follower, _ := s.userProvider.GetUserByID(ctx, followerID)
		if follower != nil {
			s.notifications.Notify(ctx, targetUser.ID, "FOLLOW", "Novo Seguidor", follower.Username+" começou a seguir você!", "/profile/"+follower.Username)
		}
	}

	return isFollowing, err
}
