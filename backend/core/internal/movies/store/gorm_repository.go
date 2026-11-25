package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
	"gorm.io/gorm"
)

var _ movies.MoviesRepository = (*Store)(nil)

var (
	ErrMovieNotFound       = movies.ErrMovieNotFound
	ErrMovieCacheExpired   = movies.ErrMovieCacheExpired
	ErrMovieIncompleteData = movies.ErrMovieIncompleteData
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) SaveMovie(ctx context.Context, movie *movies.Movie) error {
	record := MovieToRecord(movie)

	updates := map[string]any{
		"title":    record.Title,
		"overview": record.Overview,
	}
	if record.OriginalTitle != "" {
		updates["original_title"] = record.OriginalTitle
	}
	if record.PosterURL != "" {
		updates["poster_url"] = record.PosterURL
	}
	if record.BackdropURL != "" {
		updates["backdrop_url"] = record.BackdropURL
	}
	if !record.ReleaseDate.IsZero() {
		updates["release_date"] = record.ReleaseDate
	}
	if record.Runtime > 0 {
		updates["runtime"] = record.Runtime
	}
	if record.OriginalLanguage != "" {
		updates["original_language"] = record.OriginalLanguage
	}
	if record.VoteAverage > 0 {
		updates["vote_average"] = record.VoteAverage
	}
	if record.VoteCount > 0 {
		updates["vote_count"] = record.VoteCount
	}
	if record.Popularity > 0 {
		updates["popularity"] = record.Popularity
	}

	result := s.db.WithContext(ctx).Where(MovieRecord{TMDBID: record.TMDBID}).Assign(updates).FirstOrCreate(record)

	if result.Error == nil {
		movie.ID = record.ID
	}
	return result.Error
}

