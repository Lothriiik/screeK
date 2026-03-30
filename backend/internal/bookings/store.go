package bookings

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var _ BookingsRepository = (*Store)(nil)
var _ AnalyticsRepository = (*Store)(nil)

var (
	ErrSeatAlreadyTaken    = errors.New("uma ou mais cadeiras já foram compradas ou estão no carrinho de outra pessoa")
	ErrTransactionNotFound = errors.New("transação pendente não encontrada ou você não tem permissão")
	ErrTicketNotFound      = errors.New("ingresso não encontrado ou já cancelado")
	ErrTxNotFound          = errors.New("transação não encontrada")
	ErrNotTicketOwner      = errors.New("você não é o dono deste ingresso")
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetCinemaByID(ctx context.Context, id int) (*Cinema, error) {
	var cinema Cinema
	if err := s.db.WithContext(ctx).Preload("Rooms").First(&cinema, id).Error; err != nil {
		return nil, err
	}
	return &cinema, nil
}

func (s *Store) GetMoviesPlaying(ctx context.Context, city string, date string) ([]movies.Movie, error) {
	var moviesList []movies.Movie

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}
	endOfDay := parsedDate.Add(24 * time.Hour)

	query := `
		SELECT DISTINCT m.* 
		FROM movies m
		JOIN sessions s ON s.movie_id = m.id
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE c.city ILIKE ? 
		  AND s.start_time >= ? 
		  AND s.start_time < ?
	`
	err = s.db.WithContext(ctx).Preload("Genres").Raw(query, city, parsedDate, endOfDay).Find(&moviesList).Error

	if err != nil {
		return nil, err
	}
	return moviesList, nil
}

func (s *Store) GetSessionsByMovie(ctx context.Context, movieID int, city string, date string) ([]Session, error) {
	var sessions []Session

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}
	endOfDay := parsedDate.Add(24 * time.Hour)

	query := `
		SELECT s.* 
		FROM sessions s
		JOIN rooms r ON r.id = s.room_id
		JOIN cinemas c ON c.id = r.cinema_id
		WHERE s.movie_id = ? 
		  AND c.city ILIKE ? 
		  AND s.start_time >= ? 
		  AND s.start_time < ?
	`
	err = s.db.WithContext(ctx).Preload("Room").Preload("Room.Cinema").Raw(query, movieID, city, parsedDate, endOfDay).Find(&sessions).Error
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

func (s *Store) GetSeatsBySession(ctx context.Context, sessionID int) ([]Seat, error) {
	var seats []Seat
	var roomID int

	if err := s.db.WithContext(ctx).Model(&Session{}).Select("room_id").Where("id = ?", sessionID).Scan(&roomID).Error; err != nil {
		return nil, err
	}

	query := `
		SELECT 
			s.*, 
			CASE WHEN t.id IS NOT NULL THEN true ELSE false END as is_occupied
		FROM seats s
		LEFT JOIN tickets t ON t.seat_id = s.id 
			AND t.session_id = ? 
			AND t.status != 'CANCELLED'
		WHERE s.room_id = ?
		ORDER BY s.row, s.number
	`
	err := s.db.WithContext(ctx).Raw(query, sessionID, roomID).Scan(&seats).Error

	if err != nil {
		return nil, err
	}

	return seats, nil
}

