package models

import "time"

type Movie struct {
	ID          int           `json:"id" gorm:"primaryKey;autoIncrement"`
	TMDBID      int           `json:"tmdb_id" gorm:"not null;uniqueIndex"`
	Title       string        `json:"title" gorm:"not null"`
	Overview    string        `json:"overview" gorm:"not null"`
	PosterURL   string        `json:"poster_url" gorm:"not null"`
	ReleaseDate time.Time     `json:"release_date" gorm:"not null"`
	Runtime     int           `json:"runtime" gorm:"not null"`
	Genres      []Genre       `json:"genres" gorm:"many2many:movie_genres;"`
	Credits     []MovieCredit `json:"credits" gorm:"foreignKey:MovieID;references:ID"`
}

type Genre struct {
	ID     int     `json:"id" gorm:"primaryKey;autoIncrement"`
	TMDBID int     `json:"tmdb_id" gorm:"not null;uniqueIndex"`
	Name   string  `json:"name" gorm:"not null"`
	Movies []Movie `json:"movies" gorm:"many2many:movie_genres;"`
}

type Person struct {
	ID           int           `json:"id" gorm:"primaryKey;autoIncrement"`
	TMDBID       int           `json:"tmdb_id" gorm:"not null;uniqueIndex"`
	Name         string        `json:"name" gorm:"not null"`
	ProfileURL   string        `json:"profile_url" gorm:"not null"`
	MovieCredits []MovieCredit `json:"movie_credits" gorm:"foreignKey:PersonID"`
}

type MovieCredit struct {
	ID        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	MovieID   int    `json:"movie_id" gorm:"not null"`
	PersonID  int    `json:"person_id" gorm:"not null"`
	Role      string `json:"role" gorm:"not null"`
	Character string `json:"character"`
	Person    Person `json:"person" gorm:"foreignKey:PersonID"`
	Movie     Movie  `json:"movie" gorm:"foreignKey:MovieID"`
}
