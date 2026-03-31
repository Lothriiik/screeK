package users

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	svc *UserService
}

func NewHandler(svc *UserService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Post("/users/register", h.CreateUser)
	r.Get("/users/search", h.SearchUsers)
	r.Get("/users/{id}", h.GetByID)
	r.Get("/users/{id}/stats", h.GetStats)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Put("/users/me", h.UpdateUser)
		r.Delete("/users/me", h.DeleteUser)
		r.Get("/users/me", h.GetMe)
		r.Post("/users/me/favorites/{tmdb_id}", h.AddFavorite)
		r.Delete("/users/me/favorites/{tmdb_id}", h.RemoveFavorite)
	})
}

// CreateUser godoc
// @Summary Registra um novo usuário
// @Description Cria um novo usuário no sistema com name, email, username e password.
// @Tags Users
// @Accept json
// @Produce json
// @Param user body CreateUserDTO true "Dados do Usuário"
// @Success 201 {object} UserDTO
// @Failure 400 {string} string "Erro na validação ou usuário já existe"
// @Router /users/register [post]
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var dto CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(ctx, h.svc); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	userModel := &User{
		ID:       uuid.New(),
		Name:     dto.Name,
		Username: dto.Username,
		Email:    dto.Email,
		Password: dto.Password,
	}

	if err := h.svc.CreateUser(ctx, userModel); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao criar usuário"})
		return
	}

	responseDTO := UserDTO{
		ID:       userModel.ID,
		Name:     userModel.Name,
		Username: userModel.Username,
	}

	httputil.WriteJSON(w, http.StatusCreated, responseDTO)
}

// SearchUsers godoc
// @Summary Busca usuários por nome ou username
// @Description Retorna uma lista de usuários que coincidem com o termo de busca 'q'.
// @Tags Users
// @Accept json
// @Produce json
// @Param q query string true "Termo de busca"
// @Success 200 {array} UserDTO
// @Failure 400 {string} string "Parâmetro 'q' obrigatório"
// @Router /users/search [get]
func (h *Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "O parâmetro 'q' (busca) é obrigatório"})
		return
	}

	users, err := h.svc.SearchUsers(r.Context(), q)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar usuários"})
		return
	}

	var dtos []UserDTO

	for _, user := range users {
		dtos = append(dtos, UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Name:     user.Name,
		})
	}

	httputil.WriteJSON(w, http.StatusOK, dtos)
}

// GetByID godoc
// @Summary Busca detalhes de um usuário pelo ID
// @Description Retorna o perfil público de um usuário, incluindo seus filmes favoritos.
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "ID do Usuário (UUID)"
// @Success 200 {object} UserDetailsDTO
// @Failure 404 {string} string "Usuário não encontrado"
// @Router /users/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID inválido. Use UUID"})
		return
	}
	user, err := h.svc.GetUserByID(r.Context(), id)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "Usuário não encontrado"})
		return
	}

	var favoriteMovies []movies.MovieDTO
	for _, movie := range user.FavoriteMovies {
		favoriteMovies = append(favoriteMovies, movies.MovieDTO{
			ID:        movie.ID,
			Title:     movie.Title,
			PosterURL: movie.PosterURL,
		})
	}

	userDTO := UserDetailsDTO{
		ID:             user.ID,
		Username:       user.Username,
		Name:           user.Name,
		Bio:            user.Bio,
		PhotoURL:       user.PhotoURL,
		Pronouns:       user.Pronouns,
		DefaultCity:    user.DefaultCity,
		FavoriteMovies: favoriteMovies,
	}

	httputil.WriteJSON(w, http.StatusOK, userDTO)
}

// GetMe godoc
// @Summary Retorna o perfil do usuário logado
// @Description Retorna os detalhes do usuário baseados no token JWT fornecido.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} UserDetailsDTO
// @Failure 401 {string} string "Não autorizado"
// @Router /users/me [get]
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	user, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar dados do perfil"})
		return
	}

	var favoriteMovies []movies.MovieDTO
	for _, movie := range user.FavoriteMovies {
		favoriteMovies = append(favoriteMovies, movies.MovieDTO{
			ID:        movie.ID,
			Title:     movie.Title,
			PosterURL: movie.PosterURL,
		})
	}

	userDTO := UserMeDetailsDTO{
		ID:             user.ID,
		Username:       user.Username,
		Name:           user.Name,
		Email:          user.Email,
		Bio:            user.Bio,
		PhotoURL:       user.PhotoURL,
		Pronouns:       user.Pronouns,
		DefaultCity:    user.DefaultCity,
		FavoriteMovies: favoriteMovies,
	}

	httputil.WriteJSON(w, http.StatusOK, userDTO)
}

