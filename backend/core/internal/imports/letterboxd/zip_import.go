package letterboxd

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"path"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

const (
	maxZipBytes         = 50 << 20
	maxZipExpandedBytes = 100 << 20
	maxZipEntries       = 2000
	maxFailureDetails   = 1000
)

// ImportFailure identifica o registro que precisa de revisão manual.
type ImportFailure struct {
	Source string `json:"source"`
	Name   string `json:"name"`
	Year   int    `json:"year"`
	Reason string `json:"reason"`
}

// ZipImportSummary resume a importação do export oficial do Letterboxd.
type ZipImportSummary struct {
	Watched              *ImportSummary  `json:"watched,omitempty"`
	Ratings              *ImportSummary  `json:"ratings,omitempty"`
	Likes                *ImportSummary  `json:"likes,omitempty"`
	Watchlist            *ImportSummary  `json:"watchlist,omitempty"`
	FailedItems          []ImportFailure `json:"failed_items,omitempty"`
	FailedItemsTruncated bool            `json:"failed_items_truncated,omitempty"`
	Errors               []string        `json:"errors,omitempty"`
}

// ZipImportProgress é publicado ao terminar cada bloco processado.
type ZipImportProgress struct {
	Stage     string            `json:"stage"`
	Processed int               `json:"processed"`
	Total     int               `json:"total"`
	Summary   *ZipImportSummary `json:"summary"`
}

type zipMovieTask struct {
	name           string
	year           int
	watched        bool
	liked          bool
	rating         float64
	hasRating      bool
	sourceRowCount map[string]int
}

type zipWatchlistTask struct {
	name string
	year int
	rows int
}

type zipMovieSave struct {
	movieID        int
	name           string
	year           int
	watched        bool
	liked          bool
	rating         float64
	sourceRowCount map[string]int
	failures       map[string]ImportFailure
}

type matchResult struct {
	movie *MatchedMovieSummary
	err   error
}

