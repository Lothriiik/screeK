package management_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/StartLivin/screek/backend/internal/domain"
	"github.com/StartLivin/screek/backend/internal/management"
	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/bookings"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStore_Integracao(t *testing.T) {
	db := testutil.SetupTestDB(t)
	
	db.Migrator().DropTable(&domain.CinemaManager{}, &domain.Session{}, &bookings.Ticket{}, &bookings.Transaction{})
	domain.AutoMigrate(db)
	movies.AutoMigrate(db)
	bookings.AutoMigrate(db)
	
	testutil.CleanupDB(t, db)
	store := management.NewStore(db)
	ctx := context.Background()

	t.Run("Gestão de Cinema e Sala", func(t *testing.T) {
		cinema := &domain.Cinema{Name: "Store Cinema", City: "Store City"}
		require.NoError(t, store.CreateCinema(ctx, cinema))
		require.NotZero(t, cinema.ID)

		// Teste explícito de IsManager
		userID := uuid.New()
		db.Create(&domain.CinemaManager{UserID: userID, CinemaID: cinema.ID})
		
		isManager, err := store.IsManagerOfCinema(ctx, userID, cinema.ID)
		require.NoError(t, err)
		assert.True(t, isManager, "Deveria ser gerente")
	})

	t.Run("Ciclo de Vida da Sessão", func(t *testing.T) {
		cinema := &domain.Cinema{Name: "Sessao Cinema"}
		db.Create(cinema)
		room := &domain.Room{CinemaID: cinema.ID, Name: "Sala Sessao"}
		db.Create(room)
		
		// Criar filme real para evitar FK violation se houver constraints ativas
		movie := movies.Movie{Title: "Movie A", TMDBID: 999}
		db.Create(&movie)

		session := &domain.Session{
			MovieID: movie.ID,
			RoomID:  room.ID,
			Price:   1500,
		}

		// Create
		require.NoError(t, store.CreateSession(ctx, session))
		require.NotZero(t, session.ID)

		// Get & Count Bookings
		count, err := store.GetSessionBookingsCount(ctx, session.ID)
		require.NoError(t, err)
		assert.Equal(t, 0, count)

		// Simular ticket via Model real
		user := users.User{ID: uuid.New(), Email: "test@test.com", Username: "tester"}
		require.NoError(t, db.Create(&user).Error)

		tx := bookings.Transaction{ID: uuid.New(), UserID: user.ID, Status: bookings.TicketStatusPaid}
		require.NoError(t, db.Create(&tx).Error)
		ticket := bookings.Ticket{
			ID:            uuid.New(),
			TransactionID: tx.ID,
			SessionID:     session.ID,
			Status:        bookings.TicketStatusPaid,
			QRCode:        uuid.New().String(),
		}
		require.NoError(t, db.Create(&ticket).Error)
		
		count2, _ := store.GetSessionBookingsCount(ctx, session.ID)
		assert.Equal(t, 1, count2)

		// Delete (Limpar dependências primeiro para testar a remoção da sessão)
		db.Exec("DELETE FROM tickets WHERE session_id = ?", session.ID)
		db.Exec("DELETE FROM transactions WHERE id = ?", tx.ID)
		
		err = store.DeleteSession(ctx, session.ID)
		require.NoError(t, err)
	})

	t.Run("Limites de Capacidade da Sala (1 - 1000)", func(t *testing.T) {
		cinema := &domain.Cinema{Name: "Mega Cine", City: "SP"}
		db.Create(cinema)

		// Cenário: 1000 assentos
		numSeats := 1000
		room := &domain.Room{CinemaID: cinema.ID, Name: "Sala IMAX 1000", Capacity: numSeats}
		
		var seats []domain.Seat
		for i := 1; i <= numSeats; i++ {
			seats = append(seats, domain.Seat{
				Row:    fmt.Sprintf("%c", 'A' + (i/20)),
				Number: i % 20,
			})
		}

		err := store.CreateRoom(ctx, room, seats)
		require.NoError(t, err)
		assert.NotZero(t, room.ID)

		var count int64
		db.Model(&domain.Seat{}).Where("room_id = ?", room.ID).Count(&count)
		assert.Equal(t, int64(numSeats), count)
	})
}
