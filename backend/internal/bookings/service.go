package bookings

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/google/uuid"
	redisclient "github.com/redis/go-redis/v9"
)

var (
	ErrSeatLockFailed      = errors.New("uma ou mais cadeiras foram compradas por outro usuário")
	ErrInvalidTicketStatus = errors.New("query param 'status' inválido")
	ErrSessionOverlap     = errors.New("conflito de horário: a sala já possui uma sessão neste período")
	ErrNotCinemaManager   = errors.New("acesso negado: você não é gerente deste cinema")
)

type Mailer interface {
	SendTicketEmail(to, userName, qrCode string) error
}

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type BookingsService struct {
	store         BookingsRepository
	redisClient   *redisclient.Client
	payment       payment.Service
	mailer        Mailer
	movieProvider MovieProvider
}

func NewService(store BookingsRepository, redisClient *redisclient.Client, payment payment.Service, mailer Mailer, movieProvider MovieProvider) *BookingsService {
	return &BookingsService{
		store:         store,
		redisClient:   redisClient,
		payment:       payment,
		mailer:        mailer,
		movieProvider: movieProvider,
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

func (s *BookingsService) ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []TicketRequest) (*Transaction, error) {
	var lockedAssets []string

	for _, tReq := range ticketsReq {
		seat := fmt.Sprintf("seat:%d:%d", sessionID, tReq.SeatID)
		resultado := s.redisClient.SetNX(ctx, seat, userID, 10*time.Minute).Val()

		if !resultado {
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
	
	if session.Room.Type == RoomTypeVIP {
		basePrice = int(float64(basePrice) * 1.5)
	} else if session.Room.Type == RoomTypeIMAX {
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

func (s *BookingsService) PayReservation(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, idempotencyKey string) (string, error) {
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


func (s *BookingsService) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	return s.store.CancelTicket(ctx, ticketID, userID)
}


func (s *BookingsService) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]TicketResponseDTO, error) {
	
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

func (s *BookingsService) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (TicketResponseDTO, error) {
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

func (s *BookingsService) ConfirmPaymentWebhook(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error {
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

// --- Funções de Gerenciamento (Backoffice) ---

func (s *BookingsService) CreateCinema(ctx context.Context, req CreateCinemaRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	cinema := &Cinema{
		Name:    req.Name,
		Address: req.Address,
		City:    req.City,
		Phone:   req.Phone,
		Email:   req.Email,
	}

	return s.store.CreateCinema(ctx, cinema)
}

func (s *BookingsService) CreateRoom(ctx context.Context, req CreateRoomRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	room := &Room{
		CinemaID: req.CinemaID,
		Name:     req.Name,
		Capacity: req.Capacity,
		Type:     RoomType(req.Type),
	}

	// Geração automática de assentos (Grade aproximada)
	var seats []Seat
	cols := 10
	rows := (req.Capacity + cols - 1) / cols

	for r := 0; r < rows; r++ {
		rowLabel := string(rune('A' + r))
		for c := 1; c <= cols; c++ {
			if len(seats) >= req.Capacity {
				break
			}
			seats = append(seats, Seat{
				Row:    rowLabel,
				Number: c,
				PosX:   c * 40,
				PosY:   r * 40,
				Type:   "STANDARD",
			})
		}
	}

	return s.store.CreateRoom(ctx, room, seats)
}

func (s *BookingsService) CreateSession(ctx context.Context, userID uuid.UUID, req CreateSessionRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	room, err := s.store.GetRoomByID(ctx, req.RoomID)
	if err != nil {
		return errors.New("sala não encontrada")
	}

	// RBAC: Verifica se é gerente do cinema
	isManager, err := s.store.IsManagerOfCinema(ctx, userID, room.CinemaID)
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

	// Validação de Overlap
	existingSessions, err := s.store.GetSessionsByRoom(ctx, req.RoomID, req.StartTime)
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

	session := &Session{
		MovieID:     req.MovieID,
		RoomID:      req.RoomID,
		StartTime:   req.StartTime,
		Price:       req.Price,
		SessionType: SessionType(req.SessionType),
		IsFree:      req.Price == 0,
	}

	return s.store.CreateSession(ctx, session)
}

func (s *BookingsService) ListCinemas(ctx context.Context) ([]CinemaAdminResponseDTO, error) {
	cinemas, err := s.store.ListCinemas(ctx)
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

func (s *BookingsService) ListSessions(ctx context.Context, cinemaID int, date string) ([]SessionAdminResponseDTO, error) {
	sessions, err := s.store.ListSessions(ctx, cinemaID, date)
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