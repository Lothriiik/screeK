package store

import (
	"time"

	cinemastore "github.com/StartLivin/screek/backend/internal/cinema/store"
	"gorm.io/gorm"
)

type DailyCinemaStatsRecord struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"`
	Date          time.Time `gorm:"not null;uniqueIndex:idx_date_cinema"`
	CinemaID      int       `gorm:"not null;uniqueIndex:idx_date_cinema"`
	TotalRevenue  int64     `gorm:"not null;default:0"`
	TicketsSold   int       `gorm:"not null;default:0"`
	OccupancyRate float64   `gorm:"not null;default:0"`
	CreatedAt     time.Time `gorm:"not null;default:now()"`

	Cinema cinemastore.CinemaRecord `gorm:"foreignKey:CinemaID"`
}
type DailyMovieStatsRecord struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"`
	Date         time.Time `gorm:"not null;uniqueIndex:idx_date_movie"`
	MovieID      int       `gorm:"not null;uniqueIndex:idx_date_movie"`
	TotalRevenue int64     `gorm:"not null;default:0"`
	TicketsSold  int       `gorm:"not null;default:0"`
	CreatedAt    time.Time `gorm:"not null;default:now()"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&DailyCinemaStatsRecord{}, &DailyMovieStatsRecord{})
}
