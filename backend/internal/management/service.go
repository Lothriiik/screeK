package management

import (
	"context"
	"errors"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/events"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
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
	UpdateCinema(ctx context.Context, cinema *domain.Cinema) error
	DeleteCinema(ctx context.Context, id int) error
	ListCinemas(ctx context.Context) ([]domain.Cinema, error)

	CreateRoom(ctx context.Context, room *domain.Room, seats []domain.Seat) error
	GetRoomByID(ctx context.Context, id int) (*domain.Room, error)
	UpdateRoom(ctx context.Context, room *domain.Room) error
	DeleteRoom(ctx context.Context, id int) error

	CreateSession(ctx context.Context, session *domain.Session) error
	CreateSessionWithOverlapCheck(ctx context.Context, session *domain.Session, movieRuntime int) error
	UpdateSession(ctx context.Context, session *domain.Session) error
	UpdateSessionWithOverlapCheck(ctx context.Context, session *domain.Session, movieRuntime int) error
	ListSessions(ctx context.Context, cinemaID int, date string) ([]domain.Session, error)
	GetSessionsByRoom(ctx context.Context, roomID int, date time.Time) ([]domain.Session, error)
	GetSession(ctx context.Context, sessionID int) (*domain.Session, error)
	DeleteSession(ctx context.Context, sessionID int) error
	GetSessionBookingsCount(ctx context.Context, sessionID int) (int, error)
	GetWatchlistMatches(ctx context.Context) ([]WatchlistMatch, error)
	GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]WatchlistMatch, error)

	IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error)
}

type ManagementService struct {
	repo          ManagementRepository
	movieProvider MovieProvider
	events        *events.EventBus
}

func NewService(repo ManagementRepository, movieProvider MovieProvider, events *events.EventBus) *ManagementService {
	return &ManagementService{
		repo:          repo,
		movieProvider: movieProvider,
		events:        events,
	}
}

func (s *ManagementService) CreateCinema(ctx context.Context, role httputil.Role, req CreateCinemaRequest) error {
	if role != httputil.RoleAdmin {
		return errors.New("apenas administradores podem criar cinemas")
	}

	cinema := &domain.Cinema{
		Name:    req.Name,
		City:    req.City,
		Address: req.Address,
		Phone:   req.Phone,
		Email:   req.Email,
	}

	return s.repo.CreateCinema(ctx, cinema)
}

func (s *ManagementService) CreateRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, req CreateRoomRequest) error {
	isManager, err := func() (bool, error) {
		if role == httputil.RoleAdmin {
			return true, nil
		}
		return s.repo.IsManagerOfCinema(ctx, userID, req.CinemaID)
	}()
	if err != nil {
		return err
	}
	if !isManager {
		return ErrNotCinemaManager
	}

	room := &domain.Room{
		CinemaID: req.CinemaID,
		Name:     req.Name,
		Capacity: req.Capacity,
		Type:     domain.RoomType(req.Type),
	}

	seats := make([]domain.Seat, req.Capacity)
	rows := []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"}
	for i := 0; i < req.Capacity; i++ {
		rowIdx := i / 10
		num := (i % 10) + 1
		seats[i] = domain.Seat{
			Row:    rows[rowIdx],
			Number: num,
			Type:   "STANDARD",
		}
	}

	return s.repo.CreateRoom(ctx, room, seats)
}

func (s *ManagementService) CreateSession(ctx context.Context, userID uuid.UUID, role httputil.Role, req CreateSessionRequest) error {
	room, err := s.repo.GetRoomByID(ctx, req.RoomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	isManager, err := func() (bool, error) {
		if role == httputil.RoleAdmin {
			return true, nil
		}
		return s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
	}()
	if err != nil {
		return err
	}
	if !isManager {
		return ErrNotCinemaManager
	}

	movie, err := s.movieProvider.GetMovieDetails(ctx, req.MovieID)
	if err != nil {
		return errors.New("filme não encontrado")
	}

	session := &domain.Session{
		MovieID:     req.MovieID,
		RoomID:      req.RoomID,
		StartTime:   req.StartTime,
		Price:       req.Price,
		SessionType: domain.SessionType(req.SessionType),
		IsFree:      req.Price == 0,
	}

	if err := s.repo.CreateSessionWithOverlapCheck(ctx, session, movie.Runtime); err != nil {
		return err
	}

	if s.events != nil {
		s.events.Publish(events.EventSessionScheduled, events.Data{
			"session_id":  session.ID,
			"movie_id":    session.MovieID,
			"movie_title": movie.Title,
			"city":        room.Cinema.City,
		})
	}

	return nil
}

func (s *ManagementService) DeleteSession(ctx context.Context, userID uuid.UUID, role httputil.Role, sessionID int) error {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return errors.New("sessão não encontrada")
	}

	room, err := s.repo.GetRoomByID(ctx, session.RoomID)
	if err != nil {
		return errors.New("sala associada não encontrada")
	}

	isManager, err := func() (bool, error) {
		if role == httputil.RoleAdmin {
			return true, nil
		}
		return s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
	}()
	if err != nil {
		return err
	}
	if !isManager {
		return ErrNotCinemaManager
	}

	count, err := s.repo.GetSessionBookingsCount(ctx, sessionID)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("não é possível excluir uma sessão que já possui ingressos vendidos")
	}

	return s.repo.DeleteSession(ctx, sessionID)
}

