package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	movietmdb "github.com/StartLivin/screek/backend/internal/movies/tmdb"
	"gorm.io/gorm"
)

var _ movies.MoviesRepository = (*Store)(nil)

var (
	ErrMovieNotFound       = errors.New("filme não achado")
	ErrMovieCacheExpired   = errors.New("revalidar cache do filme")
	ErrMovieIncompleteData = errors.New("filme incompleto, forçando busca de detalhes")
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) SaveMovie(ctx context.Context, movie *movies.Movie) error {
	result := s.db.WithContext(ctx).Where(movies.Movie{TMDBID: movie.TMDBID}).Assign(movies.Movie{
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		ReleaseDate: movie.ReleaseDate,
	}).FirstOrCreate(movie)

	return result.Error
}

func (s *Store) GetMovieByTMDBID(ctx context.Context, tmdbID int) (*movies.Movie, error) {
	var movie movies.Movie
	result := s.db.WithContext(ctx).Preload("Genres").Preload("Credits").Preload("Credits.Person").Where("tmdb_id = ?", tmdbID).First(&movie)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrMovieNotFound
	}
	if time.Since(movie.UpdatedAt) > 7*24*time.Hour {
		return nil, ErrMovieCacheExpired
	}

	if movie.Runtime == 0 {
		return nil, ErrMovieIncompleteData
	}

	return &movie, result.Error
}

func (s *Store) SaveMovieDetails(ctx context.Context, tmdbData *movietmdb.TMDBMovieDetails) (*movies.Movie, error) {
	var generosDoBanco []movies.Genre
	var creditosDoBanco []movies.MovieCredit

	for _, g := range tmdbData.Genres {
		var dbGenre movies.Genre
		s.db.WithContext(ctx).Where(movies.Genre{TMDBID: g.ID}).Assign(movies.Genre{Name: g.Name}).FirstOrCreate(&dbGenre)
		generosDoBanco = append(generosDoBanco, dbGenre)
	}

	castLimit := 25
	if len(tmdbData.Credits.Cast) < 25 {
		castLimit = len(tmdbData.Credits.Cast)
	}

	for i := 0; i < castLimit; i++ {
		actor := tmdbData.Credits.Cast[i]

		var dbPerson movies.Person
		s.db.WithContext(ctx).Where(movies.Person{TMDBID: actor.ID}).Assign(movies.Person{
			Name:       actor.Name,
			ProfileURL: actor.ProfilePath,
		}).FirstOrCreate(&dbPerson)

		creditosDoBanco = append(creditosDoBanco, movies.MovieCredit{
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
			var dbPerson movies.Person
			s.db.WithContext(ctx).Where(movies.Person{TMDBID: crew.ID}).Assign(movies.Person{
				Name:       crew.Name,
				ProfileURL: crew.ProfilePath,
			}).FirstOrCreate(&dbPerson)

			creditosDoBanco = append(creditosDoBanco, movies.MovieCredit{
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

	parsedDate, _ := time.Parse("2006-01-02", tmdbData.ReleaseDate)

	movie := movies.Movie{
		TMDBID:           tmdbData.ID,
		Title:            tmdbData.Title,
		Overview:         tmdbData.Overview,
		PosterURL:        tmdbData.PosterPath,
		Runtime:          tmdbData.Runtime,
		OriginalLanguage: tmdbData.OriginalLanguage,
		SpokenLanguages:  spokenLanguagesStr,
		ReleaseDate:      parsedDate,
		Genres:           generosDoBanco,
		Credits:          creditosDoBanco,
	}

	var existingMovie movies.Movie
	result := s.db.WithContext(ctx).Where("tmdb_id = ?", movie.TMDBID).First(&existingMovie)
	if result.Error == nil {
		movie.ID = existingMovie.ID
		s.db.WithContext(ctx).Where("movie_id = ?", movie.ID).Delete(&movies.MovieCredit{})
	}

	err := s.db.WithContext(ctx).Save(&movie).Error
	return &movie, err
}

func (s *Store) GetPersonByTMDBID(ctx context.Context, tmdbID int) (*movies.Person, error) {
	var person movies.Person
	result := s.db.WithContext(ctx).Where("tmdb_id = ?", tmdbID).First(&person)
	if result.Error == nil {
		return &person, nil
	}
	return nil, result.Error
}

func (s *Store) SavePersonDetails(ctx context.Context, tmdbData *movietmdb.TMDBPersonDetails) (*movies.Person, error) {
	var person movies.Person
	result := s.db.WithContext(ctx).Where(movies.Person{TMDBID: tmdbData.ID}).Assign(movies.Person{
		Name:       tmdbData.Name,
		ProfileURL: tmdbData.ProfilePath,
	}).FirstOrCreate(&person)
	return &person, result.Error
}

func (s *Store) GetMovieByTitleAndYear(ctx context.Context, title string, year int) (*movies.Movie, error) {
	var movie movies.Movie
	query := s.db.WithContext(ctx).Where("LOWER(title) = LOWER(?)", title)
	if year > 0 {
		query = query.Where("EXTRACT(YEAR FROM release_date) = ?", year)
	}
	if err := query.First(&movie).Error; err != nil {
		return nil, err
	}
	return &movie, nil
}

func (s *Store) GetGenreName(ctx context.Context, genreID int) (string, error) {
	var genre movies.Genre
	err := s.db.WithContext(ctx).Where("tmdb_id = ?", genreID).First(&genre).Error
	if err != nil {
		return "", err
	}
	return genre.Name, nil
}
