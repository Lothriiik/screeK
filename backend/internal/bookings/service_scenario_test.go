package bookings

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/StartLivin/screek/backend/internal/platform/events"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCancelTicketWithRefund(t *testing.T) {
	repo := new(MockBookingsRepo)
	paySvc := new(MockPayment)
	bus := events.NewEventBus()
	service := NewService(repo, nil, paySvc, nil, nil, bus)

	userID := uuid.New()
	ticketID := uuid.New()
	sessionID := 1

	ticket := &Ticket{
		ID:        ticketID,
		SessionID: sessionID,
		Status:    "PAID",
		Session: domain.Session{
			StartTime: time.Now().Add(48 * time.Hour),
		},
		Transaction: Transaction{
			UserID:    userID,
			PaymentID: "pi_123",
		},
	}

	repo.On("GetTicketDetail", mock.Anything, ticketID, userID).Return(ticket, nil)
	repo.On("CancelTicket", mock.Anything, ticketID, userID).Return(nil)
	paySvc.On("RefundPayment", mock.Anything, "pi_123").Return(nil)

	err := service.CancelTicket(context.Background(), ticketID, userID)

	assert.NoError(t, err)
	repo.AssertExpectations(t)
	paySvc.AssertExpectations(t)
}

func TestConfirmPaymentWebhookPublishEvent(t *testing.T) {
	repo := new(MockBookingsRepo)
	bus := events.NewEventBus()
	service := NewService(repo, nil, nil, nil, nil, bus)

	transactionID := uuid.New()
	userID := uuid.New()
	
	transaction := &Transaction{
		ID:        transactionID,
		UserID:    userID,
		Status:    "PENDING",
		User: users.User{
			ID:    userID,
			Name:  "Test User",
			Email: "test@example.com",
		},
		Tickets: []Ticket{{ID: uuid.New(), QRCode: "123"}},
	}

	repo.On("GetTransactionByID", mock.Anything, transactionID, userID).Return(transaction, nil)
	repo.On("PayTransaction", mock.Anything, transactionID, userID, "STRIPE", "pi_456").Return(nil)

	eventReceived := make(chan bool, 1)
	bus.Subscribe(events.EventTicketPurchased, func(data events.Data) {
		assert.Equal(t, transactionID, data["transaction_id"])
		assert.Equal(t, "Test User", data["user_name"])
		eventReceived <- true
	})

	err := service.ConfirmPaymentWebhook(context.Background(), transactionID, userID, "STRIPE", "pi_456")

	assert.NoError(t, err)
	
	select {
	case <-eventReceived:
	case <-time.After(1 * time.Second):
		t.Fatal("Event TicketPurchased was not published")
	}

	repo.AssertExpectations(t)
}
