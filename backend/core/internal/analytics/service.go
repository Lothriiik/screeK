package analytics

import (
	"context"
	"log/slog"
	"sort"
	"time"
)

type AnalyticsService struct {
	repo           AnalyticsRepository
	movieProvider  MovieProvider
	cinemaProvider CinemaProvider
}

func NewService(repo AnalyticsRepository, movieProvider MovieProvider, cinemaProvider CinemaProvider) *AnalyticsService {
	return &AnalyticsService{
		repo:           repo,
		movieProvider:  movieProvider,
		cinemaProvider: cinemaProvider,
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

	for _, st := range stats {
		rev := float64(st.TotalRevenue) / 100.0
		totalRev += rev
		totalTickets += st.TicketsSold

		cinemaName := "Cinema Desconhecido"
		if s.cinemaProvider != nil {
			if c, err := s.cinemaProvider.GetCinemaByID(ctx, st.CinemaID); err == nil && c != nil {
				cinemaName = c.Name
			}
		}

		cinemaStats = append(cinemaStats, DailyCinemaStatsResponseDTO{
			Date:          st.Date,
			CinemaName:    cinemaName,
			TotalRevenue:  rev,
			TicketsSold:   st.TicketsSold,
			OccupancyRate: st.OccupancyRate,
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
		title := "Filme Desconhecido"
		if s.movieProvider != nil {
			if movie, err := s.movieProvider.GetMovieDetails(ctx, ms.MovieID); err == nil && movie != nil {
				title = movie.Title
			}
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
	if err != nil {
		return err
	}
	if err := s.repo.UpsertDailyStats(ctx, cinemaStats); err != nil {
		return err
	}

	movieStats, err := s.repo.CalculateDailyMovieStats(ctx, date)
	if err != nil {
		return err
	}
	if err := s.repo.UpsertDailyMovieStats(ctx, movieStats); err != nil {
		return err
	}

	slog.Info("Analytics consolidado", "job", "analytics_aggregation", "cinemas", len(cinemaStats), "movies", len(movieStats))
	return nil
}
