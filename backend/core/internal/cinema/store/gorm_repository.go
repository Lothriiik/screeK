package store

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/cinema"
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

func (s *Store) CreateCinema(ctx context.Context, cinema *cinema.Cinema) error {
	record := ToCinemaRecord(cinema)
	err := s.db.WithContext(ctx).Create(record).Error
	cinema.CreatedAt = record.CreatedAt
	return err
}

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*cinema.Cinema, error) {
	var cinema CinemaRecord
	if err := s.db.WithContext(ctx).Preload("Rooms.Seats").First(&cinema, id).Error; err != nil {
		return nil, err
	}
	return ToCinemaDomain(&cinema), nil
}

func (s *Store) ListCinemas(ctx context.Context) ([]cinema.Cinema, error) {
	var records []CinemaRecord

	err := s.db.WithContext(ctx).Order("name asc").Find(&records).Error
	if err != nil {
		return nil, err
	}

	var cinemas []cinema.Cinema
	for i := range records {
		cleanCinema := ToCinemaDomain(&records[i])
		if cleanCinema != nil {
			cinemas = append(cinemas, *cleanCinema)
		}
	}
	return cinemas, nil
}

func (s *Store) CreateRoom(ctx context.Context, room *cinema.Room, seats []cinema.Seat) error {
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

func (s *Store) GetRoomByID(ctx context.Context, roomID int) (*cinema.Room, error) {
	var room RoomRecord
	err := s.db.WithContext(ctx).Preload("Cinema").First(&room, roomID).Error
	return ToRoomDomain(&room), err
}

func (s *Store) CreateSession(ctx context.Context, session *cinema.Session) error {
	record := ToSessionRecord(session)
	err := s.db.WithContext(ctx).Create(record).Error
	return err
}

func (s *Store) CreateSessionWithOverlapCheck(ctx context.Context, session *cinema.Session, movieRuntime int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var room cinema.Room
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&room, session.RoomID).Error; err != nil {
			return err
		}

		var existingSessions []struct {
			ID        int
			StartTime time.Time
			Runtime   int
		}
		startRange := session.StartTime.Truncate(24 * time.Hour)
		endRange := startRange.Add(24 * time.Hour)

		if err := tx.Table("sessions").
			Select("sessions.id, sessions.start_time, movies.runtime").
			Joins("JOIN movies ON movies.id = sessions.movie_id").
			Where("sessions.room_id = ? AND sessions.start_time >= ? AND sessions.start_time < ?", session.RoomID, startRange, endRange).
			Find(&existingSessions).Error; err != nil {
			return err
		}

		newStart := session.StartTime
		newEnd := newStart.Add(time.Duration(movieRuntime+15) * time.Minute)

		for _, es := range existingSessions {
			esStart := es.StartTime
			esEnd := esStart.Add(time.Duration(es.Runtime+15) * time.Minute)

			if newStart.Before(esEnd) && esStart.Before(newEnd) {
				return cinema.ErrSessionOverlap
			}
		}

		record := ToSessionRecord(session)
		err := tx.Create(record).Error
		session.ID = record.ID
		return err
	})
}

func (s *Store) ListSessions(ctx context.Context, cinemaID int, date string) ([]cinema.Session, error) {
	var records []SessionRecord
	query := s.db.WithContext(ctx).
		Joins("JOIN rooms r ON r.id = sessions.room_id").
		Where("r.cinema_id = ?", cinemaID)

	if date != "" {
		query = query.Where("sessions.start_time::date = ?", date)
	}

	err := query.Preload("Movie").Preload("Room").Order("sessions.start_time asc").Find(&records).Error
	if err != nil{
		return nil, err
	}

	var sessions []cinema.Session
	for i := range records {
		cleanSession := ToSessionDomain(&records[i])
		if cleanSession != nil {
			sessions = append(sessions, *cleanSession)
		}
	}

	return sessions, nil
}