func (s *Store) GetSessionByID(ctx context.Context, sessionID int) (*Session, error) {
	var session Session
	if err := s.db.WithContext(ctx).First(&session, sessionID).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (s *Store) CreateReservation(ctx context.Context, userID uuid.UUID, sessionID int, ticketsToCreate []Ticket, totalAmount int) (*Transaction, error) {
	var transaction Transaction

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		var seatIDs []int
		for _, t := range ticketsToCreate {
			seatIDs = append(seatIDs, *t.SeatID)
		}

		var occupiedCount int64
		if err := tx.Model(&Ticket{}).Where("seat_id IN ? AND session_id = ? AND status != 'CANCELLED'", seatIDs, sessionID).Count(&occupiedCount).Error; err != nil {
			return err
		}
		if occupiedCount > 0 {
			return ErrSeatAlreadyTaken
		}

		transaction = Transaction{
			ID:            uuid.New(),
			UserID:        userID,
			TotalAmount:   totalAmount,
			Status:        TicketStatusPending,
			PaymentMethod: "NONE",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		for i := range ticketsToCreate {
			ticketsToCreate[i].TransactionID = transaction.ID
			if err := tx.Create(&ticketsToCreate[i]).Error; err != nil {
				return err
			}
			transaction.Tickets = append(transaction.Tickets, ticketsToCreate[i])
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (s *Store) GetTransactionByID(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) (*Transaction, error) {
	var transaction Transaction
	if err := s.db.WithContext(ctx).Preload("User").Preload("Tickets").Where("id = ? AND user_id = ?", transactionID, userID).First(&transaction).Error; err != nil {
		return nil, ErrTxNotFound
	}
	return &transaction, nil
}

func (s *Store) PayTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, method string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var transaction Transaction
		if err := tx.Where("id = ? AND user_id = ? AND status = ?", transactionID, userID, TicketStatusPending).First(&transaction).Error; err != nil {
			return ErrTransactionNotFound
		}

		transaction.Status = TicketStatusPaid
		transaction.PaymentMethod = method
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}

		var tickets []Ticket
		if err := tx.Where("transaction_id = ?", transactionID).Find(&tickets).Error; err != nil {
			return err
		}

		for _, ticket := range tickets {
			qrCode := fmt.Sprintf("SCREEK-TX%s-TK%s-%d", transactionID.String()[:8], ticket.ID.String()[:8], time.Now().UnixNano())

			ticket.Status = TicketStatusPaid
			ticket.QRCode = qrCode

			if err := tx.Save(&ticket).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Store) CancelTicket(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var ticket Ticket
		if err := tx.Where("id = ? AND status != ?", ticketID, TicketStatusCancelled).First(&ticket).Error; err != nil {
			return ErrTicketNotFound
		}
		var transaction Transaction
		if err := tx.First(&transaction, ticket.TransactionID).Error; err != nil {
			return ErrTxNotFound
		}

		if transaction.UserID != userID {
			return ErrNotTicketOwner
		}

		ticket.Status = TicketStatusCancelled
		return tx.Save(&ticket).Error
	})
}

func (s *Store) GetUserTickets(ctx context.Context, userID uuid.UUID, status string) ([]Ticket, error) {
	var tickets []Ticket
	query := s.db.WithContext(ctx).Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").Where("trx.user_id = ?", userID)

	if status != "" {
		query = query.Where("tickets.status = ?", status)
	}

	err := query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").Find(&tickets).Error

	return tickets, err
}

func (s *Store) GetTicketDetail(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID) (*Ticket, error) {
	var ticket Ticket
	query := s.db.WithContext(ctx).
		Joins("JOIN transactions trx ON trx.id = tickets.transaction_id").
		Where("tickets.id = ? AND trx.user_id = ?", ticketID, userID)

	err := query.Preload("Seat").Preload("Session.Movie").Preload("Session.Room.Cinema").First(&ticket).Error

	return &ticket, err
}

func (s *Store) CreateCinema(ctx context.Context, cinema *Cinema) error {
	return s.db.WithContext(ctx).Create(cinema).Error
}

func (s *Store) CreateRoom(ctx context.Context, room *Room, seats []Seat) error {
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

func (s *Store) CreateSession(ctx context.Context, session *Session) error {
	return s.db.WithContext(ctx).Create(session).Error
}

func (s *Store) DeleteSession(ctx context.Context, sessionID int) error {
	return s.db.WithContext(ctx).Delete(&Session{}, sessionID).Error
}

func (s *Store) GetSessionsByRoom(ctx context.Context, roomID int, startTime time.Time) ([]Session, error) {
	var sessions []Session
	date := startTime.Format("2006-01-02")
	
	err := s.db.WithContext(ctx).
		Where("room_id = ? AND DATE(start_time) = ?", roomID, date).
		Preload("Movie").
		Find(&sessions).Error
	return sessions, err
}

func (s *Store) GetRoomByID(ctx context.Context, roomID int) (*Room, error) {
	var room Room
	err := s.db.WithContext(ctx).Preload("Cinema").First(&room, roomID).Error
	return &room, err
}

func (s *Store) IsManagerOfCinema(ctx context.Context, userID uuid.UUID, cinemaID int) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Table("cinema_managers").
		Where("user_id = ? AND cinema_id = ?", userID, cinemaID).
		Count(&count).Error
	return count > 0, err
}

func (s *Store) ListCinemas(ctx context.Context) ([]Cinema, error) {
	var cinemas []Cinema
	err := s.db.WithContext(ctx).Order("name asc").Find(&cinemas).Error
	return cinemas, err
}

func (s *Store) ListSessions(ctx context.Context, cinemaID int, date string) ([]Session, error) {
	var sessions []Session
	query := s.db.WithContext(ctx).
		Joins("JOIN rooms r ON r.id = sessions.room_id").
		Where("r.cinema_id = ?", cinemaID)

	if date != "" {
		query = query.Where("sessions.start_time::date = ?", date)
	}

	err := query.Preload("Movie").Preload("Room").Order("sessions.start_time asc").Find(&sessions).Error
	return sessions, err
}

func (s *Store) CalculateDailyStats(ctx context.Context, date time.Time) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats

	query := `
		WITH session_occupancy AS (
			SELECT 
				s.id as session_id,
				r.cinema_id,
				r.capacity,
				COUNT(t.id) as tickets_count,
				COALESCE(SUM(t.price_paid), 0) as session_revenue
			FROM sessions s
			JOIN rooms r ON s.room_id = r.id
			LEFT JOIN tickets t ON t.session_id = s.id AND t.status = 'PAID'
			WHERE date(s.start_time) = date(?)
			GROUP BY s.id, r.cinema_id, r.capacity
		)
		SELECT 
			date(?) as date,
			cinema_id,
			SUM(session_revenue) as total_revenue,
			SUM(tickets_count) as tickets_sold,
			AVG(CAST(tickets_count AS FLOAT) / capacity) as occupancy_rate
		FROM session_occupancy
		GROUP BY cinema_id
	`

	err := s.db.WithContext(ctx).Raw(query, date, date).Scan(&stats).Error
	if err != nil {
		return nil, err
	}

	return stats, nil
}

