package management

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) CreateCinema(ctx context.Context, cinema *domain.Cinema) error {
	return s.db.WithContext(ctx).Create(cinema).Error
}

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*domain.Cinema, error) {
	var cinema domain.Cinema
	if err := s.db.WithContext(ctx).Preload("Rooms.Seats").First(&cinema, id).Error; err != nil {
		return nil, err
	}
	return &cinema, nil
}

func (s *Store) ListCinemas(ctx context.Context) ([]domain.Cinema, error) {
	var cinemas []domain.Cinema
	err := s.db.WithContext(ctx).Order("name asc").Find(&cinemas).Error
	return cinemas, err
}

func (s *Store) CreateRoom(ctx context.Context, room *domain.Room, seats []domain.Seat) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(room).Error; err != nil {
			return err
		}

		if len(seats) > 0 {
			for i := range seats {
				seats[i].RoomID = room.ID
			}
			if err := tx.Create(&seats).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) GetRoomByID(ctx context.Context, roomID int) (*domain.Room, error) {
	var room domain.Room
	err := s.db.WithContext(ctx).Preload("Cinema").First(&room, roomID).Error
	return &room, err
}

func (s *Store) CreateSession(ctx context.Context, session *domain.Session) error {
	return s.db.WithContext(ctx).Create(session).Error
}

func (s *Store) CreateSessionWithOverlapCheck(ctx context.Context, session *domain.Session, movieRuntime int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var room domain.Room
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&room, session.RoomID).Error; err != nil {
			return err
		}

		var existingSessions []domain.Session
		startRange := session.StartTime.Truncate(24 * time.Hour)
		endRange := startRange.Add(24 * time.Hour)

		if err := tx.Where("room_id = ? AND start_time >= ? AND start_time < ?", session.RoomID, startRange, endRange).
			Preload("Movie").
			Find(&existingSessions).Error; err != nil {
			return err
		}

		newStart := session.StartTime
		newEnd := newStart.Add(time.Duration(movieRuntime+15) * time.Minute)

		for _, es := range existingSessions {
			esStart := es.StartTime
			esEnd := esStart.Add(time.Duration(es.Movie.Runtime+15) * time.Minute)

			if newStart.Before(esEnd) && esStart.Before(newEnd) {
				return ErrSessionOverlap
			}
		}

		return tx.Create(session).Error
	})
}

func (s *Store) ListSessions(ctx context.Context, cinemaID int, date string) ([]domain.Session, error) {
	var sessions []domain.Session
	query := s.db.WithContext(ctx).
		Joins("JOIN rooms r ON r.id = sessions.room_id").
		Where("r.cinema_id = ?", cinemaID)

	if date != "" {
		query = query.Where("sessions.start_time::date = ?", date)
	}

	err := query.Preload("Movie").Preload("Room").Order("sessions.start_time asc").Find(&sessions).Error
	return sessions, err
}

func (s *Store) GetSessionsByRoom(ctx context.Context, roomID int, startTime time.Time) ([]domain.Session, error) {
	var sessions []domain.Session
	
	startRange := startTime.Truncate(24 * time.Hour)
	endRange := startRange.Add(24 * time.Hour)
	
	err := s.db.WithContext(ctx).
		Where("room_id = ? AND start_time >= ? AND start_time < ?", roomID, startRange, endRange).
		Preload("Movie").
		Find(&sessions).Error
	return sessions, err
}

func (s *Store) UpdateCinema(ctx context.Context, cinema *domain.Cinema) error {
	return s.db.WithContext(ctx).Save(cinema).Error
}

func (s *Store) DeleteCinema(ctx context.Context, id int) error {
	return s.db.WithContext(ctx).Delete(&domain.Cinema{}, id).Error
}

func (s *Store) UpdateRoom(ctx context.Context, room *domain.Room) error {
	return s.db.WithContext(ctx).Save(room).Error
}

func (s *Store) DeleteRoom(ctx context.Context, id int) error {
	return s.db.WithContext(ctx).Delete(&domain.Room{}, id).Error
}

func (s *Store) UpdateSession(ctx context.Context, session *domain.Session) error {
	return s.db.WithContext(ctx).Save(session).Error
}

func (s *Store) UpdateSessionWithOverlapCheck(ctx context.Context, session *domain.Session, movieRuntime int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&domain.Room{}, session.RoomID).Error; err != nil {
			return err
		}

		var existingSessions []domain.Session
		startRange := session.StartTime.Truncate(24 * time.Hour)
		endRange := startRange.Add(24 * time.Hour)

		if err := tx.Where("room_id = ? AND start_time >= ? AND start_time < ? AND id != ?",
			session.RoomID, startRange, endRange, session.ID).
			Preload("Movie").
			Find(&existingSessions).Error; err != nil {
			return err
		}

		newStart := session.StartTime
		newEnd := newStart.Add(time.Duration(movieRuntime+15) * time.Minute)

		for _, es := range existingSessions {
			esStart := es.StartTime
			esEnd := esStart.Add(time.Duration(es.Movie.Runtime+15) * time.Minute)

			if newStart.Before(esEnd) && esStart.Before(newEnd) {
				return ErrSessionOverlap
			}
		}

		return tx.Save(session).Error
	})
}

func (s *Store) GetSession(ctx context.Context, sessionID int) (*domain.Session, error) {
	var session domain.Session
	err := s.db.WithContext(ctx).First(&session, sessionID).Error
	return &session, err
}

func (s *Store) DeleteSession(ctx context.Context, sessionID int) error {
	return s.db.WithContext(ctx).Delete(&domain.Session{}, sessionID).Error
}

func (s *Store) GetSessionBookingsCount(ctx context.Context, sessionID int) (int, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Table("tickets").
		Where("session_id = ? AND status != ?", sessionID, "CANCELLED").
		Count(&count).Error
	return int(count), err
}

func (s *Store) IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Model(&domain.CinemaManager{}).
		Where(&domain.CinemaManager{UserID: userID, CinemaID: cinemaID}).
		Count(&count).Error
	return count > 0, err
}


func (s *Store) GetWatchlistMatches(ctx context.Context) ([]domain.WatchlistMatch, error) {
	var matches []domain.WatchlistMatch
	
	query := `
		SELECT DISTINCT 
			wi.user_id, 
			wi.movie_id, 
			m.title as movie_title, 
			u.default_city as city,
			s.session_type as type
		FROM watchlist_items wi
		JOIN movies m ON wi.movie_id = m.id
		JOIN users u ON wi.user_id = u.id
		JOIN sessions s ON s.movie_id = wi.movie_id
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE c.city = u.default_city
		  AND s.start_time > now()
		  AND s.created_at >= now() - interval '24 hours'
	`
	
	err := s.db.WithContext(ctx).Raw(query).Scan(&matches).Error
	return matches, err
}

func (s *Store) GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]domain.WatchlistMatch, error) {
	var matches []domain.WatchlistMatch
	
	query := `
		SELECT 
			wi.user_id, 
			wi.movie_id, 
			m.title as movie_title, 
			u.default_city as city,
			s.session_type as type
		FROM sessions s
		JOIN movies m ON s.movie_id = m.id
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		JOIN watchlist_items wi ON wi.movie_id = s.movie_id
		JOIN users u ON wi.user_id = u.id
		WHERE s.id = ? 
		  AND c.city = u.default_city
	`
	
	err := s.db.WithContext(ctx).Raw(query, sessionID).Scan(&matches).Error
	return matches, err
}
