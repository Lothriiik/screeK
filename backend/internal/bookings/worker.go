package bookings

import (
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)



func StartExpirationWorker(db *gorm.DB) {
	c := cron.New()

	c.AddFunc("@every 1m", func() {
		cutoff := time.Now().Add(-10 * time.Minute)

		ticketResult := db.Where(
			"transaction_id IN (SELECT id FROM transactions WHERE status = ? AND created_at < ?)",
			TicketStatusPending, cutoff,
		).Delete(&Ticket{})

		txResult := db.Where(
			"status = ? AND created_at < ?",
			TicketStatusPending, cutoff,
		).Delete(&Transaction{})

		total := ticketResult.RowsAffected + txResult.RowsAffected
		if total > 0 {
			log.Printf("[Worker] Expirados: %d tickets + %d transações",
				ticketResult.RowsAffected, txResult.RowsAffected)
		}
	})

	c.Start()
	log.Println("[Worker] Limpeza de ingressos pendentes por mais de 10 min iniciado (intervalo: 1 min)")

}