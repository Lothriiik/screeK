package bookings

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/webhook"
)

type WebhookHandler struct {
	svc          *BookingsService
	webhookSecret string
}

func NewWebhookHandler(svc *BookingsService, secret string) *WebhookHandler {
	return &WebhookHandler{
		svc:           svc,
		webhookSecret: secret,
	}
}

func (h *WebhookHandler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	const MaxBodyBytes = int64(65536)
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Erro ao ler payload", http.StatusServiceUnavailable)
		return
	}

	sigHeader := r.Header.Get("Stripe-Signature")
	event, err := webhook.ConstructEventWithOptions(payload, sigHeader, h.webhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Printf("Webhook Rejeitado (Assinatura Inválida): %v", err)
		http.Error(w, "Assinatura inválida", http.StatusBadRequest)
		return
	}

	if event.Type == "payment_intent.succeeded" {
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			log.Printf("Webhook Rejeitado (JSON Parse): %v", err)
			http.Error(w, "Erro no parse do JSON", http.StatusBadRequest)
			return
		}

		txIDStr := pi.Metadata["transaction_id"]
		userIDStr := pi.Metadata["user_id"]
		method := pi.Metadata["method"]

		txID, err := uuid.Parse(txIDStr)
		if err != nil || userIDStr == "" {
			log.Printf("Webhook: Metadados inválidos na Transaction: %v", pi.Metadata)
			w.WriteHeader(http.StatusOK)
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			log.Printf("Webhook: UUID Invalido")
			w.WriteHeader(http.StatusOK)
			return
		}

		err = h.svc.ConfirmPaymentWebhook(r.Context(), txID, userID, method)
		if err != nil {
			log.Printf("Webhook [ERRO CRÍTICO]: Erro ao processar pagamento %v\n", err)
			http.Error(w, "Erro interno de pagamento", http.StatusInternalServerError)
			return
		}

		log.Printf("Pago com sucesso! TX: %s\n", txID.String())
	}

	w.WriteHeader(http.StatusOK)
}
