package store

import (
	"errors"
	"sync"

	"github.com/StartLivin/cine-pass/backend/internal/models"
	"github.com/StartLivin/cine-pass/backend/internal/services"
)

type Storage interface {
	CreateUser(user *models.User) error
	GetUserByID(id int) (*models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id int) error

	SaveMovie(movie *models.Movie) error
	GetMovieByTMDBID(tmdbID int) (*models.Movie, error)
	SaveMovieDetails(tmdbData *services.TMDBMovieDetails) (*models.Movie, error)
}

type MemoryStore struct {
	users  map[int]models.User
	mu     sync.RWMutex
	nextID int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		users:  make(map[int]models.User),
		nextID: 1,
	}
}

func (s *MemoryStore) CreateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user.ID = s.nextID
	s.nextID++

	s.users[user.ID] = *user
	return nil
}

func (s *MemoryStore) GetUserByID(id int) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, ok := s.users[id]
	if !ok {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

func (s *MemoryStore) UpdateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.users[user.ID] = *user
	return nil
}

func (s *MemoryStore) DeleteUser(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.users, id)
	return nil
}

func (s *MemoryStore) SaveMovie(movie *models.Movie) error {
	return nil
}

func (s *MemoryStore) GetMovieByTMDBID(tmdbID int) (*models.Movie, error) {
	return nil, errors.New("não implementado em memória")
}

func (s *MemoryStore) SaveMovieDetails(tmdbData *services.TMDBMovieDetails) (*models.Movie, error) {
	return nil, nil
}
