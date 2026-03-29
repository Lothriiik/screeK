package httputil

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	clients = make(map[string]*client)
	mu      sync.Mutex
)

func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, c := range clients {
				if time.Since(c.lastSeen) > 3*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func RateLimit(limit rate.Limit, burst int) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			mu.Lock()
			if _, exists := clients[ip]; !exists {
				clients[ip] = &client{
					limiter: rate.NewLimiter(limit, burst),
				}
			}

			clients[ip].lastSeen = time.Now()

			if !clients[ip].limiter.Allow() {
				mu.Unlock()
				WriteJSON(w, http.StatusTooManyRequests, ErrorResponse{
					Error: "Muitas requisições. Por favor, aguarde um pouco antes de tentar novamente.",
				})
				return
			}
			mu.Unlock()

			next.ServeHTTP(w, r)
		})
	}
}
