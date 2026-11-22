// Command seed popula o catálogo local (tabela movies e relacionadas) a
// partir do TMDB. Ele existe para que o serviço de recomendação tenha uma
// base offline confiável, sem depender do frontend ou de buscas manuais.
//
// Exemplos:
//
//	go run ./cmd/seed -pages 5
//	go run ./cmd/seed -from-year 1900 -per-year 100 -workers 8
//	go run ./cmd/seed -ids ./seed_ids.txt -expand
//	go run ./cmd/seed -pages 2 -limit 100 -dry-run
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	moviestore "github.com/StartLivin/screek/backend/internal/movies/store"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
	"github.com/StartLivin/screek/backend/internal/shared/config"
	"github.com/StartLivin/screek/backend/internal/shared/database"
	"github.com/StartLivin/screek/backend/internal/shared/logging"
)

func main() {
	logging.Setup()

	pages := flag.Int("pages", 5, "quantas páginas de filmes populares importar (20 filmes por página)")
	genreID := flag.Int("genre", 0, "filtrar discover por gênero TMDB (0 = todos)")
	fromYear := flag.Int("from-year", 0, "ano inicial para importar por ano (ex.: 1900); 0 desativa")
	toYear := flag.Int("to-year", time.Now().Year(), "ano final para importar por ano")
	perYear := flag.Int("per-year", 100, "máximo de filmes populares por ano (usado com -from-year)")
	workers := flag.Int("workers", 8, "quantidade máxima de detalhes buscados em paralelo")
	idsFile := flag.String("ids", "", "arquivo com TMDB IDs (um por linha ou separados por vírgula)")
	expand := flag.Bool("expand", false, "expandir o catálogo com as recomendações do TMDB de cada filme")
	limit := flag.Int("limit", 0, "máximo de filmes a importar (0 = sem limite)")
	delay := flag.Duration("delay", 120*time.Millisecond, "pausa entre chamadas ao TMDB")
	dryRun := flag.Bool("dry-run", false, "apenas listar os IDs que seriam importados")
	flag.Parse()

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("Falha ao carregar configurações", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()

	tmdbClient := movietmdb.NewTMDBClient(cfg.TMDBToken)

	var ids []int
	if *fromYear > 0 {
		if *toYear < *fromYear {
			slog.Error("Intervalo de anos inválido", "from_year", *fromYear, "to_year", *toYear)
			os.Exit(1)
		}
		if *perYear <= 0 || *perYear > 10000 {
			slog.Error("-per-year deve estar entre 1 e 10000")
			os.Exit(1)
		}
		ids, err = collectIDsByYear(ctx, tmdbClient, *fromYear, *toYear, *perYear, *genreID, *delay)
	} else {
		ids, err = collectIDs(ctx, tmdbClient, *pages, *genreID, *idsFile)
	}
	if *workers < 1 || *workers > 20 {
		slog.Error("-workers deve estar entre 1 e 20")
		os.Exit(1)
	}
	if err != nil {
		slog.Error("Falha ao coletar IDs do TMDB", "error", err)
		os.Exit(1)
	}

	if *expand {
		expanded, err := expandWithRecommendations(ctx, tmdbClient, ids, *delay)
		if err != nil {
			slog.Warn("Falha ao expandir recomendações; seguindo com a lista original", "error", err)
		} else {
			ids = mergeIDs(ids, expanded)
		}
	}

	if *limit > 0 && len(ids) > *limit {
		ids = ids[:*limit]
	}

	slog.Info("IDs coletados", "total", len(ids))

	if *dryRun {
		for _, id := range ids {
			fmt.Println(id)
		}
		return
	}

	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Falha ao conectar no Postgres", "error", err)
		os.Exit(1)
	}
	if err := moviestore.AutoMigrate(db); err != nil {
		slog.Error("Falha ao migrar tabelas de filmes", "error", err)
		os.Exit(1)
	}

	store := moviestore.NewStore(db)
	// userSearch/listSearch não são usados pelo seed.
	movieSvc := movies.NewService(tmdbClient, store, nil, nil)

	imported, failed := importMovieDetails(ctx, movieSvc, ids, *workers, *delay)

	slog.Info("Seed concluído", "importados", imported, "falhas", failed, "total", len(ids))
}

