package realtime

import (
	"sync"

	"github.com/google/uuid"
)

type Hub struct {
	clients map[uuid.UUID][]*Client

	register chan *Client
	
	unregister chan *Client
	
	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID][]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.userID] = append(h.clients[client.userID], client)
			h.mu.Unlock()
			
		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.userID]; ok {
				for i, c := range clients {
					if c == client {
						h.clients[client.userID] = append(clients[:i], clients[i+1:]...)
						break
					}
				}
				if len(h.clients[client.userID]) == 0 {
					delete(h.clients, client.userID)
				}
				close(client.send)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) SendToUser(userID uuid.UUID, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	if clients, ok := h.clients[userID]; ok {
		for _, client := range clients {
			select {
			case client.send <- message:
			default:
				go func(c *Client) { h.unregister <- c }(client)
			}
		}
	}
}
