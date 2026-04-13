package users

import (
	"time"

	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID     `json:"id"`
	Username       string        `json:"username"`
	Name           string        `json:"name"`
	Email          string        `json:"email"`
	Password       string        `json:"-"`
	Bio            string        `json:"bio"`
	AvatarURL      string        `json:"avatar_url"`
	Pronouns       string        `json:"pronouns"`
	Role           httputil.Role `json:"role"`
	DefaultCity    string        `json:"default_city"`
	FavoriteMovies []int         `json:"favorite_movies"`
	IsActive       bool          `json:"is_active"`
	CreatedAt      time.Time     `json:"created_at"`
}

type UserStats struct {
	UserID       uuid.UUID `json:"user_id"`
	TotalMovies  int       `json:"total_movies"`
	TotalMinutes int       `json:"total_minutes"`
	TopGenreID   *int      `json:"top_genre_id"`
	LastRecalcAt time.Time `json:"last_recalc_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
