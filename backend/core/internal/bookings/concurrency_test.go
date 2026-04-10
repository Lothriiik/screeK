package bookings_test

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/bookings"
	bookingstore "github.com/StartLivin/screek/backend/internal/bookings/store"
	"github.com/StartLivin/screek/backend/internal/cinema/domain"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/shared/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Bookings_Concurrency_SeatSelection_RealRedis(t *testing.T) {
	if testing.Short() {
		t.Skip("Pulando teste de integração no modo short")
	}

	db := testutil.SetupTestDB(t)
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, bookings.AutoMigrate(db))
	testutil.CleanupDB(t, db)

	rdb := testutil.SetupTestRedis(t)
	defer testutil.CleanupRedis(t, rdb)

	mockPayment := new(bookings.MockPayment)
	mockMailer := new(bookings.MockMailer)
	mockMovieSvc := new(bookings.MockMovieProvider)

	svc := bookings.NewService(bookingstore.NewStore(db), rdb, mockPayment, mockMailer, mockMovieSvc, nil)
	require.NoError(t, domain.AutoMigrate(db))

	cinema := domain.Cinema{Name: "Concurrency Cinema", City: "Test City", Address: "123 Street", Phone: "123", Email: "c@test.com"}
	require.NoError(t, db.Create(&cinema).Error)
	require.NotZero(t, cinema.ID)

	room := domain.Room{CinemaID: cinema.ID, Name: "Room 1", Capacity: 100, Type: domain.RoomTypeStandard}
	require.NoError(t, db.Create(&room).Error)
	require.NotZero(t, room.ID)

	movie := movies.Movie{TMDBID: 12345, Title: "Concurrency Movie", Runtime: 120, ReleaseDate: time.Now()}
	require.NoError(t, db.Create(&movie).Error)

	session := domain.Session{MovieID: movie.ID, RoomID: room.ID, StartTime: time.Now().Add(2 * time.Hour), Price: 5000}
	require.NoError(t, db.Create(&session).Error)

	seat := domain.Seat{RoomID: room.ID, Row: "A", Number: 1, Type: "STANDARD"}
	require.NoError(t, db.Create(&seat).Error)

	const numConsumers = 50
	var wg sync.WaitGroup
	wg.Add(numConsumers)

	results := make(chan error, numConsumers)

	userIDs := make([]uuid.UUID, numConsumers)
	for i := 0; i < numConsumers; i++ {
		uid := uuid.New()
		u := users.User{ID: uid, Username: fmt.Sprintf("user%d", i), Email: fmt.Sprintf("user%d@test.com", i), Password: "hash"}
		require.NoError(t, db.Create(&u).Error)
		userIDs[i] = uid
	}

	for i := 0; i < numConsumers; i++ {
		go func(idx int) {
			defer wg.Done()

			req := []bookings.TicketRequest{
				{SeatID: seat.ID, Type: "STANDARD"},
			}

			_, err := svc.ReserveSeats(context.Background(), userIDs[idx], session.ID, req)
			results <- err
		}(i)
	}

	wg.Wait()
	close(results)

	successCount := 0
	errorCount := 0
	for err := range results {
		if err == nil {
			successCount++
		} else {
			errorCount++
			assert.ErrorIs(t, err, bookings.ErrSeatLockFailed)
		}
	}

	assert.Equal(t, 1, successCount, "Deveria haver exatamente 1 reserva bem-sucedida para o mesmo assento")
	assert.Equal(t, numConsumers-1, errorCount, "Todas as outras requisições deveriam falhar por lock no Redis")
}