func (s *Store) GetSessionsByRoom(ctx context.Context, roomID int, startTime time.Time) ([]cinema.Session, error) {
	var records []SessionRecord

	startRange := startTime.Truncate(24 * time.Hour)
	endRange := startRange.Add(24 * time.Hour)

	err := s.db.WithContext(ctx).
		Where("room_id = ? AND start_time >= ? AND start_time < ?", roomID, startRange, endRange).
		Preload("Movie").
		Find(&records).Error
	if err != nil{
		return nil, err
	}

	var sessions []cinema.Session
	for i := range records {
		cleanSession := ToSessionDomain(&records[i])
		if cleanSession != nil {
			sessions = append(sessions, *cleanSession)
		}
	}

	return sessions, nil
}

func (s *Store) UpdateCinema(ctx context.Context, cinema *cinema.Cinema) error {
	record := ToCinemaRecord(cinema)
	err := s.db.WithContext(ctx).Save(cinema).Error
	cinema.CreatedAt = record.CreatedAt
	return err
}

func (s *Store) DeleteCinema(ctx context.Context, id int) error {
	return s.db.WithContext(ctx).Delete(&cinema.Cinema{}, id).Error
}

func (s *Store) UpdateRoom(ctx context.Context, room *cinema.Room) error {
	record := ToRoomRecord(room)
	err := s.db.WithContext(ctx).Save(record).Error
	return err
}

func (s *Store) DeleteRoom(ctx context.Context, id int) error {
	return s.db.WithContext(ctx).Delete(&cinema.Room{}, id).Error
}

func (s *Store) UpdateSession(ctx context.Context, session *cinema.Session) error {
	record := ToSessionRecord(session)
	err := s.db.WithContext(ctx).Save(record).Error
	return err
}

func (s *Store) UpdateSessionWithOverlapCheck(ctx context.Context, session *cinema.Session, movieRuntime int) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&cinema.Room{}, session.RoomID).Error; err != nil {
			return err
		}

		var existingSessions []struct {
			ID        int
			StartTime time.Time
			Runtime   int
		}
		startRange := session.StartTime.Truncate(24 * time.Hour)
		endRange := startRange.Add(24 * time.Hour)

		if err := tx.Table("sessions").
			Select("sessions.id, sessions.start_time, movies.runtime").
			Joins("JOIN movies ON movies.id = sessions.movie_id").
			Where("sessions.room_id = ? AND sessions.start_time >= ? AND sessions.start_time < ? AND sessions.id != ?",
				session.RoomID, startRange, endRange, session.ID).
			Find(&existingSessions).Error; err != nil {
			return err
		}

		newStart := session.StartTime
		newEnd := newStart.Add(time.Duration(movieRuntime+15) * time.Minute)

		for _, es := range existingSessions {
			esStart := es.StartTime
			esEnd := esStart.Add(time.Duration(es.Runtime+15) * time.Minute)

			if newStart.Before(esEnd) && esStart.Before(newEnd) {
				return cinema.ErrSessionOverlap
			}
		}

		record := ToSessionRecord(session)
		return tx.Save(record).Error
	})
}

func (s *Store) GetSession(ctx context.Context, sessionID int) (*cinema.Session, error) {
	var record SessionRecord
	err := s.db.WithContext(ctx).Preload("Room").Preload("Room.Cinema").First(&record, sessionID).Error
	if err != nil {
		return nil, err
	}
	return ToSessionDomain(&record), nil
}

func (s *Store) DeleteSession(ctx context.Context, sessionID int) error {
	return s.db.WithContext(ctx).Delete(&SessionRecord{}, sessionID).Error
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
		Model(&CinemaManagerRecord{}).
		Where(&CinemaManagerRecord{UserID: userID, CinemaID: cinemaID}).
		Count(&count).Error
	return count > 0, err
}

func (s *Store) GetWatchlistMatches(ctx context.Context) ([]cinema.WatchlistMatch, error) {
	var matches []cinema.WatchlistMatch

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

func (s *Store) GetWatchlistMatchesForSession(ctx context.Context, sessionID int) ([]cinema.WatchlistMatch, error) {
	var matches []cinema.WatchlistMatch

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
