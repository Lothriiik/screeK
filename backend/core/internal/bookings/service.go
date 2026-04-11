package bookings

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"time"

	"github.com/StartLivin/screek/backend/internal/bookings/infra/payment"
	"github.com/StartLivin/screek/backend/internal/cinema"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/events"
	"github.com/google/uuid"
	redisclient "github.com/redis/go-redis/v9"
)

var (
	ErrSeatLockFailed      = errors.New("uma ou mais cadeiras foram compradas por outro usuário")
	ErrInvalidTicketStatus = errors.New("query param 'status' inválido")
)

type Mailer interface {
	SendTicketEmail(ctx context.Context, to, userName, qrCode string) error
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
	GetSeatsBySession(ctx context.Context, sessionID int) ([]cinema.Seat, error)
	GetSessionByID(ctx context.Context, sessionID int) (*cinema.Session, error)
	ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []TicketRequest) (*Transaction, error)
	PayReservation(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, idempotencyKey string) (string, error)
	CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error
	GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]TicketResponseDTO, error)
	GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (TicketResponseDTO, error)
	ConfirmPaymentWebhook(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error
	SetPaymentProcessedNX(ctx context.Context, paymentID string) (bool, error)
	DeletePaymentLock(ctx context.Context, paymentID string) error
	CleanupExpiredReservations(ctx context.Context) error

	AdminCancelTicket(ctx context.Context, ticketID uuid.UUID) error
	AdminCancelSession(ctx context.Context, sessionID int) error
	GetTicketsBySession(ctx context.Context, sessionID int) ([]TicketResponseDTO, error)
}

type bookingsService struct {
	store         BookingsRepository
	redisClient   SimpleRedisClient
	payment       payment.Service
	mailer        Mailer
	movieProvider MovieProvider
	events        *events.EventBus
}

