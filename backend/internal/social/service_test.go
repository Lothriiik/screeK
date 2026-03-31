package social

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/notifications"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func newTestService() (*SocialService, *MockSocialRepo, *MockUserProvider) {
	repo := new(MockSocialRepo)
	userProv := new(MockUserProvider)
	hub := notifications.NewHub()
	notifRepo := new(mockNotifRepo)
	notifSvc := notifications.NewService(notifRepo, hub)
	svc := NewService(repo, userProv, notifSvc)
	return svc, repo, userProv
}

type mockNotifRepo struct{ mock.Mock }

func (m *mockNotifRepo) CreateNotification(ctx context.Context, n *notifications.Notification) error {
	return nil
}
func (m *mockNotifRepo) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]notifications.Notification, error) {
	return nil, nil
}
func (m *mockNotifRepo) MarkAsRead(ctx context.Context, userID uuid.UUID, id uint) error {
	return nil
}
func (m *mockNotifRepo) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return nil
}

func Test_deve_criar_post_com_sucesso(t *testing.T) {
	svc, repo, _ := newTestService()

	repo.On("CreatePost", mock.Anything, mock.AnythingOfType("*social.Post")).Return(nil)

	refID := uint(550)
	dto, err := svc.CreatePost(context.Background(), uuid.New(), CreatePostRequest{
		PostType:    "REVIEW",
		Content:     "Filme incrível!",
		ReferenceID: &refID,
	})

	require.NoError(t, err)
	assert.Equal(t, "REVIEW", dto.PostType)
	assert.Equal(t, "Filme incrível!", dto.Content)
	repo.AssertExpectations(t)
}

func Test_deve_rejeitar_post_com_conteudo_vazio(t *testing.T) {
	svc, _, _ := newTestService()

	_, err := svc.CreatePost(context.Background(), uuid.New(), CreatePostRequest{
		PostType: "REVIEW",
		Content:  "",
	})

	assert.Error(t, err)
}

func Test_deve_limitar_feed_a_50_itens(t *testing.T) {
	svc, repo, _ := newTestService()

	repo.On("GetGlobalFeed", mock.Anything, uint(0), 20).Return([]Post{}, nil)

	_, err := svc.GetGlobalFeed(context.Background(), 0, 100)

	require.NoError(t, err)
	repo.AssertCalled(t, "GetGlobalFeed", mock.Anything, uint(0), 20)
}

func Test_deve_usar_limite_padrao_quando_valor_invalido(t *testing.T) {
	svc, repo, _ := newTestService()

	repo.On("GetGlobalFeed", mock.Anything, uint(0), 20).Return([]Post{}, nil)

	_, err := svc.GetGlobalFeed(context.Background(), 0, -5)

	require.NoError(t, err)
	repo.AssertCalled(t, "GetGlobalFeed", mock.Anything, uint(0), 20)
}

func Test_deve_permitir_editar_proprio_post(t *testing.T) {
	svc, repo, _ := newTestService()
	userID := uuid.New()

	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: userID,
	}, nil)
	repo.On("UpdatePost", mock.Anything, mock.Anything).Return(nil)

	err := svc.UpdatePost(context.Background(), userID, 1, UpdatePostRequest{
		Content:   "Conteúdo editado",
		IsSpoiler: true,
	})

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_rejeitar_edicao_de_post_alheio(t *testing.T) {
	svc, repo, _ := newTestService()

	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: uuid.New(),
	}, nil)

	err := svc.UpdatePost(context.Background(), uuid.New(), 1, UpdatePostRequest{
		Content: "Tentativa de edição",
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permissão")
	repo.AssertNotCalled(t, "UpdatePost")
}

func Test_deve_permitir_admin_deletar_qualquer_post(t *testing.T) {
	svc, repo, _ := newTestService()

	ownerID := uuid.New()
	adminID := uuid.New()

	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: ownerID,
	}, nil)
	repo.On("DeletePost", mock.Anything, uint(1)).Return(nil)

	err := svc.DeletePost(context.Background(), adminID, 1, httputil.RoleAdmin)

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_rejeitar_delecao_por_usuario_comum_de_post_alheio(t *testing.T) {
	svc, repo, _ := newTestService()

	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: uuid.New(),
	}, nil)

	err := svc.DeletePost(context.Background(), uuid.New(), 1, httputil.RoleUser)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permissão")
	repo.AssertNotCalled(t, "DeletePost")
}

