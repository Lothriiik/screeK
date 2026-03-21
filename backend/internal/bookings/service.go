package bookings

import (
	"sort"

	"github.com/StartLivin/cine-pass/backend/internal/movies"
)

type BookingsService interface {
	GetMoviesPlaying(city, date string) ([]movies.Movie, error)
	GetMovieSessionsGroupedByCinema(movieID int, city, date string) ([]CinemaSessionsResponse, error)
	GetSeatsBySession(sessionID int) ([]Seat, error)
}

type service struct {
	store BookingsRepository
}

func NewService(store BookingsRepository) BookingsService {
	return &service{
		store: store,
	}
}

func (s *service) GetMoviesPlaying(city, date string) ([]movies.Movie, error) {
	return s.store.GetMoviesPlaying(city, date)
}

func (s *service) GetMovieSessionsGroupedByCinema(movieID int, city, date string) ([]CinemaSessionsResponse, error) {
	sessions, err := s.store.GetSessionsByMovie(movieID, city, date)
	if err != nil {
		return nil, err
	}

	groupedMap := make(map[int]*CinemaSessionsResponse)

	for _, session := range sessions {
		cinema := session.Room.Cinema
		id := cinema.ID

		if _, exists := groupedMap[id]; !exists {
			groupedMap[id] = &CinemaSessionsResponse{
				CinemaID:   cinema.ID,
				CinemaName: cinema.Name,
				CinemaCity: cinema.City,
				Sessions:   []SessionResponse{},
			}
		}

		groupedMap[id].Sessions = append(groupedMap[id].Sessions, SessionResponse{
			ID:          session.ID,
			StartTime:   session.StartTime,
			Price:       session.Price,
			RoomType:    session.Room.Type,
			SessionType: session.SessionType,
		})
	}

	var response []CinemaSessionsResponse
	for _, v := range groupedMap {
		response = append(response, *v)
	}

	sort.Slice(response, func(i, j int) bool {
		return response[i].CinemaName < response[j].CinemaName
	})

	return response, nil
}

func (s *service) GetSeatsBySession(sessionID int) ([]Seat, error) {
	return s.store.GetSeatsBySession(sessionID)
}
