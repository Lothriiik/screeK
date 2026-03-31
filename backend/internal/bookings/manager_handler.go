package bookings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ManagerHandler struct {
	service Service
}

func NewManagerHandler(s Service) *ManagerHandler {
	return &ManagerHandler{service: s}
}

func (h *ManagerHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(httputil.CheckRole(httputil.RoleAdmin, httputil.RoleManager))

		// Consultas Admin/Manager
		r.Get("/admin/cinemas", h.ListCinemas)
		r.Get("/admin/cinemas/{id}", h.GetCinemaDetail)
		r.Get("/admin/sessions", h.ListSessions)

		// Ações de Escrita
		r.Post("/cinemas", h.CreateCinema)
		r.Post("/cinemas/{id}/rooms", h.CreateRoom)
		r.Post("/sessions", h.CreateSession)
	})
}

// ListCinemas godoc
// @Summary Lista todos os cinemas (Admin/Manager)
// @Description Retorna todos os cinemas cadastrados no sistema.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Produce json
// @Success 200 {array} CinemaAdminResponseDTO
// @Router /admin/cinemas [get]
func (h *ManagerHandler) ListCinemas(w http.ResponseWriter, r *http.Request) {
	cinemas, err := h.service.ListCinemas(r.Context())
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, cinemas)
}

// GetCinemaDetail godoc
// @Summary Detalhes de um cinema para administração
// @Description Retorna dados do cinema e suas salas.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Param id path int true "ID do Cinema"
// @Produce json
// @Success 200 {object} Cinema
// @Router /admin/cinemas/{id} [get]
func (h *ManagerHandler) GetCinemaDetail(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	cinema, err := h.service.GetCinemaByID(r.Context(), id)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "Cinema não encontrado"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, cinema)
}

// ListSessions godoc
// @Summary Lista sessões com filtros (Admin/Manager)
// @Description Permite ao gerente visualizar as sessões de um cinema específico em uma data.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Param cinema_id query int true "ID do Cinema"
// @Param date query string false "Data (YYYY-MM-DD)"
// @Produce json
// @Success 200 {array} SessionAdminResponseDTO
// @Router /admin/sessions [get]
func (h *ManagerHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	cinemaID, _ := strconv.Atoi(r.URL.Query().Get("cinema_id"))
	if cinemaID == 0 {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Parâmetro cinema_id é obrigatório"})
		return
	}
	date := r.URL.Query().Get("date")

	sessions, err := h.service.ListSessions(r.Context(), cinemaID, date)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, sessions)
}

// CreateCinema godoc
// @Summary Cria um novo cinema
// @Description Permite que administradores criem uma nova unidade de cinema.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param cinema body CreateCinemaRequest true "Dados do cinema"
// @Success 201 {object} httputil.MessageResponse
// @Router /cinemas [post]
func (h *ManagerHandler) CreateCinema(w http.ResponseWriter, r *http.Request) {
	var req CreateCinemaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}

	if err := h.service.CreateCinema(r.Context(), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, httputil.MessageResponse{Message: "Cinema cadastrado com sucesso!"})
}

// CreateRoom godoc
// @Summary Adiciona uma sala a um cinema
// @Description Cria uma nova sala e gera os assentos automaticamente baseados na capacidade.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "ID do Cinema"
// @Param room body CreateRoomRequest true "Dados da sala"
// @Success 201 {object} httputil.MessageResponse
// @Router /cinemas/{id}/rooms [post]
func (h *ManagerHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	cinemaID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if cinemaID == 0 {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID de cinema inválido"})
		return
	}

	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}
	req.CinemaID = cinemaID

	if err := h.service.CreateRoom(r.Context(), req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, httputil.MessageResponse{Message: "Sala vinculada e assentos gerados com sucesso!"})
}

// CreateSession godoc
// @Summary Agenda uma nova sessão
// @Description Cria uma sessão de filme em uma sala específica, validando conflitos de horário.
// @Tags Management (Cinemas)
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param session body CreateSessionRequest true "Dados da sessão"
// @Success 201 {object} httputil.MessageResponse
// @Failure 409 {object} httputil.ErrorResponse "Conflito de horário"
// @Router /sessions [post]
func (h *ManagerHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "Payload inválido"})
		return
	}

	if err := h.service.CreateSession(r.Context(), userID, req); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, httputil.MessageResponse{Message: "Sessão agendada com sucesso!"})
}
