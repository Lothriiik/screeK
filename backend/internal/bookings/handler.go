package bookings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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
	})
}

func (h *Handler) GetMoviesPlaying(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios (ex: ?city=Sorocaba&date=2024-10-25)"})
		return
	}

	moviesPlaying, err := h.service.GetMoviesPlaying(city, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar filmes em cartaz: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, moviesPlaying)
}

func (h *Handler) GetMovieSessions(w http.ResponseWriter, r *http.Request) {
	movieIDStr := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(movieIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID do filme inválido"})
		return
	}

	city := r.URL.Query().Get("city")
	date := r.URL.Query().Get("date")

	if city == "" || date == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Parâmetros 'city' e 'date' são obrigatórios"})
		return
	}

	response, err := h.service.GetMovieSessionsGroupedByCinema(movieID, city, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar sessões: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *Handler) GetSeatsBySession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := strconv.Atoi(sessionIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID da sessão inválido"})
		return
	}

	seats, err := h.service.GetSeatsBySession(sessionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Erro ao buscar mapa de assentos: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, seats)
}

func (h *Handler) ReserveTickets (w http.ResponseWriter, r *http.Request) {
	userIDAny := r.Context().Value("userID")
	userID, ok := userIDAny.(int)
	if !ok {
		http.Error(w, "Não autorizado", http.StatusUnauthorized)
		return
	}

	var dto ReserveRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	transaction, err := h.service.ReserveSeats(userID, dto.SessionID, dto.SeatIDs)
	if err != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "A cadeira já foi reservada!"})
		return
	}

	resposta := map[string]any{
		"message": "Reserva garantida por 10 minutos!",
		"transaction_id": transaction.ID,
		"valor_total_centavos": transaction.TotalAmount,
	}
	writeJSON(w, http.StatusCreated, resposta)

}

func (h *Handler) PayReservation(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado ou token inválido"})
		return
	}

	transactionID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID de transação inválido"})
		return
	}

	var dto PayRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	
	err = h.service.PayReservation(r.Context(), transactionID, userID, dto.PaymentMethod)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Pagamento aprovado com sucesso! Ingressos liberados."})
}

func (h *Handler) CancelTicket(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não logado ou token inválido"})
		return
	}

	ticketID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID do ticket inválido"})
		return
	}

	err = h.service.CancelTicket(r.Context(), ticketID, userID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Estorno processado. Ingresso Cancelado!"})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}