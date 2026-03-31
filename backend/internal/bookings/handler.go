package bookings

import (
	"encoding/json"
	"net/http"
	"strconv"


	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(s Service) *Handler {
	_ = movies.Movie{}
	return &Handler{
		service: s,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Get("/playing", h.GetMoviesPlaying)
	r.Get("/{id}/sessions", h.GetMovieSessions)
	r.Get("/sessions/{id}/seats", h.GetSeatsBySession)
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Post("/transactions/{id}/pay", h.PayReservation)
		r.Post("/tickets/reserve", h.ReserveTickets)
		r.Post("/tickets/{id}/cancel", h.CancelTicket)
		r.Get("/users/me/tickets", h.GetUserTickets)
		r.Get("/tickets/{id}", h.GetTicketDetail)
	})
}

// GetMoviesPlaying godoc
// @Summary Retorna os filmes em cartaz por cidade e data
// @Description Filtra filmes que possuem sessões ativas na cidade e data especificadas.
// @Tags Bookings
// @Accept json
// @Produce json
// @Param city query string true "Cidade (ex: Sorocaba)"
// @Param date query string true "Data (ex: 2024-10-25)"
// @Success 200 {array} movies.MovieDTO
// @Failure 400 {object} httputil.ErrorResponse "Parâmetros city e date são obrigatórios"
// @Router /playing [get]
func (h *Handler) GetMoviesPlaying(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Parâmetros 'city' e 'date' são obrigatórios (ex: ?city=Sorocaba&date=2024-10-25)"})
		return
	}

	moviesPlaying, err := h.service.GetMoviesPlaying(r.Context(), city, date)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar filmes em cartaz: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, moviesPlaying)
}

// GetMovieSessions godoc
// @Summary Busca sessões de um filme agrupadas por cinema
// @Description Filtra as sessões de um filme específico por cidade e data.
// @Tags Bookings
// @Accept json
// @Produce json
// @Param id path int true "ID do Filme (TMDB ID)"
// @Param city query string true "Cidade"
// @Param date query string true "Data"
// @Success 200 {array} CinemaSessionsResponseDTO
// @Failure 400 {object} httputil.ErrorResponse "ID do filme ou parâmetros de busca inválidos"
// @Router /{id}/sessions [get]
func (h *Handler) GetMovieSessions(w http.ResponseWriter, r *http.Request) {
	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID do filme inválido"})
		return
	}

	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Parâmetros 'city' e 'date' são obrigatórios"})
		return
	}

	response, err := h.service.GetMovieSessionsGroupedByCinema(r.Context(), movieID, city, date)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar sessões: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, response)
}

// GetSeatsBySession godoc
// @Summary Retorna o mapa de assentos de uma sessão
// @Description Lista todas as poltronas e indica quais estão ocupadas.
// @Tags Bookings
// @Accept json
// @Produce json
// @Param id path int true "ID da Sessão"
// @Success 200 {array} Seat
// @Failure 400 {object} httputil.ErrorResponse "ID da sessão inválido"
// @Router /sessions/{id}/seats [get]
func (h *Handler) GetSeatsBySession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID da sessão inválido"})
		return
	}

	seats, err := h.service.GetSeatsBySession(r.Context(), sessionID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar mapa de assentos: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, seats)
}

// ReserveTickets godoc
// @Summary Reserva assentos para uma sessão
// @Description Cria uma transação pendente e reserva as poltronas por 10 minutos via Redis Lock.
// @Tags Bookings
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param reserve body ReserveRequestDTO true "Detalhes da reserva"
// @Success 201 {object} ReserveResponseDTO
// @Failure 401 {object} httputil.ErrorResponse "Não autorizado"
// @Failure 409 {object} httputil.ErrorResponse "Conflito: assentos já ocupados ou expirados"
// @Router /tickets/reserve [post]
func (h *Handler) ReserveTickets(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	var dto ReserveRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	transaction, err := h.service.ReserveSeats(r.Context(), userID, dto.SessionID, dto.TicketsRequested)
	if err != nil {
		httputil.WriteJSON(w, http.StatusConflict, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, ReserveResponseDTO{
		Message:            "Reserva garantida por 10 minutos!",
		TransactionID:      transaction.ID,
		ValorTotalCentavos: transaction.TotalAmount,
	})
}

// PayReservation godoc
// @Summary Processa o pagamento de uma reserva
// @Description Gera um PaymentIntent no Stripe. Exige Idempotency-Key.
// @Tags Bookings
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "ID da Transação (UUID)"
// @Param pay body PayRequestDTO true "Método de pagamento"
// @Header 200 {string} Idempotency-Key "Chave de Idempotência"
// @Success 200 {object} PayResponseDTO
// @Failure 401 {object} httputil.ErrorResponse "Não autorizado"
// @Failure 400 {object} httputil.ErrorResponse "Erro na transação ou idempotência"
// @Router /transactions/{id}/pay [post]
func (h *Handler) PayReservation(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	transactionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de transação inválido"})
		return
	}

	idempotencyKey := r.Header.Get("Idempotency-Key")
	if idempotencyKey == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Cabeçalho Idempotency-Key ausente"})
		return
	}

	var dto PayRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	clientSecret, err := h.service.PayReservation(r.Context(), transactionID, userID, dto.PaymentMethod, idempotencyKey)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, PayResponseDTO{
		Message:      "Intenção de pagamento gerada com sucesso",
		ClientSecret: clientSecret,
	})
}

// CancelTicket godoc
// @Summary Cancela um ingresso e solicita estorno
// @Description Libera a poltrona e altera o status do ticket para CANCELLED.
// @Tags Bookings
// @Security BearerAuth
// @Param id path int true "ID do Ticket"
// @Success 200 {object} httputil.MessageResponse
// @Failure 401 {object} httputil.ErrorResponse "Não autorizado"
// @Router /tickets/{id}/cancel [post]
func (h *Handler) CancelTicket(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	ticketID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID do ticket inválido"})
		return
	}

	err = h.service.CancelTicket(r.Context(), ticketID, userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Pedido de cancelamento processado com sucesso"})
}

// GetUserTickets godoc
// @Summary Lista ingressos do usuário logado
// @Description Retorna o histórico de compras do usuário. Filtro opcional por status.
// @Tags Bookings
// @Security BearerAuth
// @Param status query string false "Status (PAID, CANCELLED, etc)"
// @Success 200 {array} TicketResponseDTO
// @Failure 401 {object} httputil.ErrorResponse "Não autorizado"
// @Router /users/me/tickets [get]
func (h *Handler) GetUserTickets(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	status := r.URL.Query().Get("status")

	tickets, err := h.service.GetUserTickets(r.Context(), userID, status)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, tickets)
}

// GetTicketDetail godoc
// @Summary Detalhes de um ingresso específico
// @Description Retorna informações completas do ticket, incluindo o QR Code para entrada.
// @Tags Bookings
// @Security BearerAuth
// @Param id path int true "ID do Ticket"
// @Success 200 {object} TicketResponseDTO
// @Failure 401 {object} httputil.ErrorResponse "Não autorizado"
// @Router /tickets/{id} [get]
func (h *Handler) GetTicketDetail(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	ticketID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID do ingresso inválido"})
		return
	}

	ticket, err := h.service.GetTicketDetail(r.Context(), ticketID, userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, ticket)
}
