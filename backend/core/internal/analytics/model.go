package analytics

import (
	"time"
)

type DailyCinemaStats struct {
	ID            uint      `json:"id"`
	Date          time.Time `json:"date"`
	CinemaID      int       `json:"cinema_id"`
	TotalRevenue  int64     `json:"total_revenue"`
	TicketsSold   int       `json:"tickets_sold"`
	OccupancyRate float64   `json:"occupancy_rate"`
	CreatedAt     time.Time `json:"created_at"`
}

type DailyMovieStats struct {
	ID           uint      `json:"id"`
	Date         time.Time `json:"date"`
	MovieID      int       `json:"movie_id"`
	TotalRevenue int64     `json:"total_revenue"`
	TicketsSold  int       `json:"tickets_sold"`
	CreatedAt    time.Time `json:"created_at"`
}
