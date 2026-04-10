package notifications

import (
	"context"
	"testing"

	"github.com/StartLivin/screek/backend/internal/cinema/domain"
	"github.com/StartLivin/screek/backend/internal/notifications/realtime"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type MockNotificationRepo struct {
	mock.Mock
}


func (m *MockNotificationRepo) CreateNotification(ctx context.Context, n *Notification) error {
	args := m.Called(ctx, n)
	return args.Error(0)
}

func (m *MockNotificationRepo) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]Notification, error) {
	args := m.Called(ctx, userID, limit)
	return args.Get(0).([]Notification), args.Error(1)
}

func (m *MockNotificationRepo) MarkAsRead(ctx context.Context, userID uuid.UUID, id uint) error {
	args := m.Called(ctx, userID, id)
	return args.Error(0)
}

func (m *MockNotificationRepo) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func Test_deve_criar_notificacao_e_enviar_via_hub(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	go hub.Run()
	svc := NewService(repo, hub)

	repo.On("CreateNotification", mock.Anything, mock.AnythingOfType("*notifications.Notification")).Return(nil)

	err := svc.Notify(context.Background(), uuid.New(), "LIKE", "Novo Like", "Alguém curtiu", "/posts/1")

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_buscar_notificacoes_do_usuario(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	svc := NewService(repo, hub)

	userID := uuid.New()
	expected := []Notification{
		{ID: 1, UserID: userID, Title: "Teste"},
		{ID: 2, UserID: userID, Title: "Teste 2"},
	}
	repo.On("GetUserNotifications", mock.Anything, userID, 20).Return(expected, nil)

	result, err := svc.GetUserNotifications(context.Background(), userID)

	require.NoError(t, err)
	assert.Len(t, result, 2)
}

func Test_deve_marcar_notificacao_como_lida(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	svc := NewService(repo, hub)

	userID := uuid.New()
	repo.On("MarkAsRead", mock.Anything, userID, uint(1)).Return(nil)

	err := svc.MarkAsRead(context.Background(), userID, 1)

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_marcar_todas_como_lidas(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	svc := NewService(repo, hub)

	userID := uuid.New()
	repo.On("MarkAllAsRead", mock.Anything, userID).Return(nil)

	err := svc.MarkAllAsRead(context.Background(), userID)

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_processar_watchlist_matches_de_premiere(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	go hub.Run()
	svc := NewService(repo, hub)

	repo.On("CreateNotification", mock.Anything, mock.MatchedBy(func(n *Notification) bool {
		return n.Type == "WATCHLIST_MATCH" && n.Title == "Estreia Confirmada!"
	})).Return(nil)

	err := svc.ProcessWatchlistMatches(context.Background(), []domain.WatchlistMatch{
		{
			UserID:     uuid.New(),
			MovieID:    1,
			MovieTitle: "Batman",
			City:       "São Paulo",
			Type:       "PREMIERE",
		},
	})

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_processar_watchlist_matches_de_rescreening(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	go hub.Run()
	svc := NewService(repo, hub)

	repo.On("CreateNotification", mock.Anything, mock.MatchedBy(func(n *Notification) bool {
		return n.Title == "Filme em Reexibição!"
	})).Return(nil)

	err := svc.ProcessWatchlistMatches(context.Background(), []domain.WatchlistMatch{
		{
			UserID:     uuid.New(),
			MovieID:    2,
			MovieTitle: "Inception",
			City:       "Rio de Janeiro",
			Type:       "RESCREENING",
		},
	})

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_ignorar_lista_vazia_de_matches(t *testing.T) {
	repo := new(MockNotificationRepo)
	hub := realtime.NewHub()
	svc := NewService(repo, hub)

	err := svc.ProcessWatchlistMatches(context.Background(), []domain.WatchlistMatch{})

	require.NoError(t, err)
	repo.AssertNotCalled(t, "CreateNotification")
}
