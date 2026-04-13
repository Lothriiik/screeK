package store

import (
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/users"
)

func ToDomain(r *UserRecord) *users.User {
	if r == nil {
		return nil
	}

	var favMovieIDs []int
	for _, movie := range r.FavoriteMovies {
		favMovieIDs = append(favMovieIDs, movie.ID)
	}

	return &users.User{
		ID:             r.ID,
		Username:       r.Username,
		Name:           r.Name,
		Email:          r.Email,
		Password:       r.Password,
		Bio:            r.Bio,
		AvatarURL:      r.AvatarURL,
		Pronouns:       r.Pronouns,
		Role:           r.Role,
		DefaultCity:    r.DefaultCity,
		FavoriteMovies: favMovieIDs,
		IsActive:       r.IsActive,
		CreatedAt:      r.CreatedAt,
	}
}

func ToUserList(records []UserRecord) []users.User {
	list := make([]users.User, len(records))
	for i := range records {
		list[i] = *ToDomain(&records[i])
	}
	return list
}

func ToRecord(d *users.User) *UserRecord {
	if d == nil {
		return nil
	}

	var gormMovies []movies.Movie
	for _, id := range d.FavoriteMovies {
		gormMovies = append(gormMovies, movies.Movie{ID: int(id)})
	}

	return &UserRecord{
		ID:             d.ID,
		Username:       d.Username,
		Name:           d.Name,
		Email:          d.Email,
		Password:       d.Password,
		Bio:            d.Bio,
		AvatarURL:      d.AvatarURL,
		Pronouns:       d.Pronouns,
		Role:           d.Role,
		DefaultCity:    d.DefaultCity,
		FavoriteMovies: gormMovies,
		IsActive:       d.IsActive,
		CreatedAt:      d.CreatedAt,
	}
}

func ToStatsDomain(r *UserStatsRecord) *users.UserStats {
	if r == nil {
		return nil
	}

	return &users.UserStats{
		UserID:       r.UserID,
		TotalMovies:  r.TotalMovies,
		TotalMinutes: r.TotalMinutes,
		TopGenreID:   r.TopGenreID,
		LastRecalcAt: r.LastRecalcAt,
		UpdatedAt:    r.UpdatedAt,
	}
}

func ToStatsRecord(d *users.UserStats) *UserStatsRecord {
	if d == nil {
		return nil
	}

	return &UserStatsRecord{
		UserID:       d.UserID,
		TotalMovies:  d.TotalMovies,
		TotalMinutes: d.TotalMinutes,
		TopGenreID:   d.TopGenreID,
		LastRecalcAt: d.LastRecalcAt,
		UpdatedAt:    d.UpdatedAt,
	}
}

func ToStatsList(records []UserStatsRecord) []users.UserStats {
	list := make([]users.UserStats, len(records))
	for i := range records {
		list[i] = *ToStatsDomain(&records[i])
	}
	return list
}
