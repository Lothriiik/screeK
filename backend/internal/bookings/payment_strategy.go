package bookings

import (
	"context"
	"fmt"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
)

type PaymentResult struct {
	ClientSecret  string
	TransactionID string
}

type PaymentProcessor interface {
	CreatePaymentIntent(ctx context.Context, amount int, currency string, idempotencyKey string, metadata map[string]string) (*PaymentResult, error)
}

type StripeProcessor struct {
	apiKey string
}

func NewStripeProcessor(apiKey string) *StripeProcessor {
	stripe.Key = apiKey
	return &StripeProcessor{
		apiKey: apiKey,
	}
}

func (s *StripeProcessor) CreatePaymentIntent(ctx context.Context, amount int, currency string, idempotencyKey string, metadata map[string]string) (*PaymentResult, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(amount)),
		Currency: stripe.String(currency),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
            Enabled: stripe.Bool(true),
            AllowRedirects: stripe.String("never"),
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

	return &PaymentResult{
		ClientSecret:  pi.ClientSecret,
		TransactionID: pi.ID,
	}, nil
}
