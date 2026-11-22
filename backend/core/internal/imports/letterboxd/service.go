package letterboxd

import (
	"context"
	"encoding/csv"
	"io"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

// parseTitleYear extrai Nome/Ano das colunas do export do Letterboxd
// (Date,Name,Year,...). Linhas curtas ou sem título são ignoradas.
func parseTitleYear(record []string) (string, int, bool) {
	if len(record) < 3 {
		return "", 0, false
	}
	name := strings.TrimSpace(record[1])
	if name == "" {
		return "", 0, false
	}
	year, _ := strconv.Atoi(strings.TrimSpace(record[2]))
	return name, year, true
}

type Service struct {
	matcher MovieMatcher
	catalog CatalogProvider
}

func NewService(matcher MovieMatcher, catalog CatalogProvider) *Service {
	return &Service{
		matcher: matcher,
		catalog: catalog,
	}
}

type ImportSummary struct {
	Total   int `json:"total"`
	Success int `json:"success"`
	Failed  int `json:"failed"`
}

func (s *Service) ImportWatchedCSV(ctx context.Context, userID uuid.UUID, reader io.Reader) (*ImportSummary, error) {
	records, err := csv.NewReader(reader).ReadAll()
	if err != nil {
		return nil, err
	}

	summary := &ImportSummary{}
	if len(records) <= 1 {
		return summary, nil
	}

	for _, record := range records[1:] {
		summary.Total++
		name, year, ok := parseTitleYear(record)
		if !ok {
			summary.Failed++
			continue
		}

		movie, err := s.matcher.MatchMovieByTitleAndYear(ctx, name, year)
		if err != nil {
			summary.Failed++
			continue
		}

		err = s.catalog.LogMovie(ctx, userID, uint(movie.ID), 0, true, false)
		if err != nil {
			summary.Failed++
			continue
		}
		summary.Success++
	}

	return summary, nil
}

func (s *Service) ImportRatingsCSV(ctx context.Context, userID uuid.UUID, reader io.Reader) (*ImportSummary, error) {
	records, err := csv.NewReader(reader).ReadAll()
	if err != nil {
		return nil, err
	}

	summary := &ImportSummary{}
	if len(records) <= 1 {
		return summary, nil
	}

	for _, record := range records[1:] {
		summary.Total++
		name, year, ok := parseTitleYear(record)
		if !ok {
			summary.Failed++
			continue
		}
		// ratings.csv: Date,Name,Year,LetterboxdURI,Rating
		rating := 0.0
		if len(record) > 4 {
			rating, _ = strconv.ParseFloat(strings.TrimSpace(record[4]), 64)
		}

		movie, err := s.matcher.MatchMovieByTitleAndYear(ctx, name, year)
		if err != nil {
			summary.Failed++
			continue
		}

		err = s.catalog.LogMovie(ctx, userID, uint(movie.ID), rating, true, false)
		if err != nil {
			summary.Failed++
			continue
		}
		summary.Success++
	}

	return summary, nil
}

func (s *Service) ImportWatchlistCSV(ctx context.Context, userID uuid.UUID, reader io.Reader) (*ImportSummary, error) {
	records, err := csv.NewReader(reader).ReadAll()
	if err != nil {
		return nil, err
	}

	summary := &ImportSummary{}
	if len(records) <= 1 {
		return summary, nil
	}

	for _, record := range records[1:] {
		summary.Total++
		name, year, ok := parseTitleYear(record)
		if !ok {
			summary.Failed++
			continue
		}

		movie, err := s.matcher.MatchMovieByTitleAndYear(ctx, name, year)
		if err != nil {
			summary.Failed++
			continue
		}

		err = s.catalog.AddToWatchlist(ctx, userID, uint(movie.ID))
		if err != nil {
			summary.Failed++
			continue
		}
		summary.Success++
	}

	return summary, nil
}
