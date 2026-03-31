package bookings

import (
	"log"
	"net/http"

	"github.com/StartLivin/screek/backend/internal/payment"
	"github.com/google/uuid"
)

type WebhookHandler struct {
	svc        Service
	paymentSvc payment.Service
}

func NewWebhookHandler(svc Service, paymentSvc payment.Service) *WebhookHandler {
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

	isNew, err := h.svc.SetPaymentProcessedNX(r.Context(), event.PaymentID)
	if err != nil || !isNew {
		log.Printf("Webhook Ignorado ou Erro: Pagamento %s já processado ou erro Redis: %v\n", event.PaymentID, err)
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
			h.svc.DeletePaymentLock(r.Context(), event.PaymentID)
			http.Error(w, "Erro interno de pagamento", http.StatusInternalServerError)
			return
		}

		log.Printf("Pago com sucesso! TX: %s\n", txID.String())
	}

	w.WriteHeader(http.StatusOK)
}
