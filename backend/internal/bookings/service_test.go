package bookings

import (
	"context"
	"log"
	"os"
	"sync"
	"testing"

	"github.com/StartLivin/screek/backend/internal/platform/database"
	"github.com/StartLivin/screek/backend/internal/platform/redis"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*BookingsService, *gorm.DB) {
	if err := godotenv.Load("../../.env"); err != nil {
		t.Log("warning: .env file not found, relying on system environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("skipping test: DATABASE_URL not set in environment or .env")
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	db, err := database.InitDB(dbURL)
	if err != nil {
		t.Fatalf("failed to connect to database: %v", err)
	}
	rdb := redis.InitRedis(redisURL)

	store := NewStore(db)
	fakePayment := NewStripeProcessor("sk_test_123")
	service := NewService(store, rdb, fakePayment, nil)

	rdb.FlushAll(context.Background())

	return service, db
}

func TestConcurrentReservations(t *testing.T) {
	service, db := setupTestEnvironment(t)

	sessionID := 1

	var freeSeatID int
	db.Raw(`
		SELECT s.id FROM seats s 
		LEFT JOIN tickets t ON t.seat_id = s.id AND t.session_id = ? AND t.status != 'CANCELLED'
		WHERE s.room_id = 1 AND t.id IS NULL 
		LIMIT 1
	`, sessionID).Scan(&freeSeatID)

	if freeSeatID == 0 {
		t.Fatalf("no free seats available for session %d", sessionID)
	}

	ticketReqs := []TicketRequest{
		{SeatID: freeSeatID, Type: TicketTypeStandard},
	}
	t.Logf("testing with seat id: %d", freeSeatID)

	var users []uuid.UUID
	db.Raw("SELECT id FROM users LIMIT 4").Scan(&users)

	if len(users) < 4 {
		db.Exec("INSERT INTO users (username, name, email, password, role) VALUES ('bot_3', 'Bot 3', 'bot3@hack.com', '123', 'USER')")
		db.Exec("INSERT INTO users (username, name, email, password, role) VALUES ('bot_4', 'Bot 4', 'bot4@hack.com', '123', 'USER')")
		db.Raw("SELECT id FROM users LIMIT 4").Scan(&users)
	}

	var errs [4]error
	var wg sync.WaitGroup
	wg.Add(4)

	for i := 0; i < 4; i++ {
		go func(idx int, uID uuid.UUID) {
			defer wg.Done()
			log.Printf("user %d attempting to reserve seat %d", uID, freeSeatID)
			_, errs[idx] = service.ReserveSeats(context.Background(), uID, sessionID, ticketReqs)
		}(i, users[i])
	}

	wg.Wait()

	sucessos := 0
	falhas := 0

	for i := 0; i < 4; i++ {
		if errs[i] == nil {
			sucessos++
		} else {
			falhas++
			t.Logf("error for user %d: %v", users[i], errs[i])
		}
	}

	if sucessos != 1 || falhas != 3 {
		t.Fatalf("concurrency failure: expected 1 success and 3 failures, got %d successes and %d failures", sucessos, falhas)
	}

	t.Logf("concurrency test passed: %d success, %d expected failures", sucessos, falhas)
}
