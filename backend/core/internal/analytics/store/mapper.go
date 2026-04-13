package store

import (
	"github.com/StartLivin/screek/backend/internal/analytics"
)

func ToDailyCinemaStatsDomain(r *DailyCinemaStatsRecord) *analytics.DailyCinemaStats {
	if r == nil {
		return nil
	}
	return &analytics.DailyCinemaStats{
		ID:            r.ID,
		Date:          r.Date,
		CinemaID:      r.CinemaID,
		TotalRevenue:  r.TotalRevenue,
		TicketsSold:   r.TicketsSold,
		OccupancyRate: r.OccupancyRate,
		CreatedAt:     r.CreatedAt,
	}
}

func ToDailyCinemaStatsList(records []DailyCinemaStatsRecord) []analytics.DailyCinemaStats {
	list := make([]analytics.DailyCinemaStats, len(records))
	for i := range records {
		list[i] = *ToDailyCinemaStatsDomain(&records[i])
	}
	return list
}

func ToDailyMovieStatsDomain(r *DailyMovieStatsRecord) *analytics.DailyMovieStats {
	if r == nil {
		return nil
	}
	return &analytics.DailyMovieStats{
		ID:           r.ID,
		Date:         r.Date,
		MovieID:      r.MovieID,
		TotalRevenue: r.TotalRevenue,
		TicketsSold:  r.TicketsSold,
		CreatedAt:    r.CreatedAt,
	}
}

func ToDailyMovieStatsList(records []DailyMovieStatsRecord) []analytics.DailyMovieStats {
	list := make([]analytics.DailyMovieStats, len(records))
	for i := range records {
		list[i] = *ToDailyMovieStatsDomain(&records[i])
	}
	return list
}
