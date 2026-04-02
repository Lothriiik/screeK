package management

import (
	"context"
	"time"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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

type WatchlistMatch struct {
	UserID     uuid.UUID
	MovieID    int
	MovieTitle string
	City       string
	Type       string
}

func (s *Store) GetWatchlistMatches(ctx context.Context) ([]WatchlistMatch, error) {
	var matches []WatchlistMatch
	
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
