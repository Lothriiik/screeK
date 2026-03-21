package movies

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

var (
	ErrMovieNotFound       = errors.New("movie not found")
	ErrMovieCacheExpired   = errors.New("revalidar cache do filme")
	ErrMovieIncompleteData = errors.New("filme incompleto, forçando busca de detalhes")
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) SaveMovie(movie *Movie) error {
	result := s.db.Where(Movie{TMDBID: movie.TMDBID}).Assign(Movie{
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		ReleaseDate: movie.ReleaseDate,
	}).FirstOrCreate(movie)

	return result.Error
}

func (s *Store) GetMovieByTMDBID(tmdbID int) (*Movie, error) {
	var movie Movie
	result := s.db.Preload("Genres").Preload("Credits").Preload("Credits.Person").Where("tmdb_id = ?", tmdbID).First(&movie)
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

func (s *Store) SaveMovieDetails(tmdbData *TMDBMovieDetails) (*Movie, error) {
	var generosDoBanco []Genre
	var creditosDoBanco []MovieCredit

	for _, g := range tmdbData.Genres {
		var dbGenre Genre
		s.db.Where(Genre{TMDBID: g.ID}).Assign(Genre{Name: g.Name}).FirstOrCreate(&dbGenre)
		generosDoBanco = append(generosDoBanco, dbGenre)
	}

	castLimit := 25
	if len(tmdbData.Credits.Cast) < 25 {
		castLimit = len(tmdbData.Credits.Cast)
	}

	for i := 0; i < castLimit; i++ {
		actor := tmdbData.Credits.Cast[i]

		var dbPerson Person
		s.db.Where(Person{TMDBID: actor.ID}).Assign(Person{
			Name:       actor.Name,
			ProfileURL: actor.ProfilePath,
		}).FirstOrCreate(&dbPerson)

		creditosDoBanco = append(creditosDoBanco, MovieCredit{
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
			var dbPerson Person
			s.db.Where(Person{TMDBID: crew.ID}).Assign(Person{
				Name:       crew.Name,
				ProfileURL: crew.ProfilePath,
			}).FirstOrCreate(&dbPerson)

			creditosDoBanco = append(creditosDoBanco, MovieCredit{
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

	movie := Movie{
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

	var existingMovie Movie
	result := s.db.Where("tmdb_id = ?", movie.TMDBID).First(&existingMovie)
	if result.Error == nil {
		movie.ID = existingMovie.ID
		s.db.Where("movie_id = ?", movie.ID).Delete(&MovieCredit{})
	}

	err := s.db.Save(&movie).Error
	return &movie, err
}

func (s *Store) GetPersonByTMDBID(tmdbID int) (*Person, error) {
	var person Person
	result := s.db.Where("tmdb_id = ?", tmdbID).First(&person)
	if result.Error == nil {
		return &person, nil
	}
	return nil, result.Error
}

func (s *Store) SavePersonDetails(tmdbData *TMDBPersonDetails) (*Person, error) {
	var person Person
	result := s.db.Where(Person{TMDBID: tmdbData.ID}).Assign(Person{
		Name:       tmdbData.Name,
		ProfileURL: tmdbData.ProfilePath,
	}).FirstOrCreate(&person)
	return &person, result.Error
}