func (s *Store) UpsertDailyStats(ctx context.Context, stats []DailyCinemaStats) error {
	if len(stats) == 0 {
		return nil
	}
	return s.db.WithContext(ctx).Save(&stats).Error
}

func (s *Store) GetStatsByDateRange(ctx context.Context, start, end time.Time) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats
	err := s.db.WithContext(ctx).
		Preload("Cinema").
		Where("date BETWEEN ? AND ?", start, end).
		Order("date DESC, total_revenue DESC").
		Find(&stats).Error
	return stats, err
}

func (s *Store) CalculateDailyMovieStats(ctx context.Context, date time.Time) ([]DailyMovieStats, error) {
	var stats []DailyMovieStats
	query := `
		SELECT 
			date(?) as date,
			movie_id,
			SUM(price_paid) as total_revenue,
			COUNT(id) as tickets_sold
		FROM tickets t
		JOIN sessions s ON t.session_id = s.id
		WHERE t.status = 'PAID' AND date(t.created_at) = date(?)
		GROUP BY movie_id
	`
	err := s.db.WithContext(ctx).Raw(query, date, date).Scan(&stats).Error
	return stats, err
}

func (s *Store) UpsertDailyMovieStats(ctx context.Context, stats []DailyMovieStats) error {
	if len(stats) == 0 {
		return nil
	}
	return s.db.WithContext(ctx).Save(&stats).Error
}

func (s *Store) GetTopMoviesByDateRange(ctx context.Context, start, end time.Time, limit int) ([]DailyMovieStats, error) {
	var stats []DailyMovieStats
	err := s.db.WithContext(ctx).
		Table("daily_movie_stats").
		Select("movie_id, SUM(total_revenue) as total_revenue, SUM(tickets_sold) as tickets_sold").
		Where("date BETWEEN ? AND ?", start, end).
		Group("movie_id").
		Order("total_revenue DESC").
		Limit(limit).
		Scan(&stats).Error
	return stats, err
}

