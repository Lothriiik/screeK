package analytics

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_integ_analytics_consolidation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}
	db := testutil.SetupTestDB(t)
	require.NoError(t, domain.AutoMigrate(db))
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, bookings.AutoMigrate(db))
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)

	repo := NewStore(db)
	svc := NewService(repo, nil)
	ctx := context.Background()

	// 1. Setup Data
	loc, _ := time.LoadLocation("America/Sao_Paulo")
	yesterday := time.Now().In(loc).AddDate(0, 0, -1)
	yesterdayStr := yesterday.Format("2006-01-02")
	
	cinema := &domain.Cinema{Name: "Cine Analytics", City: "Recife"}
	db.Create(cinema)
	room := &domain.Room{CinemaID: cinema.ID, Name: "Sala 1", Capacity: 100}
	db.Create(room)
	movie := &movies.Movie{TMDBID: 101, Title: "Analytics Movie"}
	db.Create(movie)
	
	session := &domain.Session{
		MovieID: movie.ID, 
		RoomID: room.ID, 
		StartTime: yesterday, 
		Price: 2000,
	}
	db.Create(session)
	// Forçar start_time para garantir que caia no 'ontem' do DB
	db.Exec("UPDATE sessions SET start_time = ?::timestamp", yesterdayStr + " 20:00:00")

	user := &users.User{ID: uuid.New(), Email: "analytics@test.com", Username: "aluno", Password: "123"}
	db.Create(user)

	tx := &bookings.Transaction{
		ID:            uuid.New(),
		UserID:        user.ID,
		TotalAmount:   20000,
		Status:        bookings.TicketStatusPaid,
		PaymentMethod: "STRIPE",
	}
	require.NoError(t, db.Create(tx).Error)

	for i := 0; i < 10; i++ {
		ticket := &bookings.Ticket{
			ID:            uuid.New(),
			TransactionID: tx.ID,
			SessionID:     session.ID,
			Status:        bookings.TicketStatusPaid,
			PricePaid:     2000,
			QRCode:        uuid.New().String(),
		}
		require.NoError(t, db.Create(ticket).Error)
	}

	// 2. Action
	err := svc.RunAnalyticsAggregation(ctx, yesterday)
	require.NoError(t, err)

	// 3. Assert Cinema Stats
	var cinemaStats []DailyCinemaStats
	db.Where("cinema_id = ?", cinema.ID).Find(&cinemaStats)
	require.Len(t, cinemaStats, 1, "Deveria ter 1 registro de stats para o cinema")
	assert.Equal(t, int64(20000), cinemaStats[0].TotalRevenue)
	assert.Equal(t, 10, cinemaStats[0].TicketsSold)
	assert.Equal(t, 0.1, cinemaStats[0].OccupancyRate)

	// 4. Assert Movie Stats
	var movieStats []DailyMovieStats
	db.Where("movie_id = ?", movie.ID).Find(&movieStats)
	require.Len(t, movieStats, 1, "Deveria ter 1 registro de stats para o filme")
	assert.Equal(t, int64(20000), movieStats[0].TotalRevenue)
	assert.Equal(t, 10, movieStats[0].TicketsSold)
}
