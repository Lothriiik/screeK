package social

import (
	"context"
	"errors"
	"fmt"

	"github.com/StartLivin/screek/backend/internal/shared/events"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type UserProvider interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error)
	GetUserByUsername(ctx context.Context, username string) (*users.User, error)
}

// NotificationProvider removed in favor of EventBus

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
	GetPostDetail(ctx context.Context, postID uint) (*PostDetailResponseDTO, error)
	GetFollowers(ctx context.Context, userID uuid.UUID) ([]UserFollowResponseDTO, error)
	GetFollowing(ctx context.Context, userID uuid.UUID) ([]UserFollowResponseDTO, error)
}

type socialService struct {
	store           SocialRepository
	userProvider    UserProvider
	events          *events.EventBus
	sessionProvider SessionProvider
}

func NewService(store SocialRepository, userProvider UserProvider, eventBus *events.EventBus, sessionProvider SessionProvider) Service {
	return &socialService{
		store:           store,
		userProvider:    userProvider,
		events:          eventBus,
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

	return s.formatFeedResponse(ctx, posts, limit), nil
}

func (s *socialService) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetGlobalFeed(ctx, cursorID, limit)
	if err != nil {
		return nil, err
	}

	return s.formatFeedResponse(ctx, posts, limit), nil
}

func (s *socialService) formatFeedResponse(ctx context.Context, posts []Post, limit int) *FeedResponse {
	var dtos []PostResponseDTO
	for _, p := range posts {
		dtos = append(dtos, *s.mapToPostDTO(ctx, &p))
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

func (s *socialService) mapToPostDTO(ctx context.Context, p *Post) *PostResponseDTO {
	dto := &PostResponseDTO{
		ID:           p.ID,
		Author:       p.User.Username,
		PostType:     string(p.PostType),
		Content:      p.Content,
		IsSpoiler:    p.IsSpoiler,
		LikesCount:   p.LikesCount,
		RepliesCount: p.RepliesCount,
		CreatedAt:    p.CreatedAt.Format("02/01 15:04"),
	}

	if p.PostType == PostTypeSessionShare && p.ReferenceID != nil {
		sessionData, err := s.sessionProvider.GetSessionPostData(ctx, *p.ReferenceID)
		if err == nil {
			dto.SessionData = sessionData
		}
	}

	return dto
}

func (s *socialService) ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	err := s.store.ReplyPost(ctx, userID, parentID, req.Content)
	if err == nil {
		parent, _ := s.store.GetPostByID(ctx, parentID)
		if parent != nil && parent.UserID != userID {
			replier, _ := s.userProvider.GetUserByID(ctx, userID)
			if replier != nil {
				s.events.Publish(events.EventCommentAdded, events.Data{
					"user_id":     parent.UserID,
					"sender_id":   userID,
					"sender_name": replier.Username,
					"post_id":     parentID,
					"message":     fmt.Sprintf("%s respondeu ao seu post", replier.Username),
				})
			}
		}
	}
	return err
}

func (s *socialService) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	liked, err := s.store.ToggleLike(ctx, userID, postID)
	if err == nil && liked {
		post, err := s.store.GetPostByID(ctx, postID)
		if err == nil && post.UserID != userID {
			liker, _ := s.userProvider.GetUserByID(ctx, userID)
			if liker != nil {
				s.events.Publish(events.EventPostLiked, events.Data{
					"user_id":     post.UserID,
					"sender_id":   userID,
					"sender_name": liker.Username,
					"post_id":     postID,
					"message":     fmt.Sprintf("%s curtiu seu post!", liker.Username),
				})
			}
		}
	}
	return liked, err
}

func (s *socialService) ToggleFollow(ctx context.Context, followerID uuid.UUID, targetUsername string) (bool, error) {
	followee, err := s.userProvider.GetUserByUsername(ctx, targetUsername)
	if err != nil {
		return false, errors.New("usuário não encontrado")
	}

	isFollowing, err := s.store.ToggleFollow(ctx, followerID, followee.ID)
	if err == nil && isFollowing {
		follower, _ := s.userProvider.GetUserByID(ctx, followerID)
		if follower != nil {
			s.events.Publish(events.EventUserFollowed, events.Data{
				"user_id":     followee.ID,
				"sender_id":   followerID,
				"sender_name": follower.Username,
				"message":     fmt.Sprintf("%s começou a seguir você", follower.Username),
			})
		}
	}

	return isFollowing, err
}

func (s *socialService) GetPostDetail(ctx context.Context, postID uint) (*PostDetailResponseDTO, error) {
	post, replies, err := s.store.GetPostWithReplies(ctx, postID)
	if err != nil {
		return nil, errors.New("postagem não encontrada")
	}

	postDTO := s.mapToPostDTO(ctx, post)
	var repliesDTO []PostResponseDTO
	for _, r := range replies {
		repliesDTO = append(repliesDTO, *s.mapToPostDTO(ctx, &r))
	}

	return &PostDetailResponseDTO{
		Post:    *postDTO,
		Replies: repliesDTO,
	}, nil
}

func (s *socialService) GetFollowers(ctx context.Context, userID uuid.UUID) ([]UserFollowResponseDTO, error) {
	followers, err := s.store.GetFollowers(ctx, userID)
	if err != nil {
		return nil, err
	}

	var dtos []UserFollowResponseDTO
	for _, f := range followers {
		dtos = append(dtos, UserFollowResponseDTO{
			UserID:    f.ID.String(),
			Username:  f.Username,
			AvatarURL: f.AvatarURL,
		})
	}
	return dtos, nil
}

func (s *socialService) GetFollowing(ctx context.Context, userID uuid.UUID) ([]UserFollowResponseDTO, error) {
	following, err := s.store.GetFollowing(ctx, userID)
	if err != nil {
		return nil, err
	}

	var dtos []UserFollowResponseDTO
	for _, f := range following {
		dtos = append(dtos, UserFollowResponseDTO{
			UserID:    f.ID.String(),
			Username:  f.Username,
			AvatarURL: f.AvatarURL,
		})
	}
	return dtos, nil
}