// ImportZip importa ratings, watched, likes e watchlist de um ZIP oficial.
// Os dados são associados ao usuário autenticado e persistidos em blocos.
func (s *Service) ImportZip(
	ctx context.Context,
	userID uuid.UUID,
	content []byte,
	chunkSize int,
	onProgress func(ZipImportProgress),
) (*ZipImportSummary, error) {
	if len(content) == 0 {
		return nil, fmt.Errorf("arquivo ZIP vazio")
	}
	if len(content) > maxZipBytes {
		return nil, fmt.Errorf("arquivo ZIP excede o limite de 50 MB")
	}
	if chunkSize <= 0 {
		chunkSize = 25
	}

	archive, err := zip.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		return nil, fmt.Errorf("ZIP inválido: %w", err)
	}
	if len(archive.File) > maxZipEntries {
		return nil, fmt.Errorf("ZIP contém arquivos demais")
	}

	entries := make(map[string]*zip.File)
	var expandedBytes uint64
	for _, file := range archive.File {
		if file.UncompressedSize64 > maxZipExpandedBytes-expandedBytes {
			return nil, fmt.Errorf("conteúdo descompactado do ZIP excede 100 MB")
		}
		expandedBytes += file.UncompressedSize64
		kind := letterboxdZipEntryKind(file.Name)
		if kind == "" || file.FileInfo().IsDir() {
			continue
		}
		if _, exists := entries[kind]; exists {
			return nil, fmt.Errorf("ZIP contém mais de um arquivo %s.csv", kind)
		}
		entries[kind] = file
	}
	if len(entries) == 0 {
		return nil, fmt.Errorf("ZIP não contém ratings.csv, watched.csv, watchlist.csv ou likes/films.csv")
	}

	result := &ZipImportSummary{Errors: []string{}, FailedItems: []ImportFailure{}}
	for kind := range entries {
		result.setSummary(kind, &ImportSummary{})
	}

	logTasks := make(map[string]*zipMovieTask)
	logOrder := make([]string, 0)
	watchlistTasks := make(map[string]*zipWatchlistTask)
	watchlistOrder := make([]string, 0)
	for _, kind := range []string{"watched", "ratings", "likes", "watchlist"} {
		file := entries[kind]
		if file == nil {
			continue
		}
		data, err := readZipEntry(file)
		if err != nil {
			result.Errors = append(result.Errors, kind+": "+err.Error())
			continue
		}
		records, columns, err := parseLetterboxdCSV(data, kind)
		if err != nil {
			result.Errors = append(result.Errors, kind+": "+err.Error())
			continue
		}
		summary := result.summary(kind)
		summary.Total = len(records)
		for _, record := range records {
			name := strings.TrimSpace(csvValue(record, columns.name))
			year, yearErr := strconv.Atoi(strings.TrimSpace(csvValue(record, columns.year)))
			if name == "" || yearErr != nil {
				summary.Failed++
				appendFailure(result, ImportFailure{Source: kind, Name: name, Year: year, Reason: "nome ou ano inválido"})
				continue
			}

			key := zipMovieKey(name, year)
			if kind == "watchlist" {
				task := watchlistTasks[key]
				if task == nil {
					task = &zipWatchlistTask{name: name, year: year}
					watchlistTasks[key] = task
					watchlistOrder = append(watchlistOrder, key)
				}
				task.rows++
				continue
			}

			rating := 0.0
			if kind == "ratings" {
				parsed, parseErr := strconv.ParseFloat(strings.TrimSpace(csvValue(record, columns.rating)), 64)
				if parseErr != nil || parsed < 0 || parsed > 5 {
					summary.Failed++
					appendFailure(result, ImportFailure{Source: kind, Name: name, Year: year, Reason: "nota inválida"})
					continue
				}
				rating = parsed
			}

			task := logTasks[key]
			if task == nil {
				task = &zipMovieTask{name: name, year: year, sourceRowCount: make(map[string]int)}
				logTasks[key] = task
				logOrder = append(logOrder, key)
			}
			task.sourceRowCount[kind]++
			switch kind {
			case "watched":
				task.watched = true
			case "ratings":
				task.watched = true
				task.rating = rating
				task.hasRating = true
			case "likes":
				task.liked = true
			}
		}
	}

	matchTotal := len(logOrder) + len(watchlistOrder)
	if matchTotal == 0 {
		if onProgress != nil {
			onProgress(ZipImportProgress{Stage: "complete", Processed: 1, Total: 1, Summary: cloneZipImportSummary(result)})
		}
		return result, nil
	}

	matchCache := make(map[string]matchResult)
	logSaves := make(map[int]*zipMovieSave)
	logSaveOrder := make([]int, 0)
	watchlistSaves := make(map[int]*zipWatchlistTask)
	watchlistSaveOrder := make([]int, 0)
	processed := 0
	matchOne := func(name string, year int) (*MatchedMovieSummary, error) {
		key := zipMovieKey(name, year)
		cached, exists := matchCache[key]
		if !exists {
			cached.movie, cached.err = s.matcher.MatchMovieByTitleAndYear(ctx, name, year)
			matchCache[key] = cached
		}
		if cached.err != nil {
			return nil, cached.err
		}
		if cached.movie == nil || cached.movie.ID <= 0 {
			return nil, fmt.Errorf("filme não encontrado no catálogo local ou no TMDB")
		}
		return cached.movie, nil
	}
	publish := func(stage string, done, total int) {
		if onProgress != nil {
			onProgress(ZipImportProgress{Stage: stage, Processed: done, Total: total, Summary: cloneZipImportSummary(result)})
		}
	}
	matchTask := func(name string, year int, rows map[string]int, signals *zipMovieTask) {
		defer func() {
			processed++
			if processed%chunkSize == 0 || processed == matchTotal {
				publish("matching", processed, matchTotal)
			}
		}()

		movie, err := matchOne(name, year)
		if err != nil {
			for kind, count := range rows {
				summary := result.summary(kind)
				summary.Failed += count
				appendFailure(result, ImportFailure{Source: kind, Name: name, Year: year, Reason: err.Error()})
			}
			return
		}
		if signals == nil {
			if existing := watchlistSaves[movie.ID]; existing != nil {
				existing.rows += rows["watchlist"]
			} else {
				watchlistSaves[movie.ID] = &zipWatchlistTask{name: name, year: year, rows: rows["watchlist"]}
				watchlistSaveOrder = append(watchlistSaveOrder, movie.ID)
			}
			return
		}

		save := logSaves[movie.ID]
		if save == nil {
			save = &zipMovieSave{
				movieID:        movie.ID,
				name:           name,
				year:           year,
				sourceRowCount: make(map[string]int),
				failures:       make(map[string]ImportFailure),
			}
			logSaves[movie.ID] = save
			logSaveOrder = append(logSaveOrder, movie.ID)
		}
		save.watched = save.watched || signals.watched
		save.liked = save.liked || signals.liked
		if signals.hasRating {
			save.rating = signals.rating
		}
		for kind, count := range rows {
			save.sourceRowCount[kind] += count
			if _, exists := save.failures[kind]; !exists {
				save.failures[kind] = ImportFailure{Source: kind, Name: name, Year: year}
			}
		}
	}

	publish("matching", 0, matchTotal)
	for _, key := range logOrder {
		task := logTasks[key]
		matchTask(task.name, task.year, task.sourceRowCount, task)
	}
	for _, key := range watchlistOrder {
		task := watchlistTasks[key]
		matchTask(task.name, task.year, map[string]int{"watchlist": task.rows}, nil)
	}

	saveTotal := len(logSaveOrder) + len(watchlistSaveOrder)
	for index, movieID := range logSaveOrder {
		save := logSaves[movieID]
		err := s.catalog.LogMovie(ctx, userID, uint(movieID), save.rating, save.watched, save.liked)
		for kind, count := range save.sourceRowCount {
			if err != nil {
				result.summary(kind).Failed += count
				failure := save.failures[kind]
				failure.Reason = err.Error()
				appendFailure(result, failure)
			} else {
				result.summary(kind).Success += count
			}
		}
		if (index+1)%chunkSize == 0 || index+1 == saveTotal {
			publish("saving", index+1, saveTotal)
		}
	}
	for index, movieID := range watchlistSaveOrder {
		task := watchlistSaves[movieID]
		err := s.catalog.AddToWatchlist(ctx, userID, uint(movieID))
		if err != nil {
			result.Watchlist.Failed += task.rows
			appendFailure(result, ImportFailure{Source: "watchlist", Name: task.name, Year: task.year, Reason: err.Error()})
		} else {
			result.Watchlist.Success += task.rows
		}
		completedSaves := len(logSaveOrder) + index + 1
		if completedSaves%chunkSize == 0 || completedSaves == saveTotal {
			publish("saving", completedSaves, saveTotal)
		}
	}

	if onProgress != nil {
		publish("complete", matchTotal, matchTotal)
	}
	return result, nil
}

