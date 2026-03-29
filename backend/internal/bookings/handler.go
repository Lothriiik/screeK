package bookings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service *BookingsService
}

func NewHandler(s *BookingsService) *Handler {
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

func (h *Handler) GetMoviesPlaying(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios (ex: ?city=Sorocaba&date=2024-10-25)"})
		return
	}

	moviesPlaying, err := h.service.GetMoviesPlaying(r.Context(), city, date)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar filmes em cartaz: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, moviesPlaying)
}

func (h *Handler) GetMovieSessions(w http.ResponseWriter, r *http.Request) {
	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID do filme inválido"})
		return
	}

	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios"})
		return
	}

	response, err := h.service.GetMovieSessionsGroupedByCinema(r.Context(), movieID, city, date)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar sessões: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, response)
}

func (h *Handler) GetSeatsBySession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID da sessão inválido"})
		return
	}

	seats, err := h.service.GetSeatsBySession(r.Context(), sessionID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar mapa de assentos: " + err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, seats)
}

func (h *Handler) ReserveTickets(w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value(httputil.UserIDKey)
	userID, ok := userIDAny.(uuid.UUID)
	if !ok {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	var dto ReserveRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	transaction, err := h.service.ReserveSeats(r.Context(), userID, dto.SessionID, dto.TicketsRequested)
	if err != nil {
		httputil.WriteJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
		return
	}

	resposta := map[string]any{
		"message":              "Reserva garantida por 10 minutos!",
		"transaction_id":       transaction.ID,
		"valor_total_centavos": transaction.TotalAmount,
	}
	httputil.WriteJSON(w, http.StatusCreated, resposta)

}

func (h *Handler) PayReservation(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado"})
		return
	}

	transactionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de transação inválido"})
		return
	}

	idempotencyKey := r.Header.Get("Idempotency-Key")
	if idempotencyKey == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "Cabeçalho Idempotency-Key ausente ou inválido"})
		return
	}

	var dto PayRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	clientSecret, err := h.service.PayReservation(r.Context(), transactionID, userID, dto.PaymentMethod, idempotencyKey)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]string{
		"message":       "Intenção de Pagamento gerada.",
		"client_secret": clientSecret,
	})
}

func (h *Handler) CancelTicket(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado ou token inválido"})
		return
	}

	ticketID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID do ticket inválido"})
		return
	}

	err = h.service.CancelTicket(r.Context(), ticketID, userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "Estorno processado. Ingresso Cancelado!"})
}

func (h *Handler) GetUserTickets(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado ou token inválido"})
		return
	}

	status := r.URL.Query().Get("status")

	tickets, err := h.service.GetUserTickets(r.Context(), userID, status)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, tickets)

}

func (h *Handler) GetTicketDetail(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado ou token inválido"})
		return
	}

	ticketID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de ingresso inválido"})
		return
	}

	ticket, err := h.service.GetTicketDetail(r.Context(), ticketID, userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, ticket)
}
