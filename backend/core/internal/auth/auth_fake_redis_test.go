package auth

import (
	"context"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type fakeRedis struct {
	mu    sync.Mutex
	store map[string]string
}

func newFakeRedis() *fakeRedis {
	return &fakeRedis{store: make(map[string]string)}
}

func (f *fakeRedis) has(key string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	_, ok := f.store[key]
	return ok
}


func (f *fakeRedis) client() *goredis.Client {

	return goredis.NewClient(&goredis.Options{
		Addr: "localhost:6379",
		DialTimeout: 50 * time.Millisecond,
		MaxRetries:  0,
	})
}

func (f *fakeRedis) Ping(ctx context.Context) *goredis.StatusCmd {
	return goredis.NewStatusCmd(ctx)
}
