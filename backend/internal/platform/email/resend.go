package email

import (
	"fmt"
	"github.com/resend/resend-go/v2"
)

type Mailer interface {
	SendTicketEmail(to, userName, qrCode string) error
}

type ResendClient struct {
	client *resend.Client
}

func NewResendClient(apiKey string) *ResendClient {
	return &ResendClient{client: resend.NewClient(apiKey)}
}

func (r *ResendClient) SendTicketEmail(to, userName, qrCode string) error {
	params := &resend.SendEmailRequest{
		From:    "screeK <onboarding@resend.dev>", 
		To:      []string{to},
		Subject: "Seu ingresso screeK está garantido! 🍿",
		Html:    fmt.Sprintf("<p>Olá %s,</p><p>Sua compra foi aprovada! Aqui está o QRCode do seu ingresso:</p><p><strong>%s</strong></p><p>Apresente este código na entrada da Sessão.</p>", userName, qrCode),
	}
	
	_, err := r.client.Emails.Send(params)
	return err
}
