package movies

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/movies/tmdb"
)

type TMDBMovie = tmdb.TMDBMovie
type TMDBPersonMovieCast = tmdb.TMDBPersonMovieCast

type Movie struct {
	ID               int           `json:"id"`
	TMDBID           int           `json:"tmdb_id"`
	Title            string        `json:"title"`
	OriginalTitle    string        `json:"original_title"`
	Overview         string        `json:"overview"`
	PosterURL        string        `json:"poster_url"`
	BackdropURL      string        `json:"backdrop_url"`
	UpdatedAt        time.Time     `json:"-"`
	ReleaseDate      time.Time     `json:"release_date"`
	Status           string        `json:"status"`
	Runtime          int           `json:"runtime"`
	OriginalLanguage string        `json:"original_language"`
	SpokenLanguages  string        `json:"spoken_languages"`
	VoteAverage      float64       `json:"vote_average"`
	VoteCount        int           `json:"vote_count"`
	Popularity       float64       `json:"popularity"`
	Budget           int64         `json:"budget"`
	Revenue          int64         `json:"revenue"`
	Countries        []string      `json:"countries"`
	Keywords         []string      `json:"keywords"`
	Studios          []string      `json:"studios"`
	Certification    string        `json:"certification"`
	Year             int           `json:"year,omitempty"`
	Genres           []Genre       `gorm:"-" json:"genres"`
	Credits          []MovieCredit `gorm:"-" json:"credits"`
}

type Genre struct {
	ID     int     `json:"id"`
	TMDBID int     `json:"tmdb_id"`
	Name   string  `json:"name"`
	Movies []Movie `gorm:"-" json:"-"`
}

type Person struct {
	ID           int           `json:"id"`
	TMDBID       int           `json:"tmdb_id"`
	Name         string        `json:"name"`
	ProfileURL   string        `json:"profile_url"`
	MovieCredits []MovieCredit `gorm:"-" json:"-"`
}

type MovieCredit struct {
	ID        int    `json:"id"`
	MovieID   int    `json:"movie_id"`
	PersonID  int    `json:"person_id"`
	Role      string `json:"role"`
	Character string `json:"character"`
	Person    Person `gorm:"-" json:"person"`
	Movie     *Movie `gorm:"-" json:"-"`
}