func importMovieDetails(
	ctx context.Context,
	service *movies.MovieService,
	ids []int,
	workerCount int,
	delay time.Duration,
) (int, int) {
	type task struct {
		index  int
		tmdbID int
	}

	if workerCount > len(ids) {
		workerCount = len(ids)
	}
	if workerCount == 0 {
		return 0, 0
	}

	jobs := make(chan task)
	var workers sync.WaitGroup
	var countsMu sync.Mutex
	imported, failed, processed := 0, 0, 0

	workers.Add(workerCount)
	for worker := 0; worker < workerCount; worker++ {
		go func() {
			defer workers.Done()
			for job := range jobs {
				movie, err := service.GetMovieDetails(ctx, job.tmdbID)
				countsMu.Lock()
				processed++
				if err != nil {
					failed++
					slog.Warn("Falha ao importar filme", "tmdb_id", job.tmdbID, "error", err)
				} else {
					imported++
					slog.Info("Filme importado",
						"progresso", fmt.Sprintf("%d/%d", processed, len(ids)),
						"movie_id", movie.ID,
						"tmdb_id", movie.TMDBID,
						"title", movie.Title,
					)
				}
				countsMu.Unlock()

				if delay > 0 {
					time.Sleep(delay)
				}
			}
		}()
	}

	for index, tmdbID := range ids {
		jobs <- task{index: index, tmdbID: tmdbID}
	}
	close(jobs)
	workers.Wait()
	return imported, failed
}

func collectIDsByYear(
	ctx context.Context,
	client *movietmdb.TMDBClient,
	fromYear, toYear, perYear, genreID int,
	delay time.Duration,
) ([]int, error) {
	const pageSize = 20
	ids := make([]int, 0, (toYear-fromYear+1)*perYear)
	seen := make(map[int]struct{}, (toYear-fromYear+1)*perYear)

	for year := fromYear; year <= toYear; year++ {
		remaining := perYear
		for page := 1; remaining > 0; page++ {
			moviesPage, err := client.DiscoverMovies(ctx, genreID, year, page)
			if err != nil {
				return nil, fmt.Errorf("discover ano %d página %d: %w", year, page, err)
			}
			if len(moviesPage) == 0 {
				break
			}

			added := 0
			for _, movie := range moviesPage {
				if remaining-added <= 0 {
					break
				}
				if movie.ID <= 0 {
					continue
				}
				if _, exists := seen[movie.ID]; exists {
					continue
				}
				seen[movie.ID] = struct{}{}
				ids = append(ids, movie.ID)
				added++
			}
			remaining -= added
			slog.Info("Discover por ano", "year", year, "page", page, "filmes_na_página", len(moviesPage), "ids_novos", added, "total", len(ids))

			if len(moviesPage) < pageSize {
				break
			}
			if delay > 0 {
				time.Sleep(delay)
			}
		}
	}
	return ids, nil
}

func collectIDs(ctx context.Context, client *movietmdb.TMDBClient, pages, genreID int, idsFile string) ([]int, error) {
	var ids []int

	for page := 1; page <= pages; page++ {
		moviesPage, err := client.DiscoverMovies(ctx, genreID, 0, page)
		if err != nil {
			return nil, fmt.Errorf("discover página %d: %w", page, err)
		}
		for _, movie := range moviesPage {
			ids = append(ids, movie.ID)
		}
		slog.Info("Discover concluído", "page", page, "filmes", len(moviesPage))
	}

	if idsFile != "" {
		fileIDs, err := readIDsFile(idsFile)
		if err != nil {
			return nil, err
		}
		ids = mergeIDs(ids, fileIDs)
	}

	return ids, nil
}

func expandWithRecommendations(ctx context.Context, client *movietmdb.TMDBClient, ids []int, delay time.Duration) ([]int, error) {
	var expanded []int
	for _, tmdbID := range ids {
		recommendations, err := client.GetMoviesRecommendations(ctx, tmdbID)
		if err != nil {
			slog.Warn("Falha ao buscar recomendações", "tmdb_id", tmdbID, "error", err)
			continue
		}
		for _, movie := range recommendations {
			expanded = append(expanded, movie.ID)
		}
		if delay > 0 {
			time.Sleep(delay)
		}
	}
	return expanded, nil
}

func readIDsFile(path string) ([]int, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("abrir %s: %w", path, err)
	}
	defer file.Close()

	var ids []int
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		for _, token := range strings.FieldsFunc(line, func(r rune) bool {
			return r == ',' || r == ';' || r == ' ' || r == '\t'
		}) {
			id, err := strconv.Atoi(token)
			if err != nil {
				return nil, fmt.Errorf("ID inválido %q em %s", token, path)
			}
			ids = append(ids, id)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return ids, nil
}

func mergeIDs(base, extra []int) []int {
	seen := make(map[int]struct{}, len(base)+len(extra))
	merged := make([]int, 0, len(base)+len(extra))
	for _, id := range append(base, extra...) {
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		merged = append(merged, id)
	}
	return merged
}
