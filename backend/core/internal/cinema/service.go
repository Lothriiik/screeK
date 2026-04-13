package cinema

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/events"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/google/uuid"
)

var (
	ErrSessionOverlap   = errors.New("conflito de horário: a sala já possui uma sessão neste período")
	ErrNotCinemaManager = errors.New("acesso negado: você não é gerente deste cinema")
)

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type CinemaService struct {
	repo          CinemaRepository
	movieProvider MovieProvider
	events        *events.EventBus
}

func NewService(repo CinemaRepository, movieProvider MovieProvider, events *events.EventBus) *CinemaService {
	return &CinemaService{
		repo:          repo,
		movieProvider: movieProvider,
		events:        events,
	}
}

func (s *CinemaService) CreateCinema(ctx context.Context, role httputil.Role, req CreateCinemaRequest) error {
	if role != httputil.RoleAdmin {
		return errors.New("apenas administradores podem criar cinemas")
	}

	cinema := &Cinema{
		Name:    req.Name,
		City:    req.City,
		Address: req.Address,
		Phone:   req.Phone,
		Email:   req.Email,
	}

	return s.repo.CreateCinema(ctx, cinema)
}

func (s *CinemaService) CreateRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, req CreateRoomRequest) error {
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

	room := &Room{
		CinemaID: req.CinemaID,
		Name:     req.Name,
		Capacity: req.Capacity,
		Type:     RoomType(req.Type),
	}

	seats := make([]Seat, req.Capacity)
	rows := []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"}
	for i := 0; i < req.Capacity; i++ {
		rowIdx := i / 10
		num := (i % 10) + 1
		seats[i] = Seat{
			Row:    rows[rowIdx],
			Number: num,
			Type:   "STANDARD",
		}
	}

	return s.repo.CreateRoom(ctx, room, seats)
}

func (s *CinemaService) CreateSession(ctx context.Context, userID uuid.UUID, role httputil.Role, req CreateSessionRequest) error {
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

	session := &Session{
		MovieID:     req.MovieID,
		RoomID:      req.RoomID,
		StartTime:   req.StartTime,
		Price:       req.Price,
		SessionType: SessionType(req.SessionType),
		IsFree:      req.Price == 0,
	}

	if err := s.repo.CreateSessionWithOverlapCheck(ctx, session, movie.Runtime); err != nil {
		slog.Error("Erro ao criar sessão no repositório", "error", err)
		return err
	}

	if s.events != nil {
		s.events.Publish(events.EventSessionScheduled, events.SessionScheduledEvent{
			SessionID: session.ID,
			MovieID:   session.MovieID,
			RoomID:    session.RoomID,
			StartTime: session.StartTime.Format(time.RFC3339),
		})
	}

	return nil
}

func (s *CinemaService) DeleteSession(ctx context.Context, userID uuid.UUID, role httputil.Role, sessionID int) error {
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

func (s *CinemaService) GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]WatchlistMatch, error) {
	return s.repo.GetWatchlistMatchesForSession(ctx, sessionID)
}

func (s *CinemaService) UpdateCinema(ctx context.Context, role httputil.Role, id int, req CreateCinemaRequest) error {
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

func (s *CinemaService) DeleteCinema(ctx context.Context, role httputil.Role, id int) error {
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

func (s *CinemaService) UpdateRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, roomID int, req CreateRoomRequest) error {
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
	room.Type = RoomType(req.Type)

	return s.repo.UpdateRoom(ctx, room)
}

func (s *CinemaService) DeleteRoom(ctx context.Context, userID uuid.UUID, role httputil.Role, roomID int) error {
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

func (s *CinemaService) UpdateSession(ctx context.Context, userID uuid.UUID, role httputil.Role, sessionID int, req CreateSessionRequest) error {
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
	session.SessionType = SessionType(req.SessionType)
	session.IsFree = req.Price == 0

	movie, err := s.movieProvider.GetMovieDetails(ctx, req.MovieID)
	if err != nil {
		return errors.New("filme não encontrado")
	}

	return s.repo.UpdateSessionWithOverlapCheck(ctx, session, movie.Runtime)
}

func (s *CinemaService) GetCinemaByID(ctx context.Context, id int) (*Cinema, error) {
	return s.repo.GetCinemaByID(ctx, id)
}

func (s *CinemaService) ListCinemas(ctx context.Context) ([]CinemaAdminResponseDTO, error) {
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

func (s *CinemaService) ListSessions(ctx context.Context, cinemaID int, date string) ([]SessionAdminResponseDTO, error) {
	sessions, err := s.repo.ListSessions(ctx, cinemaID, date)
	if err != nil {
		return nil, err
	}

	var response []SessionAdminResponseDTO
	for _, sess := range sessions {

		movie, _ := s.movieProvider.GetMovieDetails(ctx, sess.MovieID)
		movieTitle := "Desconhecido"
		if movie != nil {
			movieTitle = movie.Title
		}

		response = append(response, SessionAdminResponseDTO{
			ID:          sess.ID,
			MovieTitle:  movieTitle,
			RoomName:    sess.Room.Name,
			StartTime:   sess.StartTime,
			Price:       sess.Price,
			SessionType: string(sess.SessionType),
		})
	}
	return response, nil
}

func (s *CinemaService) GetWatchlistMatches(ctx context.Context) ([]WatchlistMatch, error) {
	return s.repo.GetWatchlistMatches(ctx)
}
