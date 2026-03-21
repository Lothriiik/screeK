package users

import (
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
	GetMovieByTMDBID(tmdbID int) (*movies.Movie, error)
}

type UserService struct {
	repo      UserRepository
	movieRepo MovieRepository
}

func NewService(repo UserRepository, movieRepo MovieRepository) *UserService {
	return &UserService{repo: repo, movieRepo: movieRepo}
}

func (s *UserService) CreateUser(user *User) error {
	hashedPassword, err := crypto.HashPassword(user.Password)
	if err != nil {
		return errors.New("erro ao processar senha")
	}
	user.Password = hashedPassword
	return s.repo.CreateUser(user)
}

func (s *UserService) GetUserByID(id int) (*User, error) {
	return s.repo.GetUserByID(id)
}

func (s *UserService) SearchUsers(query string) ([]User, error) {
	return s.repo.SearchUsers(query)
}

func (s *UserService) UpdateUser(user *User) error {
	return s.repo.UpdateUser(user)
}

func (s *UserService) DeleteUser(id int, password string) error {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return err
	}
	if !crypto.VerifyPassword(password, user.Password) {
		return ErrInvalidPassword
	}
	return s.repo.DeleteUser(id)
}

func (s *UserService) ChangePassword(id int, oldPassword string, newPasswordPlain string) error {
	user, err := s.repo.GetUserByID(id)
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
	return s.repo.UpdateUser(user)
}

func (s *UserService) AddFavorite(userID int, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.AddFavorite(userID, movie.ID)
}

func (s *UserService) RemoveFavorite(userID int, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.RemoveFavorite(userID, movie.ID)
}

func (s *UserService) GetUserByUsername(username string) (*User, error) {
	return s.repo.GetUserByUsername(username)
}

func (s *UserService) GetUserByEmail(email string) (*User, error) {
	return s.repo.GetUserByEmail(email)
}

func (s *UserService) EmailExists(email string) (bool, error) {
	return s.repo.EmailExists(email)
}

func (s *UserService) UsernameExists(username string) (bool, error) {
	return s.repo.UsernameExists(username)
}