func (s *ManagementService) GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]WatchlistMatchDTO, error) {
	matches, err := s.repo.GetWatchlistMatchesForSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	var dtos []WatchlistMatchDTO
	for _, m := range matches {
		dtos = append(dtos, WatchlistMatchDTO{
			UserID:     m.UserID,
			MovieID:    m.MovieID,
			MovieTitle: m.MovieTitle,
			City:       m.City,
			Type:       m.Type,
		})
	}
	return dtos, nil
}

func (s *ManagementService) UpdateCinema(ctx context.Context, role httputil.Role, id int, req CreateCinemaRequest) error {
	if role != httputil.RoleAdmin {
		return errors.New("apenas administradores podem editar cinemas")
	}
	if err := req.Validate(); err != nil {
		return err
	}

	cinema, err := s.repo.GetCinemaByID(ctx, id)
	if err != nil {
		return errors.New("cinema não encontrado")
	}

	cinema.Name = req.Name
	cinema.Address = req.Address
	cinema.City = req.City
	cinema.Phone = req.Phone
	cinema.Email = req.Email

	return s.repo.UpdateCinema(ctx, cinema)
}

func (s *ManagementService) DeleteCinema(ctx context.Context, role httputil.Role, id int) error {
	if role != httputil.RoleAdmin {
		return errors.New("apenas administradores podem excluir cinemas")
	}

	cinema, err := s.repo.GetCinemaByID(ctx, id)
	if err != nil {
		return errors.New("cinema não encontrado")
	}

	if len(cinema.Rooms) > 0 {
		return errors.New("não é possível excluir um cinema que possui salas vinculadas")
	}

	return s.repo.DeleteCinema(ctx, id)
}

func (s *ManagementService) UpdateRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, roomID int, req CreateRoomRequest) error {
	room, err := s.repo.GetRoomByID(ctx, roomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	if role != httputil.RoleAdmin {
		isManager, err := s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
		if err != nil || !isManager {
			return ErrNotCinemaManager
		}
	}

	if err := req.Validate(); err != nil {
		return err
	}

	room.Name = req.Name
	room.Capacity = req.Capacity
	room.Type = domain.RoomType(req.Type)

	return s.repo.UpdateRoom(ctx, room)
}

func (s *ManagementService) DeleteRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, roomID int) error {
	room, err := s.repo.GetRoomByID(ctx, roomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	if role != httputil.RoleAdmin {
		isManager, err := s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
		if err != nil || !isManager {
			return ErrNotCinemaManager
		}
	}

	sessions, err := s.repo.GetSessionsByRoom(ctx, roomID, time.Now())
	if err != nil {
		return err
	}

	if len(sessions) > 0 {
		return errors.New("não é possível excluir uma sala com sessões futuras agendadas")
	}

	return s.repo.DeleteRoom(ctx, roomID)
}

func (s *ManagementService) UpdateSession(ctx context.Context, userID uuid.UUID, role httputil.Role, sessionID int, req CreateSessionRequest) error {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return errors.New("sessão não encontrada")
	}

	room, err := s.repo.GetRoomByID(ctx, session.RoomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	if role != httputil.RoleAdmin {
		isManager, err := s.repo.IsManagerOfCinema(ctx, userID, room.CinemaID)
		if err != nil || !isManager {
			return ErrNotCinemaManager
		}
	}

	count, err := s.repo.GetSessionBookingsCount(ctx, sessionID)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("não é possível editar uma sessão que já possui ingressos vendidos")
	}

	if err := req.Validate(); err != nil {
		return err
	}

	if req.StartTime.Before(time.Now()) {
		return errors.New("não é possível atualizar para uma data no passado")
	}

	session.MovieID = req.MovieID
	session.RoomID = req.RoomID
	session.StartTime = req.StartTime
	session.Price = req.Price
	session.SessionType = domain.SessionType(req.SessionType)
	session.IsFree = req.Price == 0

	movie, err := s.movieProvider.GetMovieDetails(ctx, req.MovieID)
	if err != nil {
		return errors.New("filme não encontrado")
	}

	return s.repo.UpdateSessionWithOverlapCheck(ctx, session, movie.Runtime)
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

func (s *ManagementService) GetWatchlistMatches(ctx context.Context) ([]WatchlistMatchDTO, error) {
	matches, err := s.repo.GetWatchlistMatches(ctx)
	if err != nil {
		return nil, err
	}
	var dtos []WatchlistMatchDTO
	for _, m := range matches {
		dtos = append(dtos, WatchlistMatchDTO{
			UserID:     m.UserID,
			MovieID:    m.MovieID,
			MovieTitle: m.MovieTitle,
			City:       m.City,
			Type:       m.Type,
		})
	}
	return dtos, nil
}
