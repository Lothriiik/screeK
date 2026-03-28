package bookings

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
	redisclient "github.com/redis/go-redis/v9"
)

var (
	ErrSeatLockFailed      = errors.New("uma ou mais cadeiras foram compradas por outro usuário")
	ErrInvalidTicketStatus = errors.New("query param 'status' inválido")
)

type BookingsService struct {
	store BookingsRepository
	redisClient *redisclient.Client
}

func NewService(store BookingsRepository, redisClient *redisclient.Client) *BookingsService {
	return &BookingsService{
		store: store,
		redisClient: redisClient,
	}
}

func (s *BookingsService) GetMoviesPlaying(ctx context.Context, city, date string) ([]movies.Movie, error) {
	return s.store.GetMoviesPlaying(ctx, city, date)
}

func (s *BookingsService) GetMovieSessionsGroupedByCinema(ctx context.Context, movieID int, city, date string) ([]CinemaSessionsResponseDTO, error) {
	sessions, err := s.store.GetSessionsByMovie(ctx, movieID, city, date)
	if err != nil {
		return nil, err
	}

	groupedMap := make(map[int]*CinemaSessionsResponseDTO)

	for _, session := range sessions {
		cinema := session.Room.Cinema
		id := cinema.ID

		if _, exists := groupedMap[id]; !exists {
			groupedMap[id] = &CinemaSessionsResponseDTO{
				CinemaID:   cinema.ID,
				CinemaName: cinema.Name,
				CinemaCity: cinema.City,
				Sessions:   []SessionResponseDTO{},
			}
		}

		groupedMap[id].Sessions = append(groupedMap[id].Sessions, SessionResponseDTO{
			ID:          session.ID,
			StartTime:   session.StartTime,
			Price:       session.Price,
			RoomType:    session.Room.Type,
			SessionType: session.SessionType,
		})
	}

	var response []CinemaSessionsResponseDTO
	for _, v := range groupedMap {
		response = append(response, *v)
	}

	sort.Slice(response, func(i, j int) bool {
		return response[i].CinemaName < response[j].CinemaName
	})

	return response, nil
}

func (s *BookingsService) GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error) {
	return s.store.GetSeatsBySession(ctx, sessionID)
}

func (s *BookingsService) GetSessionByID(ctx context.Context, sessionID int) (*Session, error) {
    return s.store.GetSessionByID(ctx, sessionID)
}


func (s *BookingsService) ReserveSeats(ctx context.Context, userID int, sessionID int, seatIDs []int) (*Transaction, error) {
	var lockedAssets []string

	for _, seats  := range seatIDs {
		seat := fmt.Sprintf("seat:%d:%d", sessionID, seats)
		resultado := s.redisClient.SetNX(ctx, seat, userID, 10*time.Minute).Val()

		if !resultado {
			for _, lockedAsset := range  lockedAssets {
				s.redisClient.Del(ctx, lockedAsset)
			}
			return nil, ErrSeatLockFailed
		}

		lockedAssets = append(lockedAssets, seat)
	}

	session, err := s.store.GetSessionByID(ctx, sessionID)
	if err != nil {
		for _, lockedAsset := range  lockedAssets {
			s.redisClient.Del(ctx, lockedAsset)
		}
		return nil, ErrSeatLockFailed
	}

	totalAmount := int(session.Price) * len(seatIDs)

	transaction, err := s.store.CreateReservation(ctx, userID, sessionID, seatIDs, totalAmount)
	if err != nil {
		for _, lockedAsset := range lockedAssets {
			s.redisClient.Del(ctx, lockedAsset)
		}
		return nil, err
	}
	return transaction, nil
}

func (s *BookingsService) PayReservation(ctx context.Context, transactionID int, userID int, method string) error {
	return s.store.PayTransaction(ctx, transactionID, userID, method)
}


func (s *BookingsService) CancelTicket(ctx context.Context, ticketID int, userID int) error {
	return s.store.CancelTicket(ctx, ticketID, userID)
}


func (s *BookingsService) GetUserTickets(ctx context.Context, userID int, status string) ([]TicketResponseDTO, error) {
	
	if status != "" && status != string(TicketStatusPaid) && status != string(TicketStatusPending) && status != string(TicketStatusCancelled) {
		return nil, ErrInvalidTicketStatus
	}

	tickets, err := s.store.GetUserTickets(ctx, userID, status)
	if err != nil{
		return nil, err
	}

	var response []TicketResponseDTO
	for _, t := range tickets {
		dto := TicketResponseDTO{
			ID:        t.ID,
			MovieName: t.Session.Movie.Title,         
			Cinema:    t.Session.Room.Cinema.Name,
			Date:      t.Session.StartTime.Format("02/01/2006 15:04"),
			Room:      t.Session.Room.Name,
			Seat:      func() string {
				if t.Seat != nil {
					return fmt.Sprintf("%s%d", t.Seat.Row, t.Seat.Number)
				}
				return "Geral"
			}(),
			Status:    string(t.Status),
			QRCode:    t.QRCode,
		}
		response = append(response, dto)
	}

    return response, nil
}

func (s *BookingsService) GetTicketDetail(ctx context.Context, ticketID int, userID int) (TicketResponseDTO, error) {
	ticket, err := s.store.GetTicketDetail(ctx, ticketID, userID)
	if err != nil{
		return TicketResponseDTO{}, err 
	}

	dto := TicketResponseDTO{
		ID:        ticket.ID,
		MovieName: ticket.Session.Movie.Title,         
		Cinema:    ticket.Session.Room.Cinema.Name,
		Date:      ticket.Session.StartTime.Format("02/01/2006 15:04"),
		Room:      ticket.Session.Room.Name,
		Seat:      func() string {
			if ticket.Seat != nil {
				return fmt.Sprintf("%s%d", ticket.Seat.Row, ticket.Seat.Number)
			}
			return "Geral"
		}(),
		Status:    string(ticket.Status),
		QRCode:    ticket.QRCode,
	}

	return dto, err
}