func NewService(store BookingsRepository, redis SimpleRedisClient, payment payment.Service, mailer Mailer, movieProvider MovieProvider, eventBus *events.EventBus) Service {
	return &bookingsService{
		store:         store,
		redisClient:   redis,
		payment:       payment,
		mailer:        mailer,
		movieProvider: movieProvider,
		events:        eventBus,
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
	cinemasCache := make(map[int]*cinema.Cinema)

	for _, session := range sessions {
		cinemaID := session.Room.CinemaID
		
		cinObj, ok := cinemasCache[cinemaID]
		if !ok {
			c, err := s.store.GetCinemaByID(ctx, cinemaID)
			if err != nil {
				continue
			}
			cinObj = c
			cinemasCache[cinemaID] = cinObj
		}

		if _, exists := groupedMap[cinemaID]; !exists {
			groupedMap[cinemaID] = &CinemaSessionsResponseDTO{
				CinemaID:   cinObj.ID,
				CinemaName: cinObj.Name,
				CinemaCity: cinObj.City,
				Sessions:   []SessionResponseDTO{},
			}
		}

		groupedMap[cinemaID].Sessions = append(groupedMap[cinemaID].Sessions, SessionResponseDTO{
			ID:          session.ID,
			StartTime:   session.StartTime,
			Price:       session.Price,
			RoomType:    string(session.Room.Type),
			SessionType: string(session.SessionType),
		})
	}

	var response []CinemaSessionsResponseDTO
	for _, v := range groupedMap {
		sort.Slice(v.Sessions, func(i, j int) bool {
			return v.Sessions[i].StartTime.Before(v.Sessions[j].StartTime)
		})
		response = append(response, *v)
	}

	sort.Slice(response, func(i, j int) bool {
		return response[i].CinemaName < response[j].CinemaName
	})

	return response, nil
}

func (s *bookingsService) GetSeatsBySession(ctx context.Context, sessionID int) ([]cinema.Seat, error) {
	return s.store.GetSeatsBySession(ctx, sessionID)
}

func (s *bookingsService) GetSessionByID(ctx context.Context, sessionID int) (*cinema.Session, error) {
	return s.store.GetSessionByID(ctx, sessionID)
}

func (s *bookingsService) ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []TicketRequest) (*Transaction, error) {
	var lockedAssets []string

	for _, tReq := range ticketsReq {
		if tReq.SeatID <= 0 {
			return nil, errors.New("SeatID deve ser um número positivo")
		}
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

	if session.Room.Type == cinema.RoomTypeVIP {
		basePrice = int(float64(basePrice) * 1.5)
	} else if session.Room.Type == cinema.RoomTypeIMAX {
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
		if err := s.store.PayTransaction(ctx, transactionID, userID, "FREE", "FREE"); err != nil {
			return "", errors.New("erro ao processar reserva gratuita")
		}

		if s.events != nil {
			s.events.Publish(events.EventTicketPurchased, events.Data{
				"transaction_id": transactionID,
				"user_id":        userID,
				"user_name":      transaction.User.Name,
				"user_email":     transaction.User.Email,
				"is_free":        true,
				"tickets":        transaction.Tickets,
			})
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
	ticket, err := s.store.GetTicketDetail(ctx, ticketID, userID)
	if err != nil {
		return err
	}

	if ticket.Status == TicketStatusPaid && ticket.Transaction.PaymentID != "" {
		bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := s.payment.RefundPayment(bgCtx, ticket.Transaction.PaymentID); err != nil {
			slog.Error("Falha ao processar estorno automático", "ticket_id", ticketID, "error", err)

		}
	}

	return s.store.CancelTicket(ctx, ticketID, userID)
}

func (s *bookingsService) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]TicketResponseDTO, error) {
	if status != "" && status != string(TicketStatusPaid) && status != string(TicketStatusPending) && status != string(TicketStatusCancelled) {
		return nil, ErrInvalidTicketStatus
	}

	tickets, err := s.store.GetUserTickets(ctx, userID, status)
	if err != nil {
		return nil, err
	}

	var response []TicketResponseDTO
	cinemasCache := make(map[int]string)
	moviesCache := make(map[int]string)

	for _, t := range tickets {
		movieName, ok := moviesCache[t.Session.MovieID]
		if !ok {
			movie, err := s.movieProvider.GetMovieDetails(ctx, t.Session.MovieID)
			if err == nil && movie != nil {
				movieName = movie.Title
			} else {
				movieName = "Desconhecido"
			}
			moviesCache[t.Session.MovieID] = movieName
		}
		
		cinemaName, ok := cinemasCache[t.Session.Room.CinemaID]
		if !ok {
			cinema, err := s.store.GetCinemaByID(ctx, t.Session.Room.CinemaID)
			if err == nil && cinema != nil {
				cinemaName = cinema.Name
			} else {
				cinemaName = "Desconhecido"
			}
			cinemasCache[t.Session.Room.CinemaID] = cinemaName
		}

		dto := TicketResponseDTO{
			ID:        t.ID,
			MovieName: movieName,
			Cinema:    cinemaName,
			Date:      t.Session.StartTime.Format("02/01/2006 15:04"),
			Room:      t.Session.Room.Name,
			Seat: func() string {
				if t.Seat != nil {
					return fmt.Sprintf("%s%d", t.Seat.Row, t.Seat.Number)
				}
				return "Geral"
			}(),
			Status: string(t.Status),
			QRCode: t.QRCode,
		}
		response = append(response, dto)
	}

	sort.Slice(response, func(i, j int) bool {
		ti, _ := time.Parse("02/01/2006 15:04", response[i].Date)
		tj, _ := time.Parse("02/01/2006 15:04", response[j].Date)
		return ti.After(tj)
	})

	return response, nil
}

func (s *bookingsService) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (TicketResponseDTO, error) {
	ticket, err := s.store.GetTicketDetail(ctx, ticketID, userID)
	if err != nil {
		return TicketResponseDTO{}, err
	}

	movieName := "Desconhecido"
	movie, err := s.movieProvider.GetMovieDetails(ctx, ticket.Session.MovieID)
	if err == nil && movie != nil {
		movieName = movie.Title
	}

	cinemaName := "Desconhecido"
	cinema, err := s.store.GetCinemaByID(ctx, ticket.Session.Room.CinemaID)
	if err == nil && cinema != nil {
		cinemaName = cinema.Name
	}

	dto := TicketResponseDTO{
		ID:        ticket.ID,
		MovieName: movieName,
		Cinema:    cinemaName,
		Date:      ticket.Session.StartTime.Format("02/01/2006 15:04"),
		Room:      ticket.Session.Room.Name,
		Seat: func() string {
			if ticket.Seat != nil {
				return fmt.Sprintf("%s%d", ticket.Seat.Row, ticket.Seat.Number)
			}
			return "Geral"
		}(),
		Status: string(ticket.Status),
		QRCode: ticket.QRCode,
	}

	return dto, err
}

func (s *bookingsService) ConfirmPaymentWebhook(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, paymentID string) error {
	err := s.store.PayTransaction(ctx, transactionID, userID, method, paymentID)
	if err != nil {
		return err
	}

	transaction, err := s.store.GetTransactionByID(ctx, transactionID, userID)
	if err != nil {
		return fmt.Errorf("erro ao recuperar transação paga: %w", err)
	}

	if s.events != nil {
		s.events.Publish(events.EventTicketPurchased, events.Data{
			"transaction_id": transactionID,
			"user_id":        userID,
			"user_name":      transaction.User.Name,
			"user_email":     transaction.User.Email,
			"is_free":        false,
			"payment_id":     paymentID,
			"tickets":        transaction.Tickets,
		})
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

func (s *bookingsService) AdminCancelTicket(ctx context.Context, ticketID uuid.UUID) error {
	ticket, err := s.store.AdminCancelTicket(ctx, ticketID)
	if err != nil {
		return err
	}

	if ticket.Status == TicketStatusCancelled && ticket.Transaction.PaymentID != "" && ticket.PricePaid > 0 {
		bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := s.payment.RefundPayment(bgCtx, ticket.Transaction.PaymentID); err != nil {
			slog.Error("Falha ao processar estorno admin", "ticket_id", ticketID, "payment_id", ticket.Transaction.PaymentID, "error", err)
		}
	}

	return nil
}

func (s *bookingsService) AdminCancelSession(ctx context.Context, sessionID int) error {
	tickets, err := s.store.GetTicketsBySession(ctx, sessionID)
	if err != nil {
		return err
	}

	var errors []error
	var cancelledCount int
	for _, t := range tickets {
		if t.Status != TicketStatusCancelled {
			if err := s.AdminCancelTicket(ctx, t.ID); err != nil {
				errors = append(errors, fmt.Errorf("ticket %s: %w", t.ID, err))
			} else {
				cancelledCount++
			}
		}
	}

	slog.Info("Cancelamento de sessão processado",
		"session_id", sessionID,
		"sucesso", cancelledCount,
		"falhas", len(errors),
	)

	if len(errors) > 0 {
		return fmt.Errorf("cancelamento parcial: %v", errors)
	}

	return nil
}

func (s *bookingsService) mapTicketToDTO(t Ticket, movieName, cinemaName string) TicketResponseDTO {
	return TicketResponseDTO{
		ID:        t.ID,
		MovieName: movieName,
		Cinema:    cinemaName,
		Date:      t.Session.StartTime.Format("02/01/2006 15:04"),
		Room:      t.Session.Room.Name,
		Seat: func() string {
			if t.Seat != nil {
				return fmt.Sprintf("%s%d", t.Seat.Row, t.Seat.Number)
			}
			return "Geral"
		}(),
		Status: string(t.Status),
		QRCode: t.QRCode,
		User: &UserBookingDTO{
			ID:    t.Transaction.User.ID.String(),
			Email: t.Transaction.User.Email,
			Name:  t.Transaction.User.Name,
		},
	}
}

func (s *bookingsService) GetTicketsBySession(ctx context.Context, sessionID int) ([]TicketResponseDTO, error) {
	tickets, err := s.store.GetTicketsBySession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if len(tickets) == 0 {
		return []TicketResponseDTO{}, nil
	}

	firstTicket := tickets[0]
	movieName := "Desconhecido"
	movie, err := s.movieProvider.GetMovieDetails(ctx, firstTicket.Session.MovieID)
	if err == nil && movie != nil {
		movieName = movie.Title
	}
	cinemaName := "Desconhecido"
	cinema, err := s.store.GetCinemaByID(ctx, firstTicket.Session.Room.CinemaID)
	if err == nil && cinema != nil {
		cinemaName = cinema.Name
	}

	var response []TicketResponseDTO
	for _, t := range tickets {
		response = append(response, s.mapTicketToDTO(t, movieName, cinemaName))
	}

	return response, nil
}
