package bookings

import (
	"context"
	"testing"
	"time"

	"github.com/StartLivin/screek/backend/internal/movies"
	"github.com/StartLivin/screek/backend/internal/platform/testutil"
	"github.com/StartLivin/screek/backend/internal/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func Test_Store_CreateReservation_Transaction(t *testing.T) {
	db := testutil.SetupTestDB(t)
	require.NoError(t, movies.AutoMigrate(db))
	require.NoError(t, users.AutoMigrate(db))
	require.NoError(t, AutoMigrate(db))
	testutil.CleanupDB(t, db)

	store := NewStore(db)
	ctx := context.Background()

	
	movie := movies.Movie{Title: "Store Test", Runtime: 120}
	db.Create(&movie)
	cinema := Cinema{Name: "Cine Store", City: "Maceió"}
	db.Create(&cinema)
	room := Room{CinemaID: cinema.ID, Name: "Sala 1", Capacity: 50}
	db.Create(&room)
	session := Session{MovieID: movie.ID, RoomID: room.ID, StartTime: time.Now().Add(1 * time.Hour), Price: 3000}
	db.Create(&session)
	user := users.User{ID: uuid.New(), Username: "tester", Email: "t@t.com"}
	db.Create(&user)

	seat := Seat{RoomID: room.ID, Row: "A", Number: 1, Type: "STANDARD"}
	require.NoError(t, db.Create(&seat).Error)

	tickets := []Ticket{
		{ID: uuid.New(), SessionID: session.ID, SeatID: &seat.ID, Type: "STANDARD", PricePaid: 3000, Status: "PENDING", QRCode: "qr123"},
	}

	t.Run("Erro no Checkout Limpa Transaction", func(t *testing.T) {
		tx, err := store.CreateReservation(ctx, user.ID, session.ID, tickets, 3000)
		assert.NoError(t, err)
		assert.NotNil(t, tx)
		
		var count int64
		db.Model(&Ticket{}).Where("transaction_id = ?", tx.ID).Count(&count)
		assert.Equal(t, int64(1), count)
	})
}

func Test_Store_CleanupExpired(t *testing.T) {
	db := testutil.SetupTestDB(t)
	AutoMigrate(db)
	testutil.CleanupDB(t, db)
	store := NewStore(db)

	user := users.User{ID: uuid.New(), Username: "cleanup_user", Email: "c@c.com"}
	require.NoError(t, db.Create(&user).Error)

	oldTx := Transaction{
		ID: uuid.New(),
		UserID: user.ID,
		Status: "PENDING",
	}
	require.NoError(t, db.Create(&oldTx).Error)
	require.NoError(t, db.Model(&oldTx).UpdateColumn("created_at", time.Now().Add(-15*time.Minute)).Error)
	
	newTx := Transaction{
		ID: uuid.New(),
		UserID: user.ID,
		Status: "PENDING",
		CreatedAt: time.Now(),
	}
	require.NoError(t, db.Create(&newTx).Error)

	_, expired, err := store.CleanupExpiredReservations(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, int64(1), expired)

	var check Transaction
	err = db.First(&check, oldTx.ID).Error
	assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
}
