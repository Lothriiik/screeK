package events

import (
	"sync"
)

type EventType string

const (
	EventTicketPurchased EventType = "ticket.purchased"
	EventMoviePremiere   EventType = "movie.premiere"
	EventMovieRescreen   EventType = "movie.rescreening"

	EventPostLiked    EventType = "social.post_liked"
	EventUserFollowed EventType = "social.user_followed"
	EventCommentAdded EventType = "social.comment_added"

	EventSessionScheduled EventType = "session.scheduled"
)

type Data map[string]interface{}

type Handler func(Data)

type EventBus struct {
	mu       sync.RWMutex
	handlers map[EventType][]Handler
}

func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[EventType][]Handler),
	}
}

func (eb *EventBus) Subscribe(eventType EventType, handler Handler) {
	eb.mu.Lock()
	defer eb.mu.Unlock()
	eb.handlers[eventType] = append(eb.handlers[eventType], handler)
}

func (eb *EventBus) Publish(eventType EventType, data Data) {
	eb.mu.RLock()
	defer eb.mu.RUnlock()

	if handlers, ok := eb.handlers[eventType]; ok {
		for _, handler := range handlers {
			go handler(data)
		}
	}
}