func (s *Store) GetGenreStats(ctx context.Context, start, end time.Time) (map[string]float64, error) {
	type Result struct {
		Name    string
		Revenue int
	}
	var results []Result

	query := `
		SELECT g.name, SUM(ms.total_revenue) as revenue
		FROM daily_movie_stats ms
		JOIN movie_genres mg ON mg.movie_id = ms.movie_id
		JOIN genres g ON g.id = mg.genre_id
		WHERE ms.date BETWEEN ? AND ?
		GROUP BY g.name
	`
	err := s.db.WithContext(ctx).Raw(query, start, end).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	stats := make(map[string]float64)
	for _, r := range results {
		stats[r.Name] = float64(r.Revenue) / 100.0
	}
	return stats, nil
}

func (s *Store) GetRevenueTrends(ctx context.Context, start, end time.Time, period string) ([]DailyCinemaStats, error) {
	var stats []DailyCinemaStats
	trunc := "day"
	if period == "month" {
		trunc = "month"
	} else if period == "year" {
		trunc = "year"
	}

	query := fmt.Sprintf(`
		SELECT date_trunc('%s', date) as date, SUM(total_revenue) as total_revenue, SUM(tickets_sold) as tickets_sold
		FROM daily_cinema_stats
		WHERE date BETWEEN ? AND ?
		GROUP BY 1
		ORDER BY 1 ASC
	`, trunc)

	err := s.db.WithContext(ctx).Raw(query, start, end).Scan(&stats).Error
	return stats, err
}

func (s *Store) GetSpecialStatusForMovies(ctx context.Context, city string, movieIDs []int) (map[int]map[string]bool, error) {
	if len(movieIDs) == 0 {
		return make(map[int]map[string]bool), nil
	}

	type Result struct {
		MovieID     int
		SessionType SessionType
	}
	var results []Result

	query := `
		SELECT s.movie_id, s.session_type
		FROM sessions s
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE c.city = ? AND s.movie_id IN (?) AND s.session_type IN ('PREMIERE', 'RESCREENING')
		AND s.start_time >= now()
	`
	err := s.db.WithContext(ctx).Raw(query, city, movieIDs).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	statusMap := make(map[int]map[string]bool)
	for _, mID := range movieIDs {
		statusMap[mID] = map[string]bool{"premiere": false, "rescreening": false}
	}

	for _, r := range results {
		if r.SessionType == SessionTypePremiere {
			statusMap[r.MovieID]["premiere"] = true
		} else if r.SessionType == SessionTypeRescreen {
			statusMap[r.MovieID]["rescreening"] = true
		}
	}

	return statusMap, nil
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
		SELECT 
			wi.user_id, 
			wi.movie_id, 
			m.title as movie_title, 
			u.default_city as city,
			s.session_type as type
		FROM watchlist_items wi
		JOIN users u ON wi.user_id = u.id
		JOIN movies m ON wi.movie_id = m.id
		JOIN sessions s ON s.movie_id = m.id
		JOIN rooms r ON s.room_id = r.id
		JOIN cinemas c ON r.cinema_id = c.id
		WHERE u.default_city = c.city 
		AND s.session_type IN ('PREMIERE', 'RESCREENING')
		AND s.start_time >= now()
		AND s.start_time <= (now() + interval '48 hours')
		GROUP BY 1, 2, 3, 4, 5
	`
	err := s.db.WithContext(ctx).Raw(query).Scan(&matches).Error
	return matches, err
}

func (s *Store) CleanupExpiredReservations(ctx context.Context) (int64, int64, error) {
	cutoff := time.Now().Add(-10 * time.Minute)
	var ticketsDeleted, transactionsDeleted int64

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res1 := tx.Where(
			"transaction_id IN (SELECT id FROM transactions WHERE status = ? AND created_at < ?)",
			TicketStatusPending, cutoff,
		).Delete(&Ticket{})
		if res1.Error != nil {
			return res1.Error
		}
		ticketsDeleted = res1.RowsAffected

		res2 := tx.Where(
			"status = ? AND created_at < ?",
			TicketStatusPending, cutoff,
		).Delete(&Transaction{})
		if res2.Error != nil {
			return res2.Error
		}
		transactionsDeleted = res2.RowsAffected

		return nil
	})

	return ticketsDeleted, transactionsDeleted, err
}
