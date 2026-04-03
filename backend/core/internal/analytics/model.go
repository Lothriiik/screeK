package analytics

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"gorm.io/gorm"
)

type DailyCinemaStats struct {
	ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Date          time.Time `json:"date" gorm:"not null;uniqueIndex:idx_date_cinema"`
	CinemaID      int       `json:"cinema_id" gorm:"not null;uniqueIndex:idx_date_cinema"`
	TotalRevenue  int64     `json:"total_revenue" gorm:"not null;default:0"`
	TicketsSold   int       `json:"tickets_sold" gorm:"not null;default:0"`
	OccupancyRate float64   `json:"occupancy_rate" gorm:"not null;default:0"`
	CreatedAt     time.Time `json:"created_at" gorm:"not null;default:now()"`

	Cinema domain.Cinema `json:"cinema" gorm:"foreignKey:CinemaID"`
}

type DailyMovieStats struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Date         time.Time `json:"date" gorm:"not null;uniqueIndex:idx_date_movie"`
	MovieID      int       `json:"movie_id" gorm:"not null;uniqueIndex:idx_date_movie"`
	TotalRevenue int64     `json:"total_revenue" gorm:"not null;default:0"`
	TicketsSold  int       `json:"tickets_sold" gorm:"not null;default:0"`
	CreatedAt    time.Time `json:"created_at" gorm:"not null;default:now()"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&DailyCinemaStats{}, &DailyMovieStats{})
}
