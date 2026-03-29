package bookings

import (
	"log"
	"net/http"
	"time"

	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/google/uuid"
)

type WebhookHandler struct {
	svc        *BookingsService
	paymentSvc payment.Service
}

func NewWebhookHandler(svc *BookingsService, paymentSvc payment.Service) *WebhookHandler {
	return &WebhookHandler{
		svc:        svc,
		paymentSvc: paymentSvc,
	}
}

func (h *WebhookHandler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	event, err := h.paymentSvc.ParseWebhook(r)
	if err != nil {
		log.Printf("Webhook Rejeitado: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	lockKey := "payment_processed:" + event.PaymentID
	isNew := h.svc.redisClient.SetNX(r.Context(), lockKey, "processed", 24*time.Hour).Val()
	if !isNew {
		log.Printf("Webhook Ignorado: Pagamento %s já processado (Idempotência)\n", event.PaymentID)
		w.WriteHeader(http.StatusOK)
		return
	}

	if event.Type == payment.EventPaymentSucceeded {
		txIDStr := event.Metadata["booking_id"]
		userIDStr := event.Metadata["user_id"]
		method := event.Metadata["method"]

		txID, err := uuid.Parse(txIDStr)
		if err != nil || userIDStr == "" {
			log.Printf("Webhook [ERRO]: Metadados inválidos na Transaction: %v", event.Metadata)
			w.WriteHeader(http.StatusOK)
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			log.Printf("Webhook [ERRO]: UUID de usuário inválido")
			w.WriteHeader(http.StatusOK)
			return
		}

		err = h.svc.ConfirmPaymentWebhook(r.Context(), txID, userID, method)
		if err != nil {
			log.Printf("Webhook [ERRO CRÍTICO]: Erro ao processar pagamento %v\n", err)
			h.svc.redisClient.Del(r.Context(), lockKey)
			http.Error(w, "Erro interno de pagamento", http.StatusInternalServerError)
			return
		}

		log.Printf("Pago com sucesso! TX: %s\n", txID.String())
	}

	w.WriteHeader(http.StatusOK)
}