func (s *Store) SaveMoviePosterPalette(ctx context.Context, tmdbID int, posterURL string, palette *movies.PosterPalette) error {
	if palette == nil {
		return nil
	}
	serialized, err := json.Marshal(palette)
	if err != nil {
		return err
	}
	result := s.db.WithContext(ctx).
		Model(&MovieRecord{}).
		Where("tmdb_id = ? AND poster_url = ?", tmdbID, posterURL).
		UpdateColumns(map[string]any{
			"poster_palette_json":       string(serialized),
			"poster_palette_poster_url": posterURL,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *Store) GetMovieByID(ctx context.Context, id int) (*movies.Movie, error) {
	var record MovieRecord
	result := s.db.WithContext(ctx).Preload("Genres").Preload("Credits").Preload("Credits.Person").First(&record, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrMovieNotFound
	}
	if result.Error != nil {
		return nil, result.Error
	}
	return MovieToDomain(&record), nil
}

func (s *Store) GetMovieByTMDBID(ctx context.Context, tmdbID int) (*movies.Movie, error) {
	var record MovieRecord
	result := s.db.WithContext(ctx).Preload("Genres").Preload("Credits").Preload("Credits.Person").Where("tmdb_id = ?", tmdbID).First(&record)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrMovieNotFound
	}
	if result.Error != nil {
		return nil, result.Error
	}

	movie := MovieToDomain(&record)
	if time.Since(movie.UpdatedAt) > 7*24*time.Hour {
		return nil, ErrMovieCacheExpired
	}

	if movie.Runtime == 0 {
		return nil, ErrMovieIncompleteData
	}

	return movie, nil
}

func (s *Store) SaveMovieDetails(ctx context.Context, tmdbData *movietmdb.TMDBMovieDetails) (*movies.Movie, error) {
	var generosDoBanco []GenreRecord
	var creditosDoBanco []MovieCreditRecord

	for _, g := range tmdbData.Genres {
		var dbGenre GenreRecord
		s.db.WithContext(ctx).Where(GenreRecord{TMDBID: g.ID}).Assign(GenreRecord{Name: g.Name}).FirstOrCreate(&dbGenre)
		generosDoBanco = append(generosDoBanco, dbGenre)
	}

	castLimit := 25
	if len(tmdbData.Credits.Cast) < 25 {
		castLimit = len(tmdbData.Credits.Cast)
	}

	for i := 0; i < castLimit; i++ {
		actor := tmdbData.Credits.Cast[i]

		var dbPerson PersonRecord
		s.db.WithContext(ctx).Where(PersonRecord{TMDBID: actor.ID}).Assign(PersonRecord{
			Name:       actor.Name,
			ProfileURL: actor.ProfilePath,
		}).FirstOrCreate(&dbPerson)

		creditosDoBanco = append(creditosDoBanco, MovieCreditRecord{
			Role:      "Actor",
			Character: actor.Character,
			PersonID:  dbPerson.ID,
			Person:    dbPerson,
		})
	}

	cargosDesejados := map[string]bool{
		"Director":                true,
		"Producer":                true,
		"Writer":                  true,
		"Screenplay":              true,
		"Casting":                 true,
		"Editor":                  true,
		"Director of Photography": true,
		"Assistant Director":      true,
		"Executive Producer":      true,
		"Production Design":       true,
		"Set Decoration":          true,
		"Special Effects":         true,
		"Visual Effects":          true,
		"Title Designer":          true,
		"Choreographer":           true,
		"Original Music Composer": true,
		"Sound Designer":          true,
		"Costume Design":          true,
		"Makeup Artist":           true,
	}

	for _, crew := range tmdbData.Credits.Crew {
		if cargosDesejados[crew.Job] {
			var dbPerson PersonRecord
			s.db.WithContext(ctx).Where(PersonRecord{TMDBID: crew.ID}).Assign(PersonRecord{
				Name:       crew.Name,
				ProfileURL: crew.ProfilePath,
			}).FirstOrCreate(&dbPerson)

			creditosDoBanco = append(creditosDoBanco, MovieCreditRecord{
				Role:     crew.Job,
				PersonID: dbPerson.ID,
				Person:   dbPerson,
			})
		}
	}

	var spokenLangs []string
	for _, lang := range tmdbData.SpokenLanguages {
		spokenLangs = append(spokenLangs, lang.Name)
	}
	spokenLanguagesStr := strings.Join(spokenLangs, ", ")

	var countries []string
	for _, country := range tmdbData.ProductionCountries {
		countries = append(countries, country.Name)
	}

	var keywords []string
	for _, keyword := range tmdbData.Keywords.Keywords {
		keywords = append(keywords, keyword.Name)
	}

	var studios []string
	for _, company := range tmdbData.ProductionCompanies {
		studios = append(studios, company.Name)
	}

	parsedDate, _ := time.Parse("2006-01-02", tmdbData.ReleaseDate)

	status := tmdbData.Status
	if status == "" {
		status = "Released"
	}

	movieRec := MovieRecord{
		TMDBID:           tmdbData.ID,
		Title:            tmdbData.Title,
		OriginalTitle:    tmdbData.OriginalTitle,
		Overview:         tmdbData.Overview,
		PosterURL:        imageURL(tmdbData.PosterPath, "w500"),
		BackdropURL:      imageURL(tmdbData.BackdropPath, "original"),
		Status:           status,
		Runtime:          tmdbData.Runtime,
		OriginalLanguage: tmdbData.OriginalLanguage,
		SpokenLanguages:  spokenLanguagesStr,
		VoteAverage:      tmdbData.VoteAverage,
		VoteCount:        tmdbData.VoteCount,
		Popularity:       tmdbData.Popularity,
		Budget:           tmdbData.Budget,
		Revenue:          tmdbData.Revenue,
		Countries:        joinList(countries),
		Keywords:         joinList(keywords),
		Studios:          joinList(studios),
		Certification:    extractCertification(tmdbData.ReleaseDates),
		ReleaseDate:      parsedDate,
		Genres:           generosDoBanco,
		Credits:          creditosDoBanco,
	}

	var existingMovie MovieRecord
	result := s.db.WithContext(ctx).Where("tmdb_id = ?", movieRec.TMDBID).First(&existingMovie)
	if result.Error == nil {
		movieRec.ID = existingMovie.ID
		if existingMovie.PosterURL == movieRec.PosterURL && movieRec.PosterPaletteJSON == "" {
			movieRec.PosterPaletteJSON = existingMovie.PosterPaletteJSON
			movieRec.PosterPalettePosterURL = existingMovie.PosterPalettePosterURL
		}
		s.db.WithContext(ctx).Where("movie_id = ?", movieRec.ID).Delete(&MovieCreditRecord{})
	}

	err := s.db.WithContext(ctx).Save(&movieRec).Error
	if err != nil {
		return nil, err
	}
	return MovieToDomain(&movieRec), nil
}

func (s *Store) GetPersonByTMDBID(ctx context.Context, tmdbID int) (*movies.Person, error) {
	var record PersonRecord
	result := s.db.WithContext(ctx).Where("tmdb_id = ?", tmdbID).First(&record)
	if result.Error == nil {
		return PersonToDomain(&record), nil
	}
	return nil, result.Error
}

func (s *Store) SavePersonDetails(ctx context.Context, tmdbData *movietmdb.TMDBPersonDetails) (*movies.Person, error) {
	var record PersonRecord
	result := s.db.WithContext(ctx).Where(PersonRecord{TMDBID: tmdbData.ID}).Assign(PersonRecord{
		Name:       tmdbData.Name,
		ProfileURL: tmdbData.ProfilePath,
	}).FirstOrCreate(&record)
	if result.Error != nil {
		return nil, result.Error
	}
	return PersonToDomain(&record), nil
}

func (s *Store) GetMovieByTitleAndYear(ctx context.Context, title string, year int) (*movies.Movie, error) {
	var record MovieRecord
	query := s.db.WithContext(ctx).Where("LOWER(title) = LOWER(?)", title)
	if year > 0 {
		query = query.Where("EXTRACT(YEAR FROM release_date) = ?", year)
	}
	if err := query.First(&record).Error; err != nil {
		return nil, err
	}
	return MovieToDomain(&record), nil
}

func (s *Store) GetGenreName(ctx context.Context, genreID int) (string, error) {
	var record GenreRecord
	err := s.db.WithContext(ctx).Where("tmdb_id = ?", genreID).First(&record).Error
	if err != nil {
		return "", err
	}
	return record.Name, nil
}

func imageURL(path, size string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http") {
		return path
	}
	return "https://image.tmdb.org/t/p/" + size + path
}

// extractCertification prefere a classificação dos EUA, depois a do Brasil
// e, por fim, a primeira classificação não vazia disponível.
func extractCertification(releaseDates movietmdb.TMDBReleaseDates) string {
	priorities := []string{"US", "BR"}

	for _, country := range priorities {
		for _, result := range releaseDates.Results {
			if result.ISO3166_1 != country {
				continue
			}
			for _, release := range result.ReleaseDates {
				if release.Certification != "" {
					return release.Certification
				}
			}
		}
	}

	for _, result := range releaseDates.Results {
		for _, release := range result.ReleaseDates {
			if release.Certification != "" {
				return release.Certification
			}
		}
	}

	return ""
}