func zipMovieKey(name string, year int) string {
	return strings.ToLower(strings.TrimSpace(name)) + "|" + strconv.Itoa(year)
}

func letterboxdZipEntryKind(name string) string {
	normalized := strings.ToLower(strings.Trim(strings.ReplaceAll(name, `\`, "/"), "/"))
	switch path.Base(normalized) {
	case "ratings.csv":
		return "ratings"
	case "watched.csv":
		return "watched"
	case "watchlist.csv":
		return "watchlist"
	case "likes.csv":
		return "likes"
	case "films.csv":
		if strings.Contains("/"+normalized, "/likes/") {
			return "likes"
		}
	}
	return ""
}

func readZipEntry(file *zip.File) ([]byte, error) {
	if file.UncompressedSize64 > maxZipExpandedBytes {
		return nil, fmt.Errorf("arquivo interno excede o limite descompactado")
	}
	reader, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer reader.Close()
	data, err := io.ReadAll(io.LimitReader(reader, int64(maxZipExpandedBytes)+1))
	if err != nil {
		return nil, err
	}
	if len(data) > maxZipExpandedBytes {
		return nil, fmt.Errorf("arquivo interno excede o limite descompactado")
	}
	return data, nil
}

type letterboxdCSVColumns struct {
	name   int
	year   int
	rating int
}

func parseLetterboxdCSV(data []byte, kind string) ([][]string, letterboxdCSVColumns, error) {
	reader := csv.NewReader(bytes.NewReader(data))
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		return nil, letterboxdCSVColumns{}, err
	}
	if len(records) == 0 {
		return nil, letterboxdCSVColumns{}, nil
	}

	columns := letterboxdCSVColumns{name: -1, year: -1, rating: -1}
	for index, header := range records[0] {
		header = strings.TrimPrefix(strings.TrimSpace(header), "\ufeff")
		switch strings.ToLower(header) {
		case "name":
			columns.name = index
		case "year":
			columns.year = index
		case "rating":
			columns.rating = index
		}
	}
	if columns.name < 0 || columns.year < 0 {
		return nil, letterboxdCSVColumns{}, fmt.Errorf("%s.csv precisa ter colunas Name e Year", kind)
	}
	if kind == "ratings" && columns.rating < 0 {
		return nil, letterboxdCSVColumns{}, fmt.Errorf("ratings.csv precisa ter coluna Rating")
	}
	return records[1:], columns, nil
}

func csvValue(record []string, index int) string {
	if index < 0 || index >= len(record) {
		return ""
	}
	return record[index]
}

func appendFailure(result *ZipImportSummary, failure ImportFailure) {
	if len(result.FailedItems) >= maxFailureDetails {
		result.FailedItemsTruncated = true
		return
	}
	result.FailedItems = append(result.FailedItems, failure)
}

func cloneZipImportSummary(source *ZipImportSummary) *ZipImportSummary {
	clone := &ZipImportSummary{
		FailedItemsTruncated: source.FailedItemsTruncated,
		FailedItems:          append([]ImportFailure(nil), source.FailedItems...),
		Errors:               append([]string(nil), source.Errors...),
	}
	if source.Watched != nil {
		copy := *source.Watched
		clone.Watched = &copy
	}
	if source.Ratings != nil {
		copy := *source.Ratings
		clone.Ratings = &copy
	}
	if source.Likes != nil {
		copy := *source.Likes
		clone.Likes = &copy
	}
	if source.Watchlist != nil {
		copy := *source.Watchlist
		clone.Watchlist = &copy
	}
	return clone
}

func (result *ZipImportSummary) summary(kind string) *ImportSummary {
	switch kind {
	case "ratings":
		return result.Ratings
	case "watched":
		return result.Watched
	case "likes":
		return result.Likes
	case "watchlist":
		return result.Watchlist
	default:
		return nil
	}
}

func (result *ZipImportSummary) setSummary(kind string, summary *ImportSummary) {
	switch kind {
	case "ratings":
		result.Ratings = summary
	case "watched":
		result.Watched = summary
	case "likes":
		result.Likes = summary
	case "watchlist":
		result.Watchlist = summary
	}
}
