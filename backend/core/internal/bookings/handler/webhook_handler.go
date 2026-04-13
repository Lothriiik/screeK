package handler

import (
	"log/slog"
	"net/http"

	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/bookings/infra/payment"
	"github.com/google/uuid"
)

type WebhookHandler struct {
	svc        bookings.Service
	paymentSvc payment.Service
}

func NewWebhookHandler(svc bookings.Service, paymentSvc payment.Service) *WebhookHandler {
	return &WebhookHandler{
		svc:        svc,
		paymentSvc: paymentSvc,
	}
}

func (h *WebhookHandler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	event, err := h.paymentSvc.ParseWebhook(r)
	if err != nil {
		slog.Error("Webhook Rejeitado", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	isNew, err := h.svc.SetPaymentProcessedNX(r.Context(), event.PaymentID)
	if err != nil || !isNew {
		slog.Warn("Webhook Ignorado ou Erro", "payment_id", event.PaymentID, "error", err)
		w.WriteHeader(http.StatusOK)
		return
	}

	if event.Type == payment.EventPaymentSucceeded {
		txIDStr := event.Metadata["booking_id"]
		userIDStr := event.Metadata["user_id"]
		method := event.Metadata["method"]

		txID, err := uuid.Parse(txIDStr)
		if err != nil || userIDStr == "" {
			slog.Error("Webhook [ERRO]: Metadados inválidos na Transaction", "metadata", event.Metadata)
			w.WriteHeader(http.StatusOK)
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			slog.Error("Webhook [ERRO]: UUID de usuário inválido")
			w.WriteHeader(http.StatusOK)
			return
		}

		err = h.svc.ConfirmPaymentWebhook(r.Context(), txID, userID, method, event.PaymentID)
		if err != nil {
			slog.Error("Erro ao confirmar pagamento, removendo lock para retry", "tx_id", txID, "error", err)
			h.svc.DeletePaymentLock(r.Context(), event.PaymentID)
			http.Error(w, "Erro interno", http.StatusInternalServerError)
			return
		}

		slog.Info("Pago com sucesso!", "tx_id", txID.String())
	}

	w.WriteHeader(http.StatusOK)
}
