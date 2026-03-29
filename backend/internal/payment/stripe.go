package payment

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
	"github.com/stripe/stripe-go/v78/webhook"
)

type StripeService struct {
	apiKey        string
	webhookSecret string
}

func NewStripeService(apiKey string, webhookSecret string) *StripeService {
	stripe.Key = apiKey
	return &StripeService{
		apiKey:        apiKey,
		webhookSecret: webhookSecret,
	}
}

func (s *StripeService) CreatePayment(ctx context.Context, amount int, currency string, metadata map[string]string, idempotencyKey string) (*PaymentResponse, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(amount)),
		Currency: stripe.String(currency),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	for k, v := range metadata {
		params.AddMetadata(k, v)
	}

	if idempotencyKey != "" {
		params.IdempotencyKey = stripe.String(idempotencyKey)
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar intenção na Stripe: %w", err)
	}

	return &PaymentResponse{
		ID:           pi.ID,
		ClientSecret: pi.ClientSecret,
	}, nil
}

func (s *StripeService) ParseWebhook(r *http.Request) (*Event, error) {
	const MaxBodyBytes = int64(65536)
	r.Body = http.MaxBytesReader(nil, r.Body, MaxBodyBytes)
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, fmt.Errorf("erro lendo corpo do webhook: %w", err)
	}

	sigHeader := r.Header.Get("Stripe-Signature")
	event, err := webhook.ConstructEvent(payload, sigHeader, s.webhookSecret)
	if err != nil {
		return nil, fmt.Errorf("erro validando assinatura do webhook: %w", err)
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return nil, fmt.Errorf("erro ao converter dados do webhook: %w", err)
		}

		return &Event{
			Type:       EventPaymentSucceeded,
			PaymentID:  pi.ID,
			Amount:     int(pi.Amount),
			Currency:   string(pi.Currency),
			Metadata:   pi.Metadata,
			OccurredAt: time.Unix(event.Created, 0),
		}, nil

	case "payment_intent.payment_failed":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return nil, fmt.Errorf("erro ao converter dados do webhook: %w", err)
		}

		return &Event{
			Type:       EventPaymentFailed,
			PaymentID:  pi.ID,
			Amount:     int(pi.Amount),
			Currency:   string(pi.Currency),
			Metadata:   pi.Metadata,
			OccurredAt: time.Unix(event.Created, 0),
		}, nil

	default:
		return nil, fmt.Errorf("tipo de evento não suportado: %s", event.Type)
	}
}