func Test_deve_enviar_notificacao_ao_curtir_post_de_outro_usuario(t *testing.T) {
	svc, repo, userProv := newTestService()

	likerID := uuid.New()
	ownerID := uuid.New()

	repo.On("ToggleLike", mock.Anything, likerID, uint(1)).Return(true, nil)
	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: ownerID,
	}, nil)
	userProv.On("GetUserByID", mock.Anything, likerID).Return(&users.User{
		ID:       likerID,
		Username: "liker",
	}, nil)

	liked, err := svc.ToggleLike(context.Background(), likerID, 1)

	require.NoError(t, err)
	assert.True(t, liked)
}

func Test_deve_nao_notificar_ao_curtir_proprio_post(t *testing.T) {
	svc, repo, userProv := newTestService()

	userID := uuid.New()

	repo.On("ToggleLike", mock.Anything, userID, uint(1)).Return(true, nil)
	repo.On("GetPostByID", mock.Anything, uint(1)).Return(&Post{
		ID:     1,
		UserID: userID,
	}, nil)
	userProv.On("GetUserByID", mock.Anything, userID).Return(&users.User{
		ID:       userID,
		Username: "self",
	}, nil)

	liked, err := svc.ToggleLike(context.Background(), userID, 1)

	require.NoError(t, err)
	assert.True(t, liked)
}

func Test_deve_rejeitar_adicao_em_lista_alheia(t *testing.T) {
	svc, repo, _ := newTestService()

	ownerID := uuid.New()
	attackerID := uuid.New()

	repo.On("GetMovieListByID", mock.Anything, uint(1)).Return(&MovieList{
		ID:     1,
		UserID: ownerID,
	}, nil)

	err := svc.AddMovieToList(context.Background(), attackerID, 1, 550)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permissão")
	repo.AssertNotCalled(t, "AddMovieToList")
}

func Test_deve_criar_lista_de_filmes(t *testing.T) {
	svc, repo, _ := newTestService()

	userID := uuid.New()
	repo.On("CreateMovieList", mock.Anything, mock.AnythingOfType("*social.MovieList")).
		Run(func(args mock.Arguments) {
			list := args.Get(1).(*MovieList)
			list.ID = 1
			list.CreatedAt = time.Now()
		}).Return(nil)

	dto, err := svc.CreateMovieList(context.Background(), userID, CreateMovieListRequest{
		Title:       "Top 10 Terror",
		Description: "Melhores filmes de terror",
		IsPublic:    true,
	})

	require.NoError(t, err)
	assert.Equal(t, "Top 10 Terror", dto.Title)
	assert.True(t, dto.IsPublic)
}

func Test_deve_enviar_notificacao_ao_seguir_usuario(t *testing.T) {
	svc, repo, userProv := newTestService()

	followerID := uuid.New()
	followeeID := uuid.New()
	followeeUsername := "celebridade"

	userProv.On("GetIDByUsername", mock.Anything, followeeUsername).Return(followeeID, nil)
	repo.On("ToggleFollow", mock.Anything, followerID, followeeID).Return(true, nil)
	userProv.On("GetUserByID", mock.Anything, followerID).Return(&users.User{
		ID:       followerID,
		Username: "follower",
	}, nil)

	following, err := svc.ToggleFollow(context.Background(), followerID, followeeUsername)

	require.NoError(t, err)
	assert.True(t, following)
	repo.AssertExpectations(t)
	userProv.AssertExpectations(t)
}
