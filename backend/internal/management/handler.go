package management

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ManagerHandler struct {
	service *ManagementService
}

func NewHandler(s *ManagementService) *ManagerHandler {
	return &ManagerHandler{service: s}
}

func (h *ManagerHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Use(httputil.CheckRole(httputil.RoleAdmin, httputil.RoleManager))

		r.Get("/admin/cinemas", h.ListCinemas)
		r.Get("/admin/cinemas/{id}", h.GetCinemaDetail)
		r.Get("/admin/sessions", h.ListSessions)
		r.Delete("/admin/sessions/{id}", h.DeleteSession)

		r.Post("/cinemas", h.CreateCinema)
		r.Post("/cinemas/{id}/rooms", h.CreateRoom)
		r.Post("/sessions", h.CreateSession)
	})
}

// @Summary Listar cinemas (Admin)
// @Description Retorna todos os cinemas cadastrados (Apenas Admin/Manager)
// @Tags Management
// @Produce json
// @Success 200 {array} CinemaAdminResponseDTO
// @Security BearerAuth
// @Router /admin/cinemas [get]
func (h *ManagerHandler) ListCinemas(w http.ResponseWriter, r *http.Request) {
	cinemas, err := h.service.ListCinemas(r.Context())
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, cinemas)
}

// @Summary Detalhes do cinema (Admin)
// @Description Retorna os dados completos de um cinema, incluindo salas
// @Tags Management
// @Param id path int true "ID do Cinema"
// @Produce json
// @Success 200 {object} domain.Cinema
// @Security BearerAuth
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

// @Summary Listar sessões administrativas
// @Description Consulta sessões de forma expandida para gestão
// @Tags Management
// @Param cinema_id query int true "ID do Cinema"
// @Param date query string false "Data YYYY-MM-DD"
// @Produce json
// @Success 200 {array} SessionAdminResponseDTO
// @Security BearerAuth
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

// @Summary Cadastrar cinema
// @Description Cria um novo cinema no sistema (Apenas Admin)
// @Tags Management
// @Accept json
// @Param request body CreateCinemaRequest true "Dados do cinema"
// @Success 201 {object} httputil.MessageResponse
// @Security BearerAuth
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

// @Summary Criar sala e assentos
// @Description Adiciona uma sala a um cinema e gera o mapa de assentos automaticamente
// @Tags Management
// @Accept json
// @Param id path int true "ID do Cinema"
// @Param request body CreateRoomRequest true "Configuração da sala"
// @Success 201 {object} httputil.MessageResponse
// @Security BearerAuth
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

// @Summary Agendar sessão
// @Description Cria uma nova sessão de filme em uma sala específica
// @Tags Management
// @Accept json
// @Param request body CreateSessionRequest true "Dados da sessão"
// @Success 201 {object} httputil.MessageResponse
// @Security BearerAuth
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

// @Summary Excluir sessão
// @Description Remove uma sessão do sistema, desde que não existam ingressos vendidos
// @Tags Management
// @Param id path int true "ID da Sessão"
// @Success 200 {object} httputil.MessageResponse
// @Security BearerAuth
// @Router /admin/sessions/{id} [delete]
func (h *ManagerHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	sessionID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	if err := h.service.DeleteSession(r.Context(), userID, sessionID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Sessão excluída com sucesso"})
}
