package analytics

import "time"

type DailyCinemaStatsResponseDTO struct {
	Date          time.Time `json:"date"`
	CinemaName    string    `json:"cinema_name"`
	TotalRevenue  float64   `json:"total_revenue"` 
	TicketsSold   int       `json:"tickets_sold"`
	OccupancyRate float64   `json:"occupancy_rate"`
}

type AnalyticsSummaryResponseDTO struct {
	StartDate      time.Time                     `json:"start_date"`
	EndDate        time.Time                     `json:"end_date"`
	GlobalRevenue  float64                       `json:"global_revenue"`
	GlobalTickets  int                           `json:"global_tickets"`
	StatsByCinema  []DailyCinemaStatsResponseDTO `json:"stats_by_cinema"`
}

type MovieStatsDTO struct {
	MovieID      int     `json:"movie_id"`
	MovieTitle   string  `json:"movie_title"`
	TotalRevenue float64 `json:"total_revenue"`
	TicketsSold  int     `json:"tickets_sold"`
}

type GenreStatsResponseDTO struct {
	GenreName    string  `json:"genre_name"`
	TotalRevenue float64 `json:"total_revenue"`
}
