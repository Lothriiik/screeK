package events

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_deve_entregar_evento_ao_subscriber(t *testing.T) {
	bus := NewEventBus()
	received := make(chan Data, 1)

	bus.Subscribe(EventTicketPurchased, func(d Data) {
		received <- d
	})

	bus.Publish(EventTicketPurchased, Data{"user_id": "abc"})

	select {
	case data := <-received:
		assert.Equal(t, "abc", data["user_id"])
	case <-time.After(time.Second):
		t.Fatal("evento não foi recebido dentro do timeout")
	}
}

func Test_deve_entregar_evento_a_multiplos_subscribers(t *testing.T) {
	bus := NewEventBus()
	var count int32

	for i := 0; i < 3; i++ {
		bus.Subscribe(EventMoviePremiere, func(d Data) {
			atomic.AddInt32(&count, 1)
		})
	}

	bus.Publish(EventMoviePremiere, Data{"movie": "Batman"})
	time.Sleep(100 * time.Millisecond)

	assert.Equal(t, int32(3), atomic.LoadInt32(&count))
}

func Test_deve_ignorar_evento_sem_subscribers(t *testing.T) {
	bus := NewEventBus()

	require.NotPanics(t, func() {
		bus.Publish(EventMovieRescreen, Data{"movie": "Inception"})
	})
}

func Test_deve_ser_seguro_para_uso_concorrente(t *testing.T) {
	bus := NewEventBus()
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			bus.Subscribe(EventTicketPurchased, func(d Data) {})
		}()
		go func() {
			defer wg.Done()
			bus.Publish(EventTicketPurchased, Data{"test": true})
		}()
	}

	wg.Wait()
}

func Test_nao_deve_entregar_evento_a_subscriber_de_outro_tipo(t *testing.T) {
	bus := NewEventBus()
	received := false

	bus.Subscribe(EventMoviePremiere, func(d Data) {
		received = true
	})

	bus.Publish(EventMovieRescreen, Data{})
	time.Sleep(50 * time.Millisecond)

	assert.False(t, received)
}
