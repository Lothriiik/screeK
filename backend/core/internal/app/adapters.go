package app

import (
	"context"
	"errors"

	"github.com/StartLivin/screek/backend/internal/analytics"
	"github.com/StartLivin/screek/backend/internal/auth"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/catalog"
	"github.com/StartLivin/screek/backend/internal/cinema"
	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/recommendation"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/StartLivin/screek/backend/internal/social"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
)

type authUserAdapter struct {
	svc *users.UserService
}

func (a *authUserAdapter) GetUserByUsername(ctx context.Context, username string) (*auth.UserSummary, error) {
	u, err := a.svc.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	return &auth.UserSummary{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Password: u.Password,
		Role:     u.Role,
	}, nil
}

func (a *authUserAdapter) GetUserByID(ctx context.Context, id uuid.UUID) (*auth.UserSummary, error) {
	u, err := a.svc.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &auth.UserSummary{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Password: u.Password,
		Role:     u.Role,
	}, nil
}

func (a *authUserAdapter) GetUserByEmail(ctx context.Context, email string) (*auth.UserSummary, error) {
	u, err := a.svc.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return &auth.UserSummary{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Password: u.Password,
		Role:     u.Role,
	}, nil
}

func (a *authUserAdapter) UpdateUserPassword(ctx context.Context, user *auth.UserSummary) error {
	u, err := a.svc.GetUserByID(ctx, user.ID)
	if err != nil {
		return err
	}
	u.Password = user.Password
	return a.svc.UpdateUser(ctx, u)
}

func (a *authUserAdapter) UpdateUserRole(ctx context.Context, user *auth.UserSummary, role httputil.Role) error {
	u, err := a.svc.GetUserByID(ctx, user.ID)
	if err != nil {
		return err
	}
	u.Role = role
	return a.svc.UpdateUser(ctx, u)
}

type userMovieAdapter struct {
	svc *movies.MovieService
}

func (a *userMovieAdapter) GetMovieByTMDBID(ctx context.Context, tmdbID int) (*users.MovieSummary, error) {
	m, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return &users.MovieSummary{
		ID:     m.ID,
		TMDBID: m.TMDBID,
	}, nil
}

type analyticsMovieAdapter struct {
	svc *movies.MovieService
}

func (a *analyticsMovieAdapter) GetMovieDetails(ctx context.Context, tmdbID int) (*analytics.MovieSummary, error) {
	m, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return &analytics.MovieSummary{
		ID:    m.ID,
		Title: m.Title,
	}, nil
}

type analyticsCinemaAdapter struct {
	svc *cinema.CinemaService
}

func (a *analyticsCinemaAdapter) GetCinemaByID(ctx context.Context, id int) (*analytics.CinemaSummary, error) {
	c, err := a.svc.GetCinemaByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &analytics.CinemaSummary{
		ID:   c.ID,
		Name: c.Name,
	}, nil
}

type bookingMovieAdapter struct {
	svc *movies.MovieService
}

func (a *bookingMovieAdapter) GetMovieDetails(ctx context.Context, tmdbID int) (*bookings.MovieSummary, error) {
	m, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return &bookings.MovieSummary{
		ID:     m.ID,
		TMDBID: m.TMDBID,
		Title:  m.Title,
	}, nil
}

type bookingUserAdapter struct {
	svc *users.UserService
}

func (a *bookingUserAdapter) GetUserByID(ctx context.Context, id uuid.UUID) (*bookings.UserSummary, error) {
	u, err := a.svc.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &bookings.UserSummary{
		ID:    u.ID,
		Name:  u.Name,
		Email: u.Email,
	}, nil
}

type letterboxdMovieAdapter struct {
	svc *movies.MovieService
}

func (a *letterboxdMovieAdapter) MatchMovieByTitleAndYear(ctx context.Context, title string, year int) (*letterboxd.MatchedMovieSummary, error) {
	m, err := a.svc.MatchMovieByTitleAndYear(ctx, title, year)
	if err != nil {
		return nil, err
	}
	return &letterboxd.MatchedMovieSummary{ID: m.ID}, nil
}

type letterboxdCatalogAdapter struct {
	svc *catalog.CatalogService
}

func (a *letterboxdCatalogAdapter) LogMovie(ctx context.Context, userID uuid.UUID, movieID uint, rating float64, watched bool, liked bool) error {
	return a.svc.LogMovie(ctx, userID, movieID, catalog.LogMovieRequest{
		Watched: watched,
		Rating:  rating,
		Liked:   liked,
	})
}

func (a *letterboxdCatalogAdapter) AddToWatchlist(ctx context.Context, userID uuid.UUID, movieID uint) error {
	return a.svc.AddToWatchlist(ctx, userID, movieID)
}

type catalogMovieAdapter struct {
	svc *movies.MovieService
}

func (a *catalogMovieAdapter) GetMovieDetails(ctx context.Context, tmdbID int) (*catalog.MovieDetailSummary, error) {
	movie, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return catalogSummary(movie), nil
}

func (a *catalogMovieAdapter) GetMovieByID(ctx context.Context, id int) (*catalog.MovieDetailSummary, error) {
	movie, err := a.svc.GetMovieByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return catalogSummary(movie), nil
}

func catalogSummary(movie *movies.Movie) *catalog.MovieDetailSummary {
	return &catalog.MovieDetailSummary{
		ID:          movie.ID,
		TMDBID:      movie.TMDBID,
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		BackdropURL: movie.BackdropURL,
		ReleaseDate: movie.ReleaseDate,
		Runtime:     movie.Runtime,
	}
}

