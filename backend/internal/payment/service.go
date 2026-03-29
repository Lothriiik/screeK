package payment

import (
	"context"
	"net/http"
	"time"
)

type EventType string

const (
	EventPaymentSucceeded EventType = "payment_succeeded"
	EventPaymentFailed    EventType = "payment_failed"
)

type PaymentResponse struct {
	ID           string `json:"id"`
	ClientSecret string `json:"client_secret"`
}

type Event struct {
	Type       EventType         `json:"type"`
	PaymentID  string            `json:"payment_id"`
	Amount     int               `json:"amount"`
	Currency   string            `json:"currency"`
	Metadata   map[string]string `json:"metadata"`
	OccurredAt time.Time         `json:"occurred_at"`
}

type Service interface {
	CreatePayment(ctx context.Context, amount int, currency string, metadata map[string]string, idempotencyKey string) (*PaymentResponse, error)
	ParseWebhook(r *http.Request) (*Event, error)
}
