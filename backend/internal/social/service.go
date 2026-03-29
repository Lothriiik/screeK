package social

import (
	"context"
	"errors"
	"fmt"

	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type UserProvider interface {
	GetIDByUsername(ctx context.Context, username string) (uuid.UUID, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error)
}

type SocialService struct {
	store        SocialRepository
	userProvider UserProvider
	notification *notifications.NotificationService
}

func NewService(store SocialRepository, userProvider UserProvider, notification *notifications.NotificationService) *SocialService {
	return &SocialService{
		store:        store,
		userProvider: userProvider,
		notification: notification,
	}
}

type Service interface {
	LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, req LogMovieRequest) error
	CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*PostResponseDTO, error)
	GetFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) (*FeedResponse, error)
	GetGlobalFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error)
	ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error
	ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error)
	ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeUsername string) (bool, error)
	
	UpdatePost(ctx context.Context, userID uuid.UUID, postID uint, req UpdatePostRequest) error
	DeletePost(ctx context.Context, userID uuid.UUID, postID uint, role httputil.Role) error

	// Watchlist & MovieLists
	AddToWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error
	RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error
	GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error)

	CreateMovieList(ctx context.Context, userID uuid.UUID, req CreateMovieListRequest) (*MovieListResponseDTO, error)
	GetMyMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieListResponseDTO, error)
	GetMovieListDetail(ctx context.Context, listID uint) (*MovieList, error)
	AddMovieToList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error
	RemoveMovieFromList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error
	DeleteMovieList(ctx context.Context, userID uuid.UUID, listID uint) error
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
		IsSpoiler:   req.IsSpoiler,
		ReferenceID: req.ReferenceID,
	}

	if err := s.store.CreatePost(ctx, post); err != nil {
		return nil, err
	}

	dto := &PostResponseDTO{
		ID:           post.ID,
		PostType:     string(post.PostType),
		Content:      post.Content,
		IsSpoiler:    post.IsSpoiler,
		LikesCount:   post.LikesCount,
		RepliesCount: post.RepliesCount,
		CreatedAt:    post.CreatedAt.Format("02/01/2006 15:04"),
	}

	return dto, nil
}

func (s *SocialService) GetFeed(ctx context.Context, userID uuid.UUID, cursorID uint, limit int) (*FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetFollowingFeed(ctx, userID, cursorID, limit)
	if err != nil {
		return nil, err
	}

	return s.mapPostsToFeedResponse(posts), nil
}

func (s *SocialService) GetGlobalFeed(ctx context.Context, cursorID uint, limit int) (*FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	posts, err := s.store.GetGlobalFeed(ctx, cursorID, limit)
	if err != nil {
		return nil, err
	}

	return s.mapPostsToFeedResponse(posts), nil
}

