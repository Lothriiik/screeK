package store

import (
	"time"

	"gorm.io/gorm"
)

type MovieRecord struct {
	ID                     int    `gorm:"primaryKey;autoIncrement"`
	TMDBID                 int    `gorm:"not null;uniqueIndex"`
	Title                  string `gorm:"not null"`
	OriginalTitle          string
	Overview               string `gorm:"not null"`
	PosterURL              string `gorm:"not null"`
	PosterPaletteJSON      string `gorm:"type:text"`
	PosterPalettePosterURL string `gorm:"type:text"`
	BackdropURL            string
	UpdatedAt              time.Time
	ReleaseDate            time.Time `gorm:"not null"`
	Status                 string    `gorm:"not null;default:'Released'"`
	Runtime                int       `gorm:"not null"`
	OriginalLanguage       string
	SpokenLanguages        string
	VoteAverage            float64
	VoteCount              int
	Popularity             float64
	Budget                 int64
	Revenue                int64
	Countries              string
	Keywords               string
	Studios                string
	Certification          string
	Genres                 []GenreRecord       `gorm:"many2many:movie_genres;foreignKey:ID;joinForeignKey:movie_id;references:ID;joinReferences:genre_id;"`
	Credits                []MovieCreditRecord `gorm:"foreignKey:MovieID;references:ID"`
}

type GenreRecord struct {
	ID     int           `gorm:"primaryKey;autoIncrement"`
	TMDBID int           `gorm:"not null;uniqueIndex"`
	Name   string        `gorm:"not null"`
	Movies []MovieRecord `gorm:"many2many:movie_genres;foreignKey:ID;joinForeignKey:genre_id;references:ID;joinReferences:movie_id;"`
}

type PersonRecord struct {
	ID           int                 `gorm:"primaryKey;autoIncrement"`
	TMDBID       int                 `gorm:"not null;uniqueIndex"`
	Name         string              `gorm:"not null"`
	ProfileURL   string              `gorm:"not null"`
	MovieCredits []MovieCreditRecord `gorm:"foreignKey:PersonID"`
}

type MovieCreditRecord struct {
	ID        int    `gorm:"primaryKey;autoIncrement"`
	MovieID   int    `gorm:"not null;index:idx_movie_credits_movie_role,priority:1"`
	PersonID  int    `gorm:"not null"`
	Role      string `gorm:"not null;index:idx_movie_credits_movie_role,priority:2"`
	Character string
	Person    PersonRecord `gorm:"foreignKey:PersonID"`
	Movie     *MovieRecord `gorm:"foreignKey:MovieID"`
}

type MovieGenre struct {
	MovieID int `gorm:"primaryKey;index:idx_movie_genres_movie_id"`
	GenreID int `gorm:"primaryKey"`
}

func (MovieRecord) TableName() string       { return "movies" }
func (GenreRecord) TableName() string       { return "genres" }
func (PersonRecord) TableName() string      { return "people" }
func (MovieCreditRecord) TableName() string { return "movie_credits" }
func (MovieGenre) TableName() string        { return "movie_genres" }

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&MovieGenre{}, &MovieRecord{}, &GenreRecord{}, &PersonRecord{}, &MovieCreditRecord{})
}
