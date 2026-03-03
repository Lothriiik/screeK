package store

import (
	"errors"

	"github.com/StartLivin/cine-pass/backend/internal/models"
	"github.com/StartLivin/cine-pass/backend/internal/services"
	"gorm.io/gorm"
)

func (s *GormStore) SaveMovie(movie *models.Movie) error {
	result := s.db.Where(models.Movie{TMDBID: movie.TMDBID}).Assign(models.Movie{
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		ReleaseDate: movie.ReleaseDate,
	}).FirstOrCreate(movie)

	return result.Error
}

func (s *GormStore) GetMovieByTMDBID(tmdbID int) (*models.Movie, error) {
	var movie models.Movie
	result := s.db.Where("tmdb_id = ?", tmdbID).First(&movie)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, errors.New("movie not found")
	}
	return &movie, result.Error
}

func (s *GormStore) SaveMovieDetails(tmdbData *services.TMDBMovieDetails) (*models.Movie, error) {
	var generosDoBanco []models.Genre
	var creditosDoBanco []models.MovieCredit

	for _, g := range tmdbData.Genres {
		var dbGenre models.Genre
		s.db.Where(models.Genre{TMDBID: g.ID}).Assign(models.Genre{Name: g.Name}).FirstOrCreate(&dbGenre)
		generosDoBanco = append(generosDoBanco, dbGenre)
	}

	castLimit := 25
	if len(tmdbData.Credits.Cast) < 25 {
		castLimit = len(tmdbData.Credits.Cast)
	}

	for i := 0; i < castLimit; i++ {
		actor := tmdbData.Credits.Cast[i]

		var dbPerson models.Person
		s.db.Where(models.Person{TMDBID: actor.ID}).Assign(models.Person{
			Name:       actor.Name,
			ProfileURL: actor.ProfilePath,
		}).FirstOrCreate(&dbPerson)

		creditosDoBanco = append(creditosDoBanco, models.MovieCredit{
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
			var dbPerson models.Person
			s.db.Where(models.Person{TMDBID: crew.ID}).Assign(models.Person{
				Name:       crew.Name,
				ProfileURL: crew.ProfilePath,
			}).FirstOrCreate(&dbPerson)

			creditosDoBanco = append(creditosDoBanco, models.MovieCredit{
				Role:     crew.Job,
				PersonID: dbPerson.ID,
				Person:   dbPerson,
			})
		}
	}

	movie := models.Movie{
		TMDBID:    tmdbData.ID,
		Title:     tmdbData.Title,
		Overview:  tmdbData.Overview,
		PosterURL: tmdbData.PosterPath,
		Runtime:   tmdbData.Runtime,
		Genres:    generosDoBanco,
		Credits:   creditosDoBanco,
	}

	var existingMovie models.Movie
	result := s.db.Where("tmdb_id = ?", movie.TMDBID).First(&existingMovie)
	if result.Error == nil {
		movie.ID = existingMovie.ID
		s.db.Where("movie_id = ?", movie.ID).Delete(&models.MovieCredit{})
	}

	err := s.db.Save(&movie).Error
	return &movie, err
}
