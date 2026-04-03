package notifications

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func Test_Hub_Register_And_Broadcast(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	userID := uuid.New()
	client := &Client{
		hub:    hub,
		userID: userID,
		send:   make(chan []byte, 256),
	}

	hub.register <- client
	
	time.Sleep(50 * time.Millisecond)

	msg := []byte(`{"title": "Novo Teste"}`)
	hub.SendToUser(userID, msg)

	select {
	case received := <-client.send:
		assert.Equal(t, msg, received)
	case <-time.After(1 * time.Second):
		t.Fatal("Mensagem não recebida pelo cliente via hub")
	}

	hub.unregister <- client
	time.Sleep(50 * time.Millisecond)
	
	hub.SendToUser(userID, msg)
}
