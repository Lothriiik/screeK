package store

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/analytics"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var _ analytics.AnalyticsRepository = (*Store)(nil)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CalculateDailyStats(ctx context.Context, date time.Time) ([]analytics.DailyCinemaStats, error) {
	var stats []analytics.DailyCinemaStats

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

func (s *Store) UpsertDailyStats(ctx context.Context, stats []analytics.DailyCinemaStats) error {
	if len(stats) == 0 {
		return nil
	}

	records := make([]DailyCinemaStatsRecord, len(stats))
	for i, st := range stats {
		records[i] = DailyCinemaStatsRecord{
			Date:          st.Date,
			CinemaID:      st.CinemaID,
			TotalRevenue:  st.TotalRevenue,
			TicketsSold:   st.TicketsSold,
			OccupancyRate: st.OccupancyRate,
			CreatedAt:     st.CreatedAt,
		}
	}

	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "date"}, {Name: "cinema_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"total_revenue", "tickets_sold", "occupancy_rate"}),
	}).Create(&records).Error
}

func (s *Store) GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]analytics.DailyCinemaStats, error) {
	var records []DailyCinemaStatsRecord
	err := s.db.WithContext(ctx).
		Where("date BETWEEN ? AND ?", start, end).
		Order("date DESC, total_revenue DESC").
		Find(&records).Error
	return ToDailyCinemaStatsList(records), err
}

func (s *Store) CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]analytics.DailyMovieStats, error) {
	var stats []analytics.DailyMovieStats
	query := `
		SELECT 
			date(?) as date,
			s.movie_id,
			SUM(price_paid) as total_revenue,
			COUNT(t.id) as tickets_sold
		FROM tickets t
		JOIN sessions s ON t.session_id = s.id
		WHERE t.status = 'PAID' AND date(s.start_time) = date(?)
		GROUP BY s.movie_id
	`
	err := s.db.WithContext(ctx).Raw(query, date, date).Scan(&stats).Error
	return stats, err
}

func (s *Store) UpsertDailyMovieStats(ctx context.Context, stats []analytics.DailyMovieStats) error {
	if len(stats) == 0 {
		return nil
	}

	records := make([]DailyMovieStatsRecord, len(stats))
	for i, st := range stats {
		records[i] = DailyMovieStatsRecord{
			Date:         st.Date,
			MovieID:      st.MovieID,
			TotalRevenue: st.TotalRevenue,
			TicketsSold:  st.TicketsSold,
			CreatedAt:    st.CreatedAt,
		}
	}

	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "date"}, {Name: "movie_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"total_revenue", "tickets_sold"}),
	}).Create(&records).Error
}

func (s *Store) GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]analytics.DailyMovieStats, error) {
	var stats []analytics.DailyMovieStats
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

func (s *Store) GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]analytics.DailyCinemaStats, error) {
	var results []analytics.DailyCinemaStats
	queryMap := map[string]string{
		"month": `SELECT date_trunc('month', date) as period, SUM(total_revenue) as revenue FROM daily_cinema_stats WHERE date >= now() - interval '365 days' GROUP BY period ORDER BY period ASC;`,
		"year":  `SELECT date_trunc('year', date) as period, SUM(total_revenue) as revenue FROM daily_cinema_stats WHERE date >= now() - interval '365 days' GROUP BY period ORDER BY period ASC;`,
		"day":   `SELECT date_trunc('day', date) as period, SUM(total_revenue) as revenue FROM daily_cinema_stats WHERE date >= now() - interval '365 days' GROUP BY period ORDER BY period ASC;`,
	}

	query, ok := queryMap[period]
	if !ok {
		query = queryMap["day"]
	}

	err := s.db.WithContext(ctx).Raw(query).Scan(&results).Error
	return results, err
}
