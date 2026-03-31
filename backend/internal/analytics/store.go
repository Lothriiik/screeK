package analytics

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CalculateDailyStats(ctx context.Context, date time.Time) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats

	query := `
		WITH session_occupancy AS (
			SELECT 
				s.id as session_id,
				r.cinema_id,
				r.capacity,
				COUNT(t.id) as tickets_count,
				COALESCE(SUM(t.price_paid), 0) as session_revenue
			FROM sessions s
			JOIN rooms r ON s.room_id = r.id
			LEFT JOIN tickets t ON t.session_id = s.id AND t.status = 'PAID'
			WHERE date(s.start_time) = date(?)
			GROUP BY s.id, r.cinema_id, r.capacity
		)
		SELECT 
			date(?) as date,
			cinema_id,
			SUM(session_revenue) as total_revenue,
			SUM(tickets_count) as tickets_sold,
			AVG(CAST(tickets_count AS FLOAT) / capacity) as occupancy_rate
		FROM session_occupancy
		GROUP BY cinema_id
	`

	err := s.db.WithContext(ctx).Raw(query, date, date).Scan(&stats).Error
	return stats, err
}

func (s *Store) UpsertDailyStats(ctx context.Context, stats []DailyCinemaStats) error {
	if len(stats) == 0 {
		return nil
	}
	return s.db.WithContext(ctx).Save(&stats).Error
}

func (s *Store) GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats
	err := s.db.WithContext(ctx).
		Preload("Cinema").
		Where("date BETWEEN ? AND ?", start, end).
		Order("date DESC, total_revenue DESC").
		Find(&stats).Error
	return stats, err
}

func (s *Store) CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]DailyMovieStats, error) {
	var stats []DailyMovieStats
	query := `
		SELECT 
			date(?) as date,
			movie_id,
			SUM(price_paid) as total_revenue,
			COUNT(id) as tickets_sold
		FROM tickets t
		JOIN sessions s ON t.session_id = s.id
		WHERE t.status = 'PAID' AND date(t.created_at) = date(?)
		GROUP BY movie_id
	`
	err := s.db.WithContext(ctx).Raw(query, date, date).Scan(&stats).Error
	return stats, err
}

func (s *Store) UpsertDailyMovieStats(ctx context.Context, stats []DailyMovieStats) error {
	if len(stats) == 0 {
		return nil
	}
	return s.db.WithContext(ctx).Save(&stats).Error
}

func (s *Store) GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]DailyMovieStats, error) {
	var stats []DailyMovieStats
	err := s.db.WithContext(ctx).
		Table("daily_movie_stats").
		Select("movie_id, SUM(total_revenue) as total_revenue, SUM(tickets_sold) as tickets_sold").
		Where("date BETWEEN ? AND ?", start, end).
		Group("movie_id").
		Order("total_revenue DESC").
		Limit(limit).
		Scan(&stats).Error
	return stats, err
}

func (s *Store) GetGenreStats(ctx context.Context, start, end time.Time) (map[string]float64, error) {
	type Result struct {
		Name    string
		Revenue int
	}
	var results []Result

	query := `
		SELECT g.name, SUM(ms.total_revenue) as revenue
		FROM daily_movie_stats ms
		JOIN movie_genres mg ON mg.movie_id = ms.movie_id
		JOIN genres g ON g.id = mg.genre_id
		WHERE ms.date BETWEEN ? AND ?
		GROUP BY g.name
	`
	err := s.db.WithContext(ctx).Raw(query, start, end).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	stats := make(map[string]float64)
	for _, r := range results {
		stats[r.Name] = float64(r.Revenue) / 100.0
	}
	return stats, nil
}

func (s *Store) GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats
	trunc := "day"
	if period == "month" {
		trunc = "month"
	} else if period == "year" {
		trunc = "year"
	}

	query := fmt.Sprintf(`
		SELECT date_trunc('%s', date) as date, SUM(total_revenue) as total_revenue, SUM(tickets_sold) as tickets_sold
		FROM daily_cinema_stats
		WHERE date BETWEEN ? AND ?
		GROUP BY 1
		ORDER BY 1 ASC
	`, trunc)

	err := s.db.WithContext(ctx).Raw(query, start, end).Scan(&stats).Error
	return stats, err
}
