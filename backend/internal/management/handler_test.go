package management_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/management"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestHandler_ManagementIntegration(t *testing.T) {
	db := testutil.SetupTestDB(t)
	
	db.Migrator().DropTable(&domain.CinemaManager{}, &domain.Session{}, &bookings.Ticket{}, &bookings.Transaction{})
	domain.AutoMigrate(db)
	movies.AutoMigrate(db)
	bookings.AutoMigrate(db)

	testutil.CleanupDB(t, db)
	
	store := management.NewStore(db)
	svc := management.NewService(store, nil)
	handler := management.NewHandler(svc)

	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	
	// Router com Mock Auth
	r := chi.NewRouter()
	authMW := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), httputil.UserIDKey, adminID)
			ctx = context.WithValue(ctx, httputil.UserRoleKey, httputil.RoleAdmin)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
	handler.RegisterRoutes(r, authMW)

	t.Run("Fluxo de Exclusão de Sessão", func(t *testing.T) {
		cinema := domain.Cinema{Name: "Handler Cinema", City: "City"}
		db.Create(&cinema)
		db.Create(&domain.CinemaManager{UserID: adminID, CinemaID: cinema.ID})
		
		room := domain.Room{CinemaID: cinema.ID, Name: "Room 1", Capacity: 10}
		db.Create(&room)

		// Criar filme real para evitar FK violation se houver constraints ativas
		movie := movies.Movie{ID: 1, Title: "Movie T", TMDBID: 777}
		db.Create(&movie)

		// Sessão com ingressos
		sess1 := domain.Session{RoomID: room.ID, MovieID: movie.ID, Price: 1000}
		db.Create(&sess1)
		
		user := users.User{ID: uuid.New(), Email: "handler@test.com", Username: "handler_test"}
		db.Create(&user)

		tx := bookings.Transaction{ID: uuid.New(), UserID: user.ID, Status: bookings.TicketStatusPaid}
		db.Create(&tx)
		ticket := bookings.Ticket{
			ID:            uuid.New(),
			TransactionID: tx.ID,
			SessionID:     sess1.ID,
			Status:        bookings.TicketStatusPaid,
			QRCode:        uuid.New().String(),
		}
		db.Create(&ticket)

		// Sessão vazia
		sess2 := domain.Session{RoomID: room.ID, MovieID: movie.ID, Price: 2000}
		db.Create(&sess2)

		// Teste 1: Tentativa de deletar sess1 (com tickets) -> 400 Bad Request
		req1 := httptest.NewRequest("DELETE", "/admin/sessions/"+strconv.Itoa(sess1.ID), nil)
		w1 := httptest.NewRecorder()
		r.ServeHTTP(w1, req1)
		assert.Equal(t, http.StatusBadRequest, w1.Code)

		// Teste 2: Tentativa de deletar sess2 (vazia) -> 200 OK
		req2 := httptest.NewRequest("DELETE", "/admin/sessions/"+strconv.Itoa(sess2.ID), nil)
		w2 := httptest.NewRecorder()
		r.ServeHTTP(w2, req2)
		assert.Equal(t, http.StatusOK, w2.Code)
		assert.Contains(t, w2.Body.String(), "Sessão excluída")
	})

	t.Run("Criação de Cinema via HTTP", func(t *testing.T) {
		payload := management.CreateCinemaRequest{
			Name:    "Novo Cinema HTTP",
			City:    "Cidade",
			Address: "Rua X",
			Phone:   "123",
			Email:   "cinema@test.com",
		}
		body, _ := json.Marshal(payload)
		
		req := httptest.NewRequest("POST", "/cinemas", bytes.NewBuffer(body))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
	})
}
