package analytics

import (
	"context"
	"log/slog"
	"sort"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
)

type MovieProvider interface {
	GetMovieDetails(ctx context.Context, tmdbID int) (*movies.Movie, error)
}

type AnalyticsRepository interface {
	GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]DailyCinemaStats, error)
	GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]DailyMovieStats, error)
	GetGenreStats(ctx context.Context, start, end time.Time) (map[string]float64, error)
	GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStats, error)
	
	CalculateDailyStats(ctx context.Context, date time.Time) ([]DailyCinemaStats, error)
	UpsertDailyStats(ctx context.Context, stats []DailyCinemaStats) error
	CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]DailyMovieStats, error)
	UpsertDailyMovieStats(ctx context.Context, stats []DailyMovieStats) error
}

type AnalyticsService struct {
	repo          AnalyticsRepository
	movieProvider MovieProvider
}

func NewService(repo AnalyticsRepository, movieProvider MovieProvider) *AnalyticsService {
	return &AnalyticsService{
		repo:          repo,
		movieProvider: movieProvider,
	}
}

func (s *AnalyticsService) GetAnalytics(ctx context.Context, start, end time.Time) (*AnalyticsSummaryResponseDTO, error) {
	stats, err := s.repo.GetStatsByDateRange(ctx, start, end)
	if err != nil {
		return nil, err
	}

	var totalRev float64
	var totalTickets int
	var cinemaStats []DailyCinemaStatsResponseDTO

	for _, s := range stats {
		rev := float64(s.TotalRevenue) / 100.0
		totalRev += rev
		totalTickets += s.TicketsSold

		cinemaStats = append(cinemaStats, DailyCinemaStatsResponseDTO{
			Date:          s.Date,
			CinemaName:    s.Cinema.Name,
			TotalRevenue:  rev,
			TicketsSold:   s.TicketsSold,
			OccupancyRate: s.OccupancyRate,
		})
	}

	return &AnalyticsSummaryResponseDTO{
		StartDate:     start,
		EndDate:       end,
		GlobalRevenue: totalRev,
		GlobalTickets: totalTickets,
		StatsByCinema: cinemaStats,
	}, nil
}

func (s *AnalyticsService) GetMovieAnalytics(ctx context.Context, start, end time.Time) ([]MovieStatsDTO, error) {
	movieStats, err := s.repo.GetTopMoviesByDateRange(ctx, start, end, 10)
	if err != nil {
		return nil, err
	}

	var response []MovieStatsDTO
	for _, ms := range movieStats {
		movie, err := s.movieProvider.GetMovieDetails(ctx, ms.MovieID)
		title := "Filme Desconhecido"
		if err == nil {
			title = movie.Title
		}

		response = append(response, MovieStatsDTO{
			MovieID:      ms.MovieID,
			MovieTitle:   title,
			TotalRevenue: float64(ms.TotalRevenue) / 100.0,
			TicketsSold:  ms.TicketsSold,
		})
	}

	return response, nil
}

func (s *AnalyticsService) GetGenreAnalytics(ctx context.Context, start, end time.Time) ([]GenreStatsResponseDTO, error) {
	genreMap, err := s.repo.GetGenreStats(ctx, start, end)
	if err != nil {
		return nil, err
	}

	var response []GenreStatsResponseDTO
	for name, rev := range genreMap {
		response = append(response, GenreStatsResponseDTO{
			GenreName:    name,
			TotalRevenue: rev,
		})
	}

	sort.Slice(response, func(i, j int) bool {
		return response[i].TotalRevenue > response[j].TotalRevenue
	})

	return response, nil
}

func (s *AnalyticsService) GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStatsResponseDTO, error) {
	trends, err := s.repo.GetRevenueTrends(ctx, start, end, period)
	if err != nil {
		return nil, err
	}

	var response []DailyCinemaStatsResponseDTO
	for _, t := range trends {
		response = append(response, DailyCinemaStatsResponseDTO{
			Date:         t.Date,
			TotalRevenue: float64(t.TotalRevenue) / 100.0,
			TicketsSold:  t.TicketsSold,
		})
	}

	return response, nil
}

func (s *AnalyticsService) RunAnalyticsAggregation(ctx context.Context, date time.Time) error {
	cinemaStats, err := s.repo.CalculateDailyStats(ctx, date)
	if err == nil {
		s.repo.UpsertDailyStats(ctx, cinemaStats)
	}

	movieStats, err := s.repo.CalculateDailyMovieStats(ctx, date)
	if err == nil {
		s.repo.UpsertDailyMovieStats(ctx, movieStats)
	}

	slog.Info("[Job] Analytics consolidado", "cinemas", len(cinemaStats), "filmes", len(movieStats))
	return nil
}
