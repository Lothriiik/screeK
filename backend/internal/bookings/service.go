package bookings

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/google/uuid"
	redisclient "github.com/redis/go-redis/v9"
)

var (
	ErrSeatLockFailed      = errors.New("uma ou mais cadeiras foram compradas por outro usuário")
	ErrInvalidTicketStatus = errors.New("query param 'status' inválido")
)

type Mailer interface {
	SendTicketEmail(to, userName, qrCode string) error
}

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type SimpleRedisClient interface {
	SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redisclient.BoolCmd
	Del(ctx context.Context, keys ...string) *redisclient.IntCmd
}

type Service interface {
	GetMoviesPlaying(ctx context.Context, city, date string) ([]movies.MovieDTO, error)
	GetMovieSessionsGroupedByCinema(ctx context.Context, movieID int, city, date string) ([]CinemaSessionsResponseDTO, error)
	GetSeatsBySession(ctx context.Context, sessionID int) ([]domain.Seat, error)
	GetSessionByID(ctx context.Context, sessionID int) (*domain.Session, error)
	ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []TicketRequest) (*Transaction, error)
	PayReservation(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, idempotencyKey string) (string, error)
	CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error
	GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]TicketResponseDTO, error)
	GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (TicketResponseDTO, error)
	ConfirmPaymentWebhook(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error
	SetPaymentProcessedNX(ctx context.Context, paymentID string) (bool, error)
	DeletePaymentLock(ctx context.Context, paymentID string) error
	CleanupExpiredReservations(ctx context.Context) error
}

type bookingsService struct {
	store         BookingsRepository
	redisClient   SimpleRedisClient
	payment       payment.Service
	mailer        Mailer
	movieProvider MovieProvider
}

func NewService(store BookingsRepository, redis SimpleRedisClient, payment payment.Service, mailer Mailer, movieProvider MovieProvider) Service {
	return &bookingsService{
		store:         store,
		redisClient:   redis,
		payment:       payment,
		mailer:        mailer,
		movieProvider: movieProvider,
	}
}

func (s *bookingsService) GetMoviesPlaying(ctx context.Context, city, date string) ([]movies.MovieDTO, error) {
	moviesList, err := s.store.GetMoviesPlaying(ctx, city, date)
	if err != nil {
		return nil, err
	}

	var movieIDs []int
	for _, m := range moviesList {
		movieIDs = append(movieIDs, m.ID)
	}

	statusMap, err := s.store.GetSpecialStatusForMovies(ctx, city, movieIDs)
	if err != nil {
		statusMap = make(map[int]map[string]bool)
	}

	var response []movies.MovieDTO
	for _, m := range moviesList {
		status := statusMap[m.ID]
		response = append(response, movies.MovieDTO{
			ID:            m.ID,
			TMDBID:        m.TMDBID,
			Title:         m.Title,
			PosterURL:     m.PosterURL,
			IsPremiere:    status["premiere"],
			IsRescreening: status["rescreening"],
		})
	}

	return response, nil
}

func (s *bookingsService) GetMovieSessionsGroupedByCinema(ctx context.Context, movieID int, city, date string) ([]CinemaSessionsResponseDTO, error) {
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
			RoomType:    string(session.Room.Type),
			SessionType: string(session.SessionType),
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

func (s *bookingsService) GetSeatsBySession(ctx context.Context, sessionID int) ([]domain.Seat, error) {
	return s.store.GetSeatsBySession(ctx, sessionID)
}

func (s *bookingsService) GetSessionByID(ctx context.Context, sessionID int) (*domain.Session, error) {
	return s.store.GetSessionByID(ctx, sessionID)
}

func (s *bookingsService) ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []TicketRequest) (*Transaction, error) {
	var lockedAssets []string

	for _, tReq := range ticketsReq {
		seat := fmt.Sprintf("seat:%d:%d", sessionID, tReq.SeatID)
		res := s.redisClient.SetNX(ctx, seat, userID, 10*time.Minute)
		if err := res.Err(); err != nil {
			return nil, err
		}

		if !res.Val() {
			for _, lockedAsset := range lockedAssets {
				s.redisClient.Del(ctx, lockedAsset)
			}
			return nil, ErrSeatLockFailed
		}

		lockedAssets = append(lockedAssets, seat)
	}

	session, err := s.store.GetSessionByID(ctx, sessionID)
	if err != nil {
		for _, lockedAsset := range lockedAssets {
			s.redisClient.Del(ctx, lockedAsset)
		}
		return nil, errors.New("sessão não encontrada")
	}

	basePrice := session.Price
	
	if session.Room.Type == domain.RoomTypeVIP {
		basePrice = int(float64(basePrice) * 1.5)
	} else if session.Room.Type == domain.RoomTypeIMAX {
		basePrice = int(float64(basePrice) * 1.3)
	}

	var totalAmount int
	var ticketsToSave []Ticket

	for _, tReq := range ticketsReq {
		finalPrice := basePrice

		if tReq.Type == TicketTypeHalf {
			finalPrice = finalPrice / 2
		} else if tReq.Type == TicketTypeFree || session.IsFree {
			finalPrice = 0
		}

		totalAmount += finalPrice
		
		sID := tReq.SeatID
		ticketsToSave = append(ticketsToSave, Ticket{
			ID:        uuid.New(),
			SessionID: sessionID,
			SeatID:    &sID,
			Type:      tReq.Type,
			PricePaid: finalPrice,
			QRCode:    "temp_" + uuid.NewString(),
			Status:    TicketStatusPending,
		})
	}

	transaction, err := s.store.CreateReservation(ctx, userID, sessionID, ticketsToSave, totalAmount)
	if err != nil {
		for _, lockedAsset := range lockedAssets {
			s.redisClient.Del(ctx, lockedAsset)
		}
		return nil, err
	}
	return transaction, nil
}

