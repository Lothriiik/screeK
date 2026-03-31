package bookings

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func Test_integ_deve_rejeitar_sessao_com_conflito_sql(t *testing.T) {

	db := testutil.SetupTestDB(t)

	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, AutoMigrate(db))
	
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	store := NewStore(db)
	movieProv := new(MockMovieProvider)
	svc := NewService(store, nil, nil, nil, movieProv)

	cinema := &Cinema{Name: "Cine Alagoas", City: "Maceió", Address: "Rua X", Phone: "8299", Email: "cine@al.com"}
	require.NoError(t, store.CreateCinema(ctx, cinema))

	room := &Room{CinemaID: cinema.ID, Name: "Sala IMAX 1", Capacity: 50, Type: RoomTypeIMAX}
	require.NoError(t, store.CreateRoom(ctx, room, nil))

	adminID := uuid.New()
	user := &users.User{ID: adminID, Username: "manager_integ", Email: "m@m.com", Password: "hash", Role: "ADMIN"}
	require.NoError(t, db.Create(user).Error)
	require.NoError(t, db.Exec("INSERT INTO cinema_managers (user_id, cinema_id) VALUES (?, ?)", adminID, cinema.ID).Error)

	movie := &movies.Movie{ID: 101, Title: "Integração Fatal", Runtime: 120}
	require.NoError(t, db.Create(movie).Error)
	movieProv.On("GetMovieDetails", mock.Anything, 101).Return(movie, nil)

	start1 := time.Date(2026, 5, 20, 14, 0, 0, 0, time.UTC)
	err := svc.CreateSession(ctx, adminID, CreateSessionRequest{
		MovieID: 101, RoomID: room.ID, StartTime: start1, Price: 3000, SessionType: "REGULAR",
	})
	require.NoError(t, err)

	start2 := time.Date(2026, 5, 20, 15, 0, 0, 0, time.UTC)
	err = svc.CreateSession(ctx, adminID, CreateSessionRequest{
		MovieID: 101, RoomID: room.ID, StartTime: start2, Price: 3000, SessionType: "REGULAR",
	})

	assert.ErrorIs(t, err, ErrSessionOverlap)
}

func Test_integ_precos_calculados_no_db(t *testing.T) {
	db := testutil.SetupTestDB(t)
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb := goredis.NewClient(&goredis.Options{Addr: redisURL, DialTimeout: 100 * time.Millisecond})
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Skip("Redis não disponível, pulando teste de reserva")
	}
	rdb.FlushAll(ctx)

	store := NewStore(db)
	movieProv := new(MockMovieProvider)
	svc := NewService(store, rdb, nil, nil, movieProv)

	cinema := &Cinema{Name: "Cine Luxo", City: "Recife", Address: "Av Boa Viagem", Phone: "81", Email: "l@l.com"}
	store.CreateCinema(ctx, cinema)
	room := &Room{CinemaID: cinema.ID, Name: "Sala VIP 1", Capacity: 20, Type: RoomTypeVIP}
	seats := []Seat{{Row: "A", Number: 1, Type: "STANDARD", PosX: 0, PosY: 0}}
	require.NoError(t, store.CreateRoom(ctx, room, seats))
	
	movie := &movies.Movie{ID: 202, Title: "Preço de Ouro", Runtime: 100}
	require.NoError(t, db.Create(movie).Error)

	startTime := time.Now().Add(24 * time.Hour)
	session := &Session{MovieID: 202, RoomID: room.ID, StartTime: startTime, Price: 4000, SessionType: "REGULAR"}
	require.NoError(t, db.Create(session).Error)

	userID := uuid.New()
	require.NoError(t, db.Create(&users.User{ID: userID, Username: "buyer", Email: "b@b.com", Password: "hash"}).Error)

	ticketsReq := []TicketRequest{
		{SeatID: seats[0].ID, Type: TicketTypeStandard},
	}
	
	tx, err := svc.ReserveSeats(ctx, userID, session.ID, ticketsReq)
	require.NoError(t, err)
	assert.Equal(t, 6000, tx.TotalAmount)
	
	var dbTx Transaction
	db.Preload("Tickets").First(&dbTx, tx.ID)
	assert.Equal(t, 6000, dbTx.TotalAmount)
}

func Test_integ_concorrencia_reserva_assento(t *testing.T) {
	db := testutil.SetupTestDB(t)
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)
	ctx := context.Background()

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb := goredis.NewClient(&goredis.Options{Addr: redisURL})
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Skip("Redis indisponível")
	}
	rdb.FlushAll(ctx)

	store := NewStore(db)
	movieProv := new(MockMovieProvider)
	svc := NewService(store, rdb, nil, nil, movieProv)

	cinema := &Cinema{Name: "Cine Race", City: "SP", Address: "Interlagos", Phone: "11", Email: "r@r.com"}
	store.CreateCinema(ctx, cinema)
	room := &Room{CinemaID: cinema.ID, Name: "Sala 1", Capacity: 10, Type: RoomTypeStandard}
	seats := []Seat{{Row: "A", Number: 1, Type: "STANDARD", PosX: 0, PosY: 0}}
	require.NoError(t, store.CreateRoom(ctx, room, seats))
	
	movie := &movies.Movie{ID: 303, Title: "Corrida de Assentos", Runtime: 60}
	db.Create(movie)
	
	session := &Session{MovieID: 303, RoomID: room.ID, StartTime: time.Now().Add(1 * time.Hour), Price: 2000}
	db.Create(session)

	numUsers := 10
	var wg sync.WaitGroup
	results := make(chan error, numUsers)

	for i := 0; i < numUsers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			userID := uuid.New()
			db.Create(&users.User{ID: userID, Username: fmt.Sprintf("user_%d", id), Email: fmt.Sprintf("%d@u.com", id)})
			
			_, err := svc.ReserveSeats(ctx, userID, session.ID, []TicketRequest{{SeatID: seats[0].ID, Type: TicketTypeStandard}})
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
		}
	}

	assert.Equal(t, 1, successCount, "Apenas um usuário deveria conseguir reservar o assento")
	assert.True(t, errorCount >= (numUsers-1), "Os outros deveriam falhar por concorrência ou seat taken")
}

