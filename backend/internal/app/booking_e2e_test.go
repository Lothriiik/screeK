package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/crypto"
	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_E2E_Fluxo_Venda_Gratuita(t *testing.T) {
	app, db, rct := SetupTestApp(t)
	_ = rct 

	hashedPassword, _ := crypto.HashPassword("super_password")
	adminID := uuid.New()
	adminUser := &users.User{
		ID:       adminID,
		Username: "super_admin",
		Email:    "admin@screek.com",
		Password: hashedPassword,
		Role:     httputil.RoleAdmin,
	}
	db.Create(adminUser)

	adminToken := loginHelper(t, app, "super_admin", "super_password")

	cineReq := bookings.CreateCinemaRequest{
		Name: "E2E Cinema Center", City: "Maceió", Address: "Av E2E", Phone: "123", Email: "e2e@cine.com",
	}
	rr := executeRequest(app.router, "POST", "/cinemas", cineReq, adminToken)
	require.Equal(t, http.StatusCreated, rr.Code)

	var cinemas []bookings.CinemaAdminResponseDTO
	rr = executeRequest(app.router, "GET", "/admin/cinemas", nil, adminToken)
	json.Unmarshal(rr.Body.Bytes(), &cinemas)
	cineID := cinemas[0].ID

	db.Exec("INSERT INTO cinema_managers (cinema_id, user_id) VALUES (?, ?)", cineID, adminID)

	roomReq := bookings.CreateRoomRequest{
		CinemaID: cineID, Name: "Sala 1", Capacity: 10, Type: "STANDARD",
	}
	rr = executeRequest(app.router, "POST", fmt.Sprintf("/cinemas/%d/rooms", cineID), roomReq, adminToken)
	require.Equal(t, http.StatusCreated, rr.Code)

	var cinemaDetail bookings.Cinema
	rr = executeRequest(app.router, "GET", fmt.Sprintf("/admin/cinemas/%d", cineID), nil, adminToken)
	json.Unmarshal(rr.Body.Bytes(), &cinemaDetail)
	roomID := cinemaDetail.Rooms[0].ID
	seatID := cinemaDetail.Rooms[0].Seats[0].ID

	movie := &movies.Movie{
		ID:          550,
		TMDBID:      550,
		Title:       "E2E Movie",
		Runtime:     120,
		Overview:    "Filme de teste E2E",
		PosterURL:   "https://test.com/poster.jpg",
		ReleaseDate: time.Now(),
		UpdatedAt:   time.Now(),
	}
	db.Create(movie)

	sessReq := bookings.CreateSessionRequest{
		MovieID: 550, RoomID: roomID, StartTime: time.Now().Add(24 * time.Hour), Price: 1000, SessionType: "REGULAR",
	}
	rr = executeRequest(app.router, "POST", "/sessions", sessReq, adminToken)
	require.Equal(t, http.StatusCreated, rr.Code)

	var sessions []bookings.SessionAdminResponseDTO
	rr = executeRequest(app.router, "GET", fmt.Sprintf("/admin/sessions?cinema_id=%d", cineID), nil, adminToken)
	json.Unmarshal(rr.Body.Bytes(), &sessions)
	sessionID := sessions[0].ID

	clientToken := loginHelper(t, app, "client_user", "password123")

	reserveReq := bookings.ReserveRequestDTO{
		SessionID: sessionID,
		TicketsRequested: []bookings.TicketRequest{
			{SeatID: seatID, Type: "FREE"},
		},
	}
	rr = executeRequest(app.router, "POST", "/tickets/reserve", reserveReq, clientToken)
	require.Equal(t, http.StatusCreated, rr.Code)
	
	var reserveResp bookings.ReserveResponseDTO
	json.Unmarshal(rr.Body.Bytes(), &reserveResp)
	txID := reserveResp.TransactionID

	payReq := bookings.PayRequestDTO{PaymentMethod: "FREE"}
	
	jsonData, _ := json.Marshal(payReq)
	req, _ := http.NewRequest("POST", "/transactions/"+txID.String()+"/pay", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+clientToken)
	req.Header.Set("Idempotency-Key", "e2e-test-key-"+txID.String())

	rr = httptest.NewRecorder()
	app.router.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)

	rr = executeRequest(app.router, "GET", "/users/me/tickets", nil, clientToken)
	require.Equal(t, http.StatusOK, rr.Code)

	var myTickets []bookings.TicketResponseDTO
	json.Unmarshal(rr.Body.Bytes(), &myTickets)

	assert.Len(t, myTickets, 1)
	assert.Equal(t, "E2E Movie", myTickets[0].MovieName)
	assert.Equal(t, "PAID", myTickets[0].Status)
	assert.NotEmpty(t, myTickets[0].QRCode)
}
