package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockService struct {
	mock.Mock
	bookings.Service
}

func (m *mockService) ReserveSeats(ctx context.Context, userID uuid.UUID, sessionID int, ticketsReq []bookings.TicketRequest) (*bookings.Transaction, error) {
	args := m.Called(ctx, userID, sessionID, ticketsReq)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*bookings.Transaction), args.Error(1)
}

func (m *mockService) PayReservation(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string, idempotencyKey string) (string, error) {
	args := m.Called(ctx, transactionID, userID, method, idempotencyKey)
	return args.String(0), args.Error(1)
}

func Test_ReserveTickets_Validation(t *testing.T) {
	svc := new(mockService)
	handler := NewHandler(svc)

	userID := uuid.New()

	tests := []struct {
		name           string
		body           interface{}
		expectedStatus int
	}{
		{
			name:           "Payload Vazio",
			body:           map[string]interface{}{"tickets": []interface{}{}},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Sessão ID Zero",
			body:           map[string]interface{}{"session_id": 0, "tickets": []map[string]interface{}{{"seat_id": 1, "type": "STANDARD"}}},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/bookings", bytes.NewBuffer(body))
			ctx := context.WithValue(req.Context(), httputil.UserIDKey, userID)
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()
			handler.ReserveTickets(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}

func Test_PayReservation_Headers(t *testing.T) {
	svc := new(mockService)
	handler := NewHandler(svc)
	userID := uuid.New()
	txID := uuid.New()

	t.Run("Idempotency-Key Ausente", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"payment_method": "card"})
		req := httptest.NewRequest("POST", "/bookings/"+txID.String()+"/pay", bytes.NewBuffer(body))
		req = req.WithContext(context.WithValue(req.Context(), httputil.UserIDKey, userID))

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", txID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		handler.PayReservation(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
		assert.Contains(t, rr.Body.String(), "Idempotency-Key")
	})

	t.Run("Idempotency-Key Presente Envia para Service", func(t *testing.T) {
		idemKey := "key-123"
		svc.On("PayReservation", mock.Anything, txID, userID, "card", idemKey).Return("secret_123", nil)

		body, _ := json.Marshal(map[string]string{"payment_method": "card"})
		req := httptest.NewRequest("POST", "/bookings/"+txID.String()+"/pay", bytes.NewBuffer(body))
		req.Header.Set("Idempotency-Key", idemKey)
		req = req.WithContext(context.WithValue(req.Context(), httputil.UserIDKey, userID))

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", txID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		handler.PayReservation(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		svc.AssertExpectations(t)
	})
}
