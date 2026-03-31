package users

import (
	"context"
	"errors"
	"testing"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func Test_deve_criar_usuario_com_senha_hasheada(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	repo.On("EmailExists", mock.Anything, "john@test.com").Return(false, nil)
	repo.On("UsernameExists", mock.Anything, "john").Return(false, nil)
	repo.On("CreateUser", mock.Anything, mock.AnythingOfType("*users.User")).Return(nil)

	user := &User{
		Username: "john",
		Email:    "john@test.com",
		Password: "senha123",
	}

	err := svc.CreateUser(context.Background(), user)

	require.NoError(t, err)
	assert.NotEqual(t, "senha123", user.Password)
	assert.True(t, crypto.VerifyPassword("senha123", user.Password))
	repo.AssertExpectations(t)
}

func Test_deve_retornar_erro_quando_usuario_nao_existe(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	repo.On("GetUserByID", mock.Anything, mock.AnythingOfType("uuid.UUID")).Return(nil, errors.New("not found"))

	_, err := svc.GetUserByID(context.Background(), uuid.New())

	assert.Error(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_deletar_usuario_com_senha_correta(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	userID := uuid.New()
	hash, _ := crypto.HashPassword("senha_certa")

	repo.On("GetUserByID", mock.Anything, userID).Return(&User{
		ID:       userID,
		Password: hash,
	}, nil)
	repo.On("DeleteUser", mock.Anything, userID).Return(nil)

	err := svc.DeleteUser(context.Background(), userID, "senha_certa")

	require.NoError(t, err)
	repo.AssertExpectations(t)
}

func Test_deve_rejeitar_delecao_com_senha_errada(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	userID := uuid.New()
	hash, _ := crypto.HashPassword("senha_certa")

	repo.On("GetUserByID", mock.Anything, userID).Return(&User{
		ID:       userID,
		Password: hash,
	}, nil)

	err := svc.DeleteUser(context.Background(), userID, "senha_errada")

	assert.ErrorIs(t, err, ErrInvalidPassword)
	repo.AssertNotCalled(t, "DeleteUser")
}

func Test_deve_adicionar_favorito_quando_filme_existe(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	userID := uuid.New()
	movieRepo.On("GetMovieByTMDBID", mock.Anything, 550).Return(&movies.Movie{ID: 1, TMDBID: 550}, nil)
	repo.On("AddFavorite", mock.Anything, userID, 1).Return(nil)

	err := svc.AddFavorite(context.Background(), userID, 550)

	require.NoError(t, err)
	repo.AssertExpectations(t)
	movieRepo.AssertExpectations(t)
}

func Test_deve_rejeitar_favorito_quando_filme_nao_existe(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	movieRepo.On("GetMovieByTMDBID", mock.Anything, 999).Return(nil, errors.New("not found"))

	err := svc.AddFavorite(context.Background(), uuid.New(), 999)

	assert.ErrorIs(t, err, ErrMovieNotFound)
	repo.AssertNotCalled(t, "AddFavorite")
}

func Test_deve_buscar_usuario_por_username(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	expected := &User{Username: "screekuser", Email: "s@test.com"}
	repo.On("GetUserByUsername", mock.Anything, "screekuser").Return(expected, nil)

	user, err := svc.GetUserByUsername(context.Background(), "screekuser")

	require.NoError(t, err)
	assert.Equal(t, "screekuser", user.Username)
}

func Test_deve_retornar_id_por_username(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	expectedID := uuid.New()
	repo.On("GetUserByUsername", mock.Anything, "john").Return(&User{ID: expectedID}, nil)

	id, err := svc.GetIDByUsername(context.Background(), "john")

	require.NoError(t, err)
	assert.Equal(t, expectedID, id)
}

func Test_deve_retornar_erro_ao_buscar_id_de_username_inexistente(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	repo.On("GetUserByUsername", mock.Anything, "fantasma").Return(nil, errors.New("not found"))

	id, err := svc.GetIDByUsername(context.Background(), "fantasma")

	assert.Error(t, err)
	assert.Equal(t, uuid.Nil, id)
}
func Test_deve_rejeitar_usuario_com_email_duplicado(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	repo.On("EmailExists", mock.Anything, "duplo@test.com").Return(true, nil)

	err := svc.CreateUser(context.Background(), &User{
		Email: "duplo@test.com",
		Username: "duplo",
	})

	assert.ErrorIs(t, err, ErrUserAlreadyExists)
	repo.AssertNotCalled(t, "CreateUser")
}

func Test_User_Registration_Collision(t *testing.T) {
	repo := new(MockUserRepo)
	movieRepo := new(MockMovieRepo)
	svc := NewService(repo, movieRepo)

	repo.On("EmailExists", mock.Anything, "collision@test.com").Return(false, nil)
	repo.On("UsernameExists", mock.Anything, "collison").Return(false, nil)
	
	repo.On("CreateUser", mock.Anything, mock.Anything).Return(errors.New("duplicate key value violates unique constraint"))

	err := svc.CreateUser(context.Background(), &User{
		Email:    "collision@test.com",
		Username: "collison",
		Password: "password",
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "duplicate key")
}
