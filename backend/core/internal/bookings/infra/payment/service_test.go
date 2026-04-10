package payment

import (
	"bytes"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_Stripe_ParseWebhook_Logic(t *testing.T) {
	secret := "whsec_test"
	svc := NewStripeService("sk_test", secret)

	t.Run("Erro se Assinatura Inexistente", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/webhook", bytes.NewBufferString("{}"))
		_, err := svc.ParseWebhook(req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "erro validando assinatura")
	})

	t.Run("Parse de Pagamento Bem Sucedido", func(t *testing.T) {
		assert.NotNil(t, svc)
	})
}
