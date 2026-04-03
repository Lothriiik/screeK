package email

import (
	"context"
	"fmt"
	"github.com/resend/resend-go/v2"
)

type Mailer interface {
	SendTicketEmail(ctx context.Context, to, userName, qrCode string) error
	SendPasswordReset(ctx context.Context, to, token string) error
}

type ResendClient struct {
	client *resend.Client
}

func NewResendClient(apiKey string) *ResendClient {
	return &ResendClient{client: resend.NewClient(apiKey)}
}

func (r *ResendClient) SendTicketEmail(ctx context.Context, to, userName, qrCode string) error {
	params := &resend.SendEmailRequest{
		From:    "screeK <onboarding@resend.dev>", 
		To:      []string{to},
		Subject: "Seu ingresso screeK está garantido! 🍿",
		Html:    fmt.Sprintf("<p>Olá %s,</p><p>Sua compra foi aprovada! Aqui está o QRCode do seu ingresso:</p><p><strong>%s</strong></p><p>Apresente este código na entrada da Sessão.</p>", userName, qrCode),
	}
	
	_, err := r.client.Emails.SendWithContext(ctx, params)
	return err
}

func (r *ResendClient) SendPasswordReset(ctx context.Context, to, token string) error {
	params := &resend.SendEmailRequest{
		From:    "screeK <onboarding@resend.dev>",
		To:      []string{to},
		Subject: "Recuperação de Senha - screeK 🔑",
		Html:    fmt.Sprintf("<p>Você solicitou a recuperação de senha.</p><p>Use o token abaixo para definir sua nova senha:</p><p><strong>%s</strong></p><p>Este token expira em 15 minutos.</p>", token),
	}

	_, err := r.client.Emails.SendWithContext(ctx, params)
	return err
}