type catalogUserAdapter struct {
	svc *users.UserService
}

func (a *catalogUserAdapter) IncrementStats(ctx context.Context, userID uuid.UUID, movies int, minutes int) error {
	return a.svc.IncrementStats(ctx, userID, movies, minutes)
}

type cinemaMovieAdapter struct {
	svc *movies.MovieService
}

func (a *cinemaMovieAdapter) GetMovieDetails(ctx context.Context, tmdbID int) (*cinema.MovieDetailSummary, error) {
	movie, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return &cinema.MovieDetailSummary{
		ID:          movie.ID,
		TMDBID:      movie.TMDBID,
		Title:       movie.Title,
		Overview:    movie.Overview,
		PosterURL:   movie.PosterURL,
		BackdropURL: movie.BackdropURL,
		ReleaseDate: movie.ReleaseDate,
		Runtime:     movie.Runtime,
	}, nil
}

type userSearchAdapter struct {
	svc *users.UserService
}

func (a *userSearchAdapter) SearchUsers(ctx context.Context, query string) ([]movies.UserSearchResult, error) {
	usersList, err := a.svc.SearchUsers(ctx, query)
	if err != nil {
		return nil, err
	}
	var results []movies.UserSearchResult
	for _, u := range usersList {
		results = append(results, movies.UserSearchResult{
			ID:        u.ID.String(),
			Username:  u.Username,
			Name:      u.Name,
			AvatarURL: u.AvatarURL,
		})
	}
	return results, nil
}

func (a *userSearchAdapter) GetUserByID(ctx context.Context, id uuid.UUID) (*social.UserSummary, error) {
	u, err := a.svc.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &social.UserSummary{
		ID:        u.ID,
		Username:  u.Username,
		AvatarURL: u.AvatarURL,
	}, nil
}

func (a *userSearchAdapter) GetUserByUsername(ctx context.Context, username string) (*social.UserSummary, error) {
	u, err := a.svc.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	return &social.UserSummary{
		ID:        u.ID,
		Username:  u.Username,
		AvatarURL: u.AvatarURL,
	}, nil
}

type listSearchAdapter struct {
	catalogSvc *catalog.CatalogService
	userSvc    *users.UserService
}

func (a *listSearchAdapter) SearchLists(ctx context.Context, query string) ([]movies.ListSearchResult, error) {
	lists, err := a.catalogSvc.SearchLists(ctx, query)
	if err != nil {
		return nil, err
	}
	var results []movies.ListSearchResult
	for _, l := range lists {
		username := "Usuário Desconhecido"
		if user, err := a.userSvc.GetUserByID(ctx, l.UserID); err == nil && user != nil {
			username = user.Username
		}

		results = append(results, movies.ListSearchResult{
			ID:          l.ID,
			Title:       l.Title,
			Description: l.Description,
			Username:    username,
		})
	}
	return results, nil
}

type recommendationMovieAdapter struct {
	svc *movies.MovieService
}

func (a *recommendationMovieAdapter) GetByID(ctx context.Context, id int) (*recommendation.Movie, error) {
	movie, err := a.svc.GetMovieByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return recommendationMovie(movie), nil
}

func (a *recommendationMovieAdapter) GetByTMDBID(ctx context.Context, tmdbID int) (*recommendation.Movie, error) {
	movie, err := a.svc.GetMovieDetails(ctx, tmdbID)
	if err != nil {
		return nil, err
	}
	return recommendationMovie(movie), nil
}

func recommendationMovie(movie *movies.Movie) *recommendation.Movie {
	genres := make([]string, 0, len(movie.Genres))
	for _, genre := range movie.Genres {
		genres = append(genres, genre.Name)
	}

	year := movie.Year
	if year == 0 && !movie.ReleaseDate.IsZero() {
		year = movie.ReleaseDate.Year()
	}

	return &recommendation.Movie{
		ID:            movie.ID,
		TMDBID:        movie.TMDBID,
		Title:         movie.Title,
		OriginalTitle: movie.OriginalTitle,
		Overview:      movie.Overview,
		PosterURL:     movie.PosterURL,
		BackdropURL:   movie.BackdropURL,
		ReleaseDate:   movie.ReleaseDate,
		Year:          year,
		Runtime:       movie.Runtime,
		VoteAverage:   movie.VoteAverage,
		Genres:        genres,
	}
}

type sessionSearchAdapter struct {
	svc      bookings.Service
	movieSvc *movies.MovieService
	mgmtSvc  *cinema.CinemaService
}

func (a *sessionSearchAdapter) GetSessionPostData(ctx context.Context, sessionID uint) (*social.PostSessionData, error) {
	if a.svc == nil {
		return nil, errors.New("bookings service not initialized in adapter")
	}
	session, err := a.svc.GetSessionByID(ctx, int(sessionID))
	if err != nil {
		return nil, err
	}

	movieTitle := "Desconhecido"
	posterURL := ""
	if m, err := a.movieSvc.GetMovieDetails(ctx, session.MovieID); err == nil && m != nil {
		movieTitle = m.Title
		posterURL = m.PosterURL
	}

	cinemaName := "Desconhecido"
	if c, err := a.mgmtSvc.GetCinemaByID(ctx, session.Room.CinemaID); err == nil && c != nil {
		cinemaName = c.Name
	}

	return &social.PostSessionData{
		SessionID:  session.ID,
		MovieTitle: movieTitle,
		PosterURL:  posterURL,
		StartTime:  session.StartTime.Format("02/01 15:04"),
		RoomName:   session.Room.Name,
		CinemaName: cinemaName,
	}, nil
}
