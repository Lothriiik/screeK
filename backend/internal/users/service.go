package users

import (
	"context"
	"errors"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	"github.com/StartLivin/cine-pass/backend/internal/platform/crypto"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidPassword    = errors.New("senha incorreta")
	ErrOldPasswordInvalid = errors.New("senha antiga incorreta")
	ErrMovieNotFound      = errors.New("filme não encontrado na base local")
)

type MovieRepository interface {
	GetMovieByTMDBID(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type UserService struct {
	repo      UserRepository
	movieRepo MovieRepository
}

func NewService(repo UserRepository, movieRepo MovieRepository) *UserService {
	return &UserService{repo: repo, movieRepo: movieRepo}
}

func (s *UserService) CreateUser(ctx context.Context, user *User) error {
	hashedPassword, err := crypto.HashPassword(user.Password)
	if err != nil {
		return errors.New("erro ao processar senha")
	}
	user.Password = hashedPassword
	return s.repo.CreateUser(ctx, user)
}

func (s *UserService) GetUserByID(ctx context.Context, id int) (*User, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *UserService) SearchUsers(ctx context.Context, query string) ([]User, error) {
	return s.repo.SearchUsers(ctx, query)
}

func (s *UserService) UpdateUser(ctx context.Context, user *User) error {
	return s.repo.UpdateUser(ctx, user)
}

func (s *UserService) DeleteUser(ctx context.Context, id int, password string) error {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return err
	}
	if !crypto.VerifyPassword(password, user.Password) {
		return ErrInvalidPassword
	}
	return s.repo.DeleteUser(ctx, id)
}

func (s *UserService) ChangePassword(ctx context.Context, id int, oldPassword string, newPasswordPlain string) error {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return err
	}
	if !crypto.VerifyPassword(oldPassword, user.Password) {
		return ErrOldPasswordInvalid
	}
	hashedPassword, err := crypto.HashPassword(newPasswordPlain)
	if err != nil {
		return errors.New("erro ao processar nova senha")
	}
	user.Password = hashedPassword
	return s.repo.UpdateUser(ctx, user)
}

func (s *UserService) AddFavorite(ctx context.Context, userID int, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(ctx, tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.AddFavorite(ctx, userID, movie.ID)
}

func (s *UserService) RemoveFavorite(ctx context.Context, userID int, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(ctx, tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.RemoveFavorite(ctx, userID, movie.ID)
}

func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	return s.repo.GetUserByUsername(ctx, username)
}

func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.repo.GetUserByEmail(ctx, email)
}

func (s *UserService) EmailExists(ctx context.Context, email string) (bool, error) {
	return s.repo.EmailExists(ctx, email)
}

func (s *UserService) UsernameExists(ctx context.Context, username string) (bool, error) {
	return s.repo.UsernameExists(ctx, username)
}