func (s *SocialService) mapPostsToFeedResponse(posts []Post) *FeedResponse {
	var dtos []PostResponseDTO
	for _, p := range posts {
		dtos = append(dtos, PostResponseDTO{
			ID:           p.ID,
			Author:       p.User.Username, 
			PostType:     string(p.PostType),
			Content:      p.Content,
			IsSpoiler:    p.IsSpoiler,
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
	}
}

func (s *SocialService) ReplyToPost(ctx context.Context, userID uuid.UUID, parentID uint, req ReplyRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	user, _ := s.userProvider.GetUserByID(ctx, userID)
	parent, err := s.store.GetPostByID(ctx, parentID)
	if err == nil && parent.UserID != userID && user != nil {
		s.notification.Notify(ctx, parent.UserID, "REPLY", "Nova Resposta", fmt.Sprintf("%s respondeu ao seu post", user.Username), fmt.Sprintf("/posts/%d", parentID))
	}

	return s.store.ReplyPost(ctx, userID, parentID, req.Content)
}

func (s *SocialService) ToggleLike(ctx context.Context, userID uuid.UUID, postID uint) (bool, error) {
	liked, err := s.store.ToggleLike(ctx, userID, postID)
	if err == nil && liked {
		post, errP := s.store.GetPostByID(ctx, postID)
		user, _ := s.userProvider.GetUserByID(ctx, userID)
		if errP == nil && post.UserID != userID && user != nil {
			s.notification.Notify(ctx, post.UserID, "LIKE", "Novo Like", fmt.Sprintf("%s curtiu seu post", user.Username), fmt.Sprintf("/posts/%d", postID))
		}
	}
	return liked, err
}

func (s *SocialService) ToggleFollow(ctx context.Context, followerID uuid.UUID, followeeUsername string) (bool, error) {
	followeeID, err := s.userProvider.GetIDByUsername(ctx, followeeUsername)
	if err != nil {
		return false, err
	}
	
	following, errT := s.store.ToggleFollow(ctx, followerID, followeeID)
	if errT == nil && following {
		user, _ := s.userProvider.GetUserByID(ctx, followerID)
		if user != nil {
			s.notification.Notify(ctx, followeeID, "FOLLOW", "Novo Seguidor", fmt.Sprintf("%s agora segue você", user.Username), fmt.Sprintf("/users/%s", user.Username))
		}
	}

	return following, errT
}

func (s *SocialService) UpdatePost(ctx context.Context, userID uuid.UUID, postID uint, req UpdatePostRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	post, err := s.store.GetPostByID(ctx, postID)
	if err != nil {
		return errors.New("Post não encontrado")
	}

	if post.UserID != userID {
		return errors.New("Você não tem permissão para editar este post")
	}

	post.Content = req.Content
	post.IsSpoiler = req.IsSpoiler

	return s.store.UpdatePost(ctx, post)
}

func (s *SocialService) DeletePost(ctx context.Context, userID uuid.UUID, postID uint, role httputil.Role) error {
	post, err := s.store.GetPostByID(ctx, postID)
	if err != nil {
		return errors.New("Post não encontrado")
	}

	if post.UserID != userID && role != httputil.RoleAdmin {
		return errors.New("Você não tem permissão para deletar este post")
	}

	return s.store.DeletePost(ctx, postID)
}

func (s *SocialService) AddToWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	item := &WatchlistItem{UserID: userID, MovieID: movieID}
	return s.store.AddToWatchlist(ctx, item)
}

func (s *SocialService) RemoveFromWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return s.store.RemoveFromWatchlist(ctx, userID, movieID)
}

func (s *SocialService) GetWatchlist(ctx context.Context, userID uuid.UUID) ([]WatchlistItem, error) {
	return s.store.GetWatchlist(ctx, userID)
}

func (s *SocialService) CreateMovieList(ctx context.Context, userID uuid.UUID, req CreateMovieListRequest) (*MovieListResponseDTO, error) {
	list := &MovieList{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		IsPublic:    req.IsPublic,
	}

	if err := s.store.CreateMovieList(ctx, list); err != nil {
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

func (s *SocialService) GetMyMovieLists(ctx context.Context, userID uuid.UUID) ([]MovieListResponseDTO, error) {
	lists, err := s.store.GetMovieLists(ctx, userID)
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

func (s *SocialService) GetMovieListDetail(ctx context.Context, listID uint) (*MovieList, error) {
	return s.store.GetMovieListByID(ctx, listID)
}

func (s *SocialService) AddMovieToList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error {
	list, err := s.store.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para editar esta lista")
	}
	return s.store.AddMovieToList(ctx, listID, movieID)
}

func (s *SocialService) RemoveMovieFromList(ctx context.Context, userID uuid.UUID, listID uint, movieID uint) error {
	list, err := s.store.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para editar esta lista")
	}
	return s.store.RemoveMovieFromList(ctx, listID, movieID)
}

func (s *SocialService) DeleteMovieList(ctx context.Context, userID uuid.UUID, listID uint) error {
	list, err := s.store.GetMovieListByID(ctx, listID)
	if err != nil {
		return errors.New("Lista não encontrada")
	}
	if list.UserID != userID {
		return errors.New("Você não tem permissão para excluir esta lista")
	}
	return s.store.DeleteMovieList(ctx, listID)
}
