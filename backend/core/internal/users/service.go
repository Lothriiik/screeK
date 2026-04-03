package users

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/google/uuid"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("usuário com este e-mail ou username já existe")
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
	exists, _ := s.repo.EmailExists(ctx, user.Email)
	if exists {
		return ErrUserAlreadyExists
	}
	existsU, _ := s.repo.UsernameExists(ctx, user.Username)
	if existsU {
		return ErrUserAlreadyExists
	}

	hashedPassword, err := crypto.HashPassword(user.Password)
	if err != nil {
		return errors.New("erro ao processar senha")
	}
	user.Password = hashedPassword
	return s.repo.CreateUser(ctx, user)
}


func (s *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *UserService) SearchUsers(ctx context.Context, query string) ([]User, error) {
	return s.repo.SearchUsers(ctx, query)
}

func (s *UserService) UpdateUser(ctx context.Context, user *User) error {
	return s.repo.UpdateUser(ctx, user)
}

func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID, password string) error {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return err
	}
	if !crypto.VerifyPassword(password, user.Password) {
		return ErrInvalidPassword
	}
	return s.repo.DeleteUser(ctx, id)
}


func (s *UserService) AddFavorite(ctx context.Context, userID uuid.UUID, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(ctx, tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.AddFavorite(ctx, userID, movie.ID)
}

func (s *UserService) RemoveFavorite(ctx context.Context, userID uuid.UUID, tmdbID int) error {
	movie, err := s.movieRepo.GetMovieByTMDBID(ctx, tmdbID)
	if err != nil {
		return ErrMovieNotFound
	}
	return s.repo.RemoveFavorite(ctx, userID, movie.ID)
}

func (s *UserService) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	return s.repo.GetUserByUsername(ctx, username)
}

func (s *UserService) GetIDByUsername(ctx context.Context, username string) (uuid.UUID, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return uuid.Nil, errors.New("Usuário não encontrado")
	}
	return user.ID, nil
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

func (s *UserService) GetUserStats(ctx context.Context, userID uuid.UUID) (*UserStats, error) {
	return s.repo.GetUserStats(ctx, userID)
}

func (s *UserService) IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	err := s.repo.IncrementUserStats(ctx, userID, movies, minutes)
	if err != nil {
		return err
	}

	go func() {
		_ = s.RecalculateTopGenre(context.Background(), userID)
	}()

	return nil
}

func (s *UserService) RecalculateTopGenre(ctx context.Context, userID uuid.UUID) error {
	stats, err := s.repo.GetUserStats(ctx, userID)
	if err != nil {
		return err
	}

	if stats != nil && time.Since(stats.LastRecalcAt) < 30*time.Second {
		return nil 
	}

	genreID, err := s.repo.GetTopGenreByUsage(ctx, userID)
	if err != nil {
		return err
	}

	if stats == nil {
		return nil
	}

	stats.TopGenreID = genreID
	stats.LastRecalcAt = time.Now()
	stats.UpdatedAt = time.Now()

	err = s.repo.UpdateUserStats(ctx, stats)
	if err == nil {
		slog.Debug("User top genre recalculated", "user_id", userID, "genre_id", genreID)
	}
	return err
}