func (s *bookingsService) PayReservation(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, idempotencyKey string) (string, error) {
	transaction, err := s.store.GetTransactionByID(ctx, transactionID, userID)
	if err != nil {
		return "", errors.New("transação não encontrada, não pertence a você ou já paga")
	}
	if transaction.Status != TicketStatusPending { 
		return "", errors.New("esta transação não está mais pendente")
	}

	metadata := map[string]string{
		"booking_id": transactionID.String(),
		"user_id":    userID.String(),
		"method":     method,
	}

	if transaction.TotalAmount == 0 {
		if err := s.store.PayTransaction(ctx, transactionID, userID, "FREE"); err != nil {
			return "", errors.New("erro ao processar reserva gratuita")
		}
		
		if s.mailer != nil {
			go func() {
				fullTransaction, err := s.store.GetTransactionByID(ctx, transactionID, userID)
				if err == nil {
					for _, t := range fullTransaction.Tickets {
						s.mailer.SendTicketEmail(fullTransaction.User.Email, fullTransaction.User.Name, t.QRCode)
					}
				}
			}()
		}
		return "FREE", nil
	}

	result, err := s.payment.CreatePayment(ctx, transaction.TotalAmount, "brl", metadata, idempotencyKey)
	if err != nil {
		return "", fmt.Errorf("falha na conexão com meio de pagamento: %w", err)
	}

	return result.ClientSecret, nil
}

func (s *bookingsService) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	return s.store.CancelTicket(ctx, ticketID, userID)
}

func (s *bookingsService) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]TicketResponseDTO, error) {
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

	sort.Slice(response, func(i, j int) bool {
		return response[i].Date > response[j].Date
	})

    return response, nil
}

func (s *bookingsService) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (TicketResponseDTO, error) {
	ticket, err := s.store.GetTicketDetail(ctx, ticketID, userID)
	if err != nil {
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

func (s *bookingsService) ConfirmPaymentWebhook(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error {
	err := s.store.PayTransaction(ctx, transactionID, userID, method)
	if err != nil {
		return err
	}

	transaction, err := s.store.GetTransactionByID(ctx, transactionID, userID)
	if err != nil {
		return nil
	}
	
	if s.mailer != nil {
		go func() {
			for _, t := range transaction.Tickets {
				s.mailer.SendTicketEmail(transaction.User.Email, transaction.User.Name, t.QRCode)
			}
		}()
	}

	return nil
}

func (s *bookingsService) CleanupExpiredReservations(ctx context.Context) error {
	tickets, txs, err := s.store.CleanupExpiredReservations(ctx)
	if err != nil {
		return err
	}

	if tickets+txs > 0 {
		slog.Info("[Job] Limpeza de reservas concluída", "tickets", tickets, "transações", txs)
	}

	return nil
}

func (s *bookingsService) SetPaymentProcessedNX(ctx context.Context, paymentID string) (bool, error) {
	lockKey := "payment_processed:" + paymentID
	res := s.redisClient.SetNX(ctx, lockKey, "processed", 24*time.Hour)
	return res.Result()
}

func (s *bookingsService) DeletePaymentLock(ctx context.Context, paymentID string) error {
	lockKey := "payment_processed:" + paymentID
	res := s.redisClient.Del(ctx, lockKey)
	return res.Err()
}
