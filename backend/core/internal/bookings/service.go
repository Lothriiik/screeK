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
	"github.com/StartLivin/screek/backend/internal/users"
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

type UserProvider interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*users.User, error)
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
	userProvider  UserProvider
	events        *events.EventBus
}

func NewService(store BookingsRepository, redis SimpleRedisClient, payment payment.Service, mailer Mailer, movieProvider MovieProvider, userProvider UserProvider, eventBus *events.EventBus) Service {
	return &bookingsService{
		store:         store,
		redisClient:   redis,
		payment:       payment,
		mailer:        mailer,
		movieProvider: movieProvider,
		userProvider:  userProvider,
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
			userName, userEmail := s.fetchUserInfo(ctx, userID)
			var eventItems []events.TicketPurchasedItem
			tickets, _ := s.store.GetUserTickets(ctx, userID, string(TicketStatusPaid))
			for _, t := range tickets {
				if t.TransactionID == transactionID {
					eventItems = append(eventItems, events.TicketPurchasedItem{
						TicketID: t.ID,
						QRCode:   t.QRCode,
					})
				}
			}

			s.events.Publish(events.EventTicketPurchased, events.TicketPurchasedEvent{
				TransactionID: transactionID,
				UserID:        userID,
				UserName:      userName,
				UserEmail:     userEmail,
				IsFree:        true,
				Tickets:       eventItems,
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
	sessionsCache := make(map[int]*cinema.Session)
	seatsCache := make(map[int]*cinema.Seat)

	for _, t := range tickets {
		session, ok := sessionsCache[t.SessionID]
		if !ok {
			session, _ = s.store.GetSessionByID(ctx, t.SessionID)
			sessionsCache[t.SessionID] = session
		}
		if session == nil {
			continue
		}

		movieName, ok := moviesCache[session.MovieID]
		if !ok {
			movie, err := s.movieProvider.GetMovieDetails(ctx, session.MovieID)
			if err == nil && movie != nil {
				movieName = movie.Title
			} else {
				movieName = "Desconhecido"
			}
			moviesCache[session.MovieID] = movieName
		}

		cinemaName, ok := cinemasCache[session.Room.CinemaID]
		if !ok {
			c, err := s.store.GetCinemaByID(ctx, session.Room.CinemaID)
			if err == nil && c != nil {
				cinemaName = c.Name
			} else {
				cinemaName = "Desconhecido"
			}
			cinemasCache[session.Room.CinemaID] = cinemaName
		}

		seatLabel := "Geral"
		if t.SeatID != nil {
			seat, ok := seatsCache[*t.SeatID]
			if !ok {
				seats, _ := s.store.GetSeatsBySession(ctx, t.SessionID)
				for i := range seats {
					seatsCache[seats[i].ID] = &seats[i]
				}
				seat = seatsCache[*t.SeatID]
			}
			if seat != nil {
				seatLabel = fmt.Sprintf("%s%d", seat.Row, seat.Number)
			}
		}

		dto := TicketResponseDTO{
			ID:        t.ID,
			MovieName: movieName,
			Cinema:    cinemaName,
			Date:      session.StartTime.Format("02/01/2006 15:04"),
			Room:      session.Room.Name,
			Seat:      seatLabel,
			Status:    string(t.Status),
			QRCode:    t.QRCode,
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

	session, _ := s.store.GetSessionByID(ctx, ticket.SessionID)

	movieName := "Desconhecido"
	cinemaName := "Desconhecido"
	roomName := ""
	date := ""

	if session != nil {
		movie, err := s.movieProvider.GetMovieDetails(ctx, session.MovieID)
		if err == nil && movie != nil {
			movieName = movie.Title
		}
		c, err := s.store.GetCinemaByID(ctx, session.Room.CinemaID)
		if err == nil && c != nil {
			cinemaName = c.Name
		}
		roomName = session.Room.Name
		date = session.StartTime.Format("02/01/2006 15:04")
	}

	seatLabel := "Geral"
	if ticket.SeatID != nil {
		seats, _ := s.store.GetSeatsBySession(ctx, ticket.SessionID)
		for _, seat := range seats {
			if seat.ID == *ticket.SeatID {
				seatLabel = fmt.Sprintf("%s%d", seat.Row, seat.Number)
				break
			}
		}
	}

	dto := TicketResponseDTO{
		ID:        ticket.ID,
		MovieName: movieName,
		Cinema:    cinemaName,
		Date:      date,
		Room:      roomName,
		Seat:      seatLabel,
		Status:    string(ticket.Status),
		QRCode:    ticket.QRCode,
	}

	return dto, nil
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
		userName, userEmail := s.fetchUserInfo(ctx, userID)
		var eventItems []events.TicketPurchasedItem
		for _, t := range transaction.Tickets {
			ticket, err := s.store.GetTicketDetail(ctx, t, userID)
			if err == nil {
				eventItems = append(eventItems, events.TicketPurchasedItem{
					TicketID: t,
					QRCode:   ticket.QRCode,
				})
			}
		}

		s.events.Publish(events.EventTicketPurchased, events.TicketPurchasedEvent{
			TransactionID: transactionID,
			UserID:        userID,
			UserName:      userName,
			UserEmail:     userEmail,
			IsFree:        false,
			PaymentID:     paymentID,
			Tickets:       eventItems,
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

func (s *bookingsService) GetTicketsBySession(ctx context.Context, sessionID int) ([]TicketResponseDTO, error) {
	tickets, err := s.store.GetTicketsBySession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if len(tickets) == 0 {
		return []TicketResponseDTO{}, nil
	}

	session, _ := s.store.GetSessionByID(ctx, sessionID)

	movieName := "Desconhecido"
	cinemaName := "Desconhecido"
	roomName := ""
	var startTime time.Time

	if session != nil {
		movie, err := s.movieProvider.GetMovieDetails(ctx, session.MovieID)
		if err == nil && movie != nil {
			movieName = movie.Title
		}
		c, err := s.store.GetCinemaByID(ctx, session.Room.CinemaID)
		if err == nil && c != nil {
			cinemaName = c.Name
		}
		roomName = session.Room.Name
		startTime = session.StartTime
	}

	seatsMap := make(map[int]*cinema.Seat)
	seats, _ := s.store.GetSeatsBySession(ctx, sessionID)
	for i := range seats {
		seatsMap[seats[i].ID] = &seats[i]
	}

	var response []TicketResponseDTO
	for _, t := range tickets {
		seatLabel := "Geral"
		if t.SeatID != nil {
			if seat, ok := seatsMap[*t.SeatID]; ok {
				seatLabel = fmt.Sprintf("%s%d", seat.Row, seat.Number)
			}
		}

		userDTO := s.fetchUserBookingDTO(ctx, t.Transaction.UserID)

		response = append(response, TicketResponseDTO{
			ID:        t.ID,
			MovieName: movieName,
			Cinema:    cinemaName,
			Date:      startTime.Format("02/01/2006 15:04"),
			Room:      roomName,
			Seat:      seatLabel,
			Status:    string(t.Status),
			QRCode:    t.QRCode,
			User:      userDTO,
		})
	}

	return response, nil
}

func (s *bookingsService) fetchUserInfo(ctx context.Context, userID uuid.UUID) (string, string) {
	user, err := s.userProvider.GetUserByID(ctx, userID)
	if err != nil || user == nil {
		return "Desconhecido", ""
	}
	return user.Name, user.Email
}

func (s *bookingsService) fetchUserBookingDTO(ctx context.Context, userID uuid.UUID) *UserBookingDTO {
	user, err := s.userProvider.GetUserByID(ctx, userID)
	if err != nil || user == nil {
		return nil
	}
	return &UserBookingDTO{
		ID:    user.ID.String(),
		Email: user.Email,
		Name:  user.Name,
	}
}
