package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/cinema"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type MovieResponseDTO movies.MovieDTO

type SeatResponseDTO cinema.Seat

type Handler struct {
	service bookings.Service
}

func NewHandler(s bookings.Service) *Handler {
	return &Handler{
		service: s,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Route("/bookings", func(r chi.Router) {
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

			r.Route("/admin", func(r chi.Router) {
				r.Get("/sessions/{id}/tickets", h.GetTicketsBySession)
				r.Post("/tickets/{id}/cancel", h.AdminCancelTicket)
				r.Post("/sessions/{id}/cancel", h.AdminCancelSession)
			})
		})
	})
}

// @Summary Listar filmes em cartaz
// @Description Retorna todos os filmes que possuem sessões ativas na cidade e data informada
// @Tags Bookings
// @Param city query string true "Cidade do cinema"
// @Param date query string true "Data (format: YYYY-MM-DD)"
// @Produce json
// @Success 200 {array} MovieResponseDTO
// @Router /bookings/playing [get]
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

// @Summary Consultar sessões de um filme
// @Description Retorna as sessões de um filme agrupadas por cinema
// @Tags Bookings
// @Param id path int true "ID do filme (TMDB)"
// @Param city query string true "Cidade"
// @Param date query string true "Data"
// @Produce json
// @Success 200 {array} bookings.CinemaSessionsResponseDTO
// @Router /bookings/{id}/sessions [get]
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

// @Summary Mapa de assentos
// @Description Retorna todos os assentos de uma sessão e seu status de ocupação
// @Tags Bookings
// @Summary Mapa de assentos
// @Description Retorna todos os assentos de uma sessão e seu status de ocupação
// @Tags Bookings
// @Param id path int true "ID da sessão"
// @Produce json
// @Success 200 {array} SeatResponseDTO
// @Router /bookings/sessions/{id}/seats [get]
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

// @Summary Reservar assentos
// @Description Cria uma reserva temporária de 10 minutos para os assentos selecionados
// @Tags Bookings
// @Accept json
// @Produce json
// @Param request body bookings.ReserveRequestDTO true "Dados da reserva"
// @Success 201 {object} bookings.ReserveResponseDTO
// @Security BearerAuth
// @Router /bookings/tickets/reserve [post]
func (h *Handler) ReserveTickets(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	var dto bookings.ReserveRequestDTO
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
		if errors.Is(err, bookings.ErrSeatLockFailed) {
			httputil.WriteJSON(w, http.StatusConflict, httputil.ErrorResponse{Error: err.Error()})
			return
		}
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, bookings.ReserveResponseDTO{
		Message:            "Reserva garantida por 10 minutos!",
		TransactionID:      transaction.ID,
		ValorTotalCentavos: transaction.TotalAmount,
	})
}

// @Summary Pagar reserva
// @Description Processa o pagamento de uma reserva pendente via Stripe
// @Tags Bookings
// @Accept json
// @Produce json
// @Param id path string true "ID da Transação (UUID)"
// @Param idempotency-key header string true "Chave de Idempotência"
// @Param request body bookings.PayRequestDTO true "Método de pagamento"
// @Success 200 {object} bookings.PayResponseDTO
// @Security BearerAuth
// @Router /bookings/transactions/{id}/pay [post]
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

	var dto bookings.PayRequestDTO
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

	httputil.WriteJSON(w, http.StatusOK, bookings.PayResponseDTO{
		Message:      "Intenção de pagamento gerada com sucesso",
		ClientSecret: clientSecret,
	})
}

// @Summary Cancelar ingresso
// @Description Cancela um ingresso e processa estorno se aplicável
// @Tags Bookings
// @Param id path string true "ID do Ticket (UUID)"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /bookings/tickets/{id}/cancel [post]
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

// @Summary Meus ingressos
// @Description Retorna o histórico de ingressos do usuário autenticado
// @Tags Bookings
// @Param status query string false "Filtrar por status (PAID, PENDING, CANCELLED)"
// @Produce json
// @Success 200 {array} bookings.TicketResponseDTO
// @Security BearerAuth
// @Router /bookings/users/me/tickets [get]
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

// @Summary Detalhe do ingresso
// @Description Retorna informações detalhadas de um ingresso específico
// @Tags Bookings
// @Param id path string true "ID do Ticket (UUID)"
// @Produce json
// @Success 200 {object} bookings.TicketResponseDTO
// @Security BearerAuth
// @Router /bookings/tickets/{id} [get]
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

// @Summary Listar ingressos da sessão (Admin)
// @Description Retorna todos os ingressos vendidos para uma sessão específica
// @Tags Admin
// @Param id path int true "ID da Sessão"
// @Produce json
// @Success 200 {array} bookings.TicketResponseDTO
// @Security BearerAuth
// @Router /bookings/admin/sessions/{id}/tickets [get]
func (h *Handler) GetTicketsBySession(w http.ResponseWriter, r *http.Request) {
	sessionID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	tickets, err := h.service.GetTicketsBySession(r.Context(), sessionID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, tickets)
}

// @Summary Cancelar ingresso (Admin)
// @Description Cancela um ingresso sem restrição de tempo ou dono
// @Tags Admin
// @Param id path string true "ID do Ticket (UUID)"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /bookings/admin/tickets/{id}/cancel [post]
func (h *Handler) AdminCancelTicket(w http.ResponseWriter, r *http.Request) {
	ticketID, _ := uuid.Parse(chi.URLParam(r, "id"))
	if err := h.service.AdminCancelTicket(r.Context(), ticketID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Ingresso cancelado administrativamente"})
}

// @Summary Cancelar sessão por contingência (Admin)
// @Description Cancela todos os ingressos de uma sessão em caso de problemas técnicos no cinema
// @Tags Admin
// @Param id path int true "ID da Sessão"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /bookings/admin/sessions/{id}/cancel [post]
func (h *Handler) AdminCancelSession(w http.ResponseWriter, r *http.Request) {
	sessionID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.service.AdminCancelSession(r.Context(), sessionID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Sessão cancelada e ingressos processados"})
}
