package bookings

import (
	"context"
	"log/slog"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

func StartWorkers(db *gorm.DB) {
	c := cron.New()
	repo := NewStore(db)

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
			slog.Info("[Worker] Limpeza concluída", 
				"tickets", ticketResult.RowsAffected, 
				"transações", txResult.RowsAffected)
		}
	})

	c.AddFunc("@midnight", func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		yesterday := time.Now().AddDate(0, 0, -1)
		
		slog.Info("[Worker] Iniciando agregação de analytics", "date", yesterday.Format("2006-01-02"))

		cinemaStats, err := repo.CalculateDailyStats(ctx, yesterday)
		if err == nil {
			repo.UpsertDailyStats(ctx, cinemaStats)
		}

		movieStats, err := repo.CalculateDailyMovieStats(ctx, yesterday)
		if err == nil {
			repo.UpsertDailyMovieStats(ctx, movieStats)
		}

		slog.Info("[Worker] Analytics consolidado com sucesso", 
			"cinemas", len(cinemaStats), 
			"filmes", len(movieStats))
	})

	c.Start()
	slog.Info("[Worker] Todos os jobs agendados com sucesso")
}