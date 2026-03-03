package handlers

import (
	"net/http"
	"strconv"
	"github.com/labstack/echo/v4"
	"github.com/StartLivin/cine-pass/backend/internal/models"
	"github.com/StartLivin/cine-pass/backend/internal/store"
)

type UserHandler struct {
	store store.Storage
}

func NewUserHandler(store store.Storage) *UserHandler {
	return &UserHandler{store: store}
}

func (h *UserHandler) CreateUser(c echo.Context) error {
	user := models.User{}
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
	}
	if err := h.store.CreateUser(&user); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Erro ao criar usuário"})
	}
	return c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetByID(c echo.Context) error {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
    }
    user, err := h.store.GetUserByID(id)
    if err != nil {
        return c.JSON(http.StatusNotFound, map[string]string{"error": "Usuário não encontrado"})
    }
    return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
    }
    user := models.User{ID: id}
    if err := c.Bind(&user); err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
    }
    if err := h.store.UpdateUser(&user); err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Erro ao atualizar usuário"})
    }
    return c.JSON(http.StatusOK, map[string]string{"message": "Usuário atualizado com sucesso"})
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
    idParam := c.Param("id")
    id, err := strconv.Atoi(idParam)
    if err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID inválido. Use números"})
    }
    if err := h.store.DeleteUser(id); err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Erro ao deletar usuário"})
    }
    return c.JSON(http.StatusOK, map[string]string{"message": "Usuário deletado com sucesso"})
}
