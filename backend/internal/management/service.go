package management

import (
	"context"
	"errors"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
)

var (
	ErrSessionOverlap   = errors.New("conflito de horário: a sala já possui uma sessão neste período")
	ErrNotCinemaManager = errors.New("acesso negado: você não é gerente deste cinema")
)

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type ManagementRepository interface {
	CreateCinema(ctx context.Context, cinema *domain.Cinema) error
	GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error)
	ListCinemas(ctx context.Context) ([]domain.Cinema, error)
	
	CreateRoom(ctx context.Context, room *domain.Room, seats []domain.Seat) error
	GetRoomByID(ctx context.Context, id int) (*domain.Room, error)
	
	CreateSession(ctx context.Context, session *domain.Session) error
	ListSessions(ctx context.Context, cinemaID int, date string) ([]domain.Session, error)
	GetSessionsByRoom(ctx context.Context, roomID int, date time.Time) ([]domain.Session, error)
	
	IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error)
}

type ManagementService struct {
	repo          ManagementRepository
	movieProvider MovieProvider
}

func NewService(repo ManagementRepository, movieProvider MovieProvider) *ManagementService {
	return &ManagementService{
		repo:          repo,
		movieProvider: movieProvider,
	}
}

func (s *ManagementService) CreateCinema(ctx context.Context, req CreateCinemaRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	cinema := &domain.Cinema{
		Name:    req.Name,
		Address: req.Address,
		City:    req.City,
		Phone:   req.Phone,
		Email:   req.Email,
	}

	return s.repo.CreateCinema(ctx, cinema)
}

func (s *ManagementService) CreateRoom(ctx context.Context, req CreateRoomRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	room := &domain.Room{
		CinemaID: req.CinemaID,
		Name:     req.Name,
		Capacity: req.Capacity,
		Type:     domain.RoomType(req.Type),
	}

	var seats []domain.Seat
	cols := 10
	rows := (req.Capacity + cols - 1) / cols

	for r := 0; r < rows; r++ {
		rowLabel := string(rune('A' + r))
		for c := 1; c <= cols; c++ {
			if len(seats) >= req.Capacity {
				break
			}
			seats = append(seats, domain.Seat{
				Row:    rowLabel,
				Number: c,
				PosX:   c * 40,
				PosY:   r * 40,
				Type:   "STANDARD",
			})
		}
	}

	return s.repo.CreateRoom(ctx, room, seats)
}

func (s *ManagementService) CreateSession(ctx context.Context, userID uuid.UUID, req CreateSessionRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	if req.StartTime.Before(time.Now()) {
		return errors.New("não é possível criar uma sessão no passado")
	}

	room, err := s.repo.GetRoomByID(ctx, req.RoomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	isManager, err := s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
	if err != nil {
		return err
	}
	if !isManager {
		return ErrNotCinemaManager
	}

	movie, err := s.movieProvider.GetMovieDetails(ctx, req.MovieID)
	if err != nil {
		return errors.New("filme não encontrado na base ou TMDB")
	}

	existingSessions, err := s.repo.GetSessionsByRoom(ctx, req.RoomID, req.StartTime)
	if err != nil {
		return err
	}

	newStart := req.StartTime
	newEnd := newStart.Add(time.Duration(movie.Runtime+15) * time.Minute)

	for _, es := range existingSessions {
		esStart := es.StartTime
		esEnd := esStart.Add(time.Duration(es.Movie.Runtime+15) * time.Minute)

		if newStart.Before(esEnd) && esStart.Before(newEnd) {
			return ErrSessionOverlap
		}
	}

	session := &domain.Session{
		MovieID:     req.MovieID,
		RoomID:      req.RoomID,
		StartTime:   req.StartTime,
		Price:       req.Price,
		SessionType: domain.SessionType(req.SessionType),
		IsFree:      req.Price == 0,
	}

	return s.repo.CreateSession(ctx, session)
}

func (s *ManagementService) GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error) {
	return s.repo.GetCinemaByID(ctx, id)
}

func (s *ManagementService) ListCinemas(ctx context.Context) ([]CinemaAdminResponseDTO, error) {
	cinemas, err := s.repo.ListCinemas(ctx)
	if err != nil {
		return nil, err
	}

	var response []CinemaAdminResponseDTO
	for _, c := range cinemas {
		response = append(response, CinemaAdminResponseDTO{
			ID:      c.ID,
			Name:    c.Name,
			City:    c.City,
			Address: c.Address,
		})
	}
	return response, nil
}

func (s *ManagementService) ListSessions(ctx context.Context, cinemaID int, date string) ([]SessionAdminResponseDTO, error) {
	sessions, err := s.repo.ListSessions(ctx, cinemaID, date)
	if err != nil {
		return nil, err
	}

	var response []SessionAdminResponseDTO
	for _, sess := range sessions {
		response = append(response, SessionAdminResponseDTO{
			ID:          sess.ID,
			MovieTitle:  sess.Movie.Title,
			RoomName:    sess.Room.Name,
			StartTime:   sess.StartTime,
			Price:       sess.Price,
			SessionType: string(sess.SessionType),
		})
	}
	return response, nil
}