// UpdateUser godoc
// @Summary Atualiza o perfil do usuário logado
// @Description Permite alterar Nome, Bio, Foto, Pronomes e Cidade do usuário autenticado.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param user body User true "Dados para atualização (ID é ignorado, usa-se o do Token)"
// @Success 200 {object} httputil.MessageResponse
// @Failure 401 {string} string "Não autorizado"
// @Router /users/me [put]
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	var dto UpdateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}

	if err := dto.Validate(); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "Usuário não encontrado"})
		return
	}

	if dto.Name != "" {
		user.Name = dto.Name
	}
	if dto.Bio != "" {
		user.Bio = dto.Bio
	}
	if dto.PhotoURL != "" {
		user.PhotoURL = dto.PhotoURL
	}
	if dto.Pronouns != "" {
		user.Pronouns = dto.Pronouns
	}
	if dto.DefaultCity != "" {
		user.DefaultCity = dto.DefaultCity
	}

	if err := h.svc.UpdateUser(r.Context(), user); err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao atualizar perfil"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Perfil atualizado com sucesso"})
}

// DeleteUser godoc
// @Summary Remove a conta do usuário logado
// @Description Deleta permanentemente o usuário. Exige confirmação de senha.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body object true "JSON com a senha"
// @Success 200 {object} httputil.MessageResponse
// @Failure 401 {string} string "Senha incorreta ou não autorizado"
// @Router /users/me [delete]
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "JSON inválido"})
		return
	}
	password := body.Password

	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	if err := h.svc.DeleteUser(r.Context(), userID, password); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, ErrInvalidPassword) {
			status = http.StatusUnauthorized
		}
		httputil.WriteJSON(w, status, httputil.ErrorResponse{Error: err.Error()})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Conta removida com sucesso"})
}

// AddFavorite godoc
// @Summary Adiciona um filme aos favoritos
// @Description Vincula um filme do TMDB ao perfil do usuário logado.
// @Tags Users
// @Security BearerAuth
// @Param tmdb_id path int true "ID do filme no TMDB"
// @Success 204 "No Content"
// @Failure 401 {string} string "Não autorizado"
// @Router /users/me/favorites/{tmdb_id} [post]
func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	tmdbID, err := strconv.Atoi(chi.URLParam(r, "tmdb_id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID TMDB inválido"})
		return
	}

	if err := h.svc.AddFavorite(r.Context(), userID, tmdbID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Filme adicionado aos favoritos"})
}

// RemoveFavorite godoc
// @Summary Remove um filme dos favoritos
// @Description Desvincula um filme do TMDB do perfil do usuário logado.
// @Tags Users
// @Security BearerAuth
// @Param tmdb_id path int true "ID do filme no TMDB"
// @Success 204 "No Content"
// @Failure 401 {string} string "Não autorizado"
// @Router /users/me/favorites/{tmdb_id} [delete]
func (h *Handler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Não autorizado"})
		return
	}

	tmdbID, err := strconv.Atoi(chi.URLParam(r, "tmdb_id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID TMDB inválido"})
		return
	}

	if err := h.svc.RemoveFavorite(r.Context(), userID, tmdbID); err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: err.Error()})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, httputil.MessageResponse{Message: "Filme removido dos favoritos"})
}

// GetStats godoc
// @Summary Retorna estatísticas do usuário
// @Description Retorna contadores de filmes, minutos assistidos e gênero favorito.
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "ID do Usuário (UUID)"
// @Success 200 {object} UserStats
// @Failure 404 {string} string "Estatísticas não encontradas"
// @Router /users/{id}/stats [get]
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "ID inválido"})
		return
	}

	stats, err := h.svc.GetUserStats(r.Context(), id)
	if err != nil {
		httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao buscar estatísticas"})
		return
	}

	if stats == nil {
		// Retornar objeto vazio/padrão em vez de 404 para melhor UX
		stats = &UserStats{UserID: id}
	}

	httputil.WriteJSON(w, http.StatusOK, stats)
}
