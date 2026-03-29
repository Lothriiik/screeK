package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/StartLivin/screek/backend/internal/platform/httputil"
	"github.com/redis/go-redis/v9"
)

func AuthMiddleware(jwtService *JWTService, redisClient *redis.Client) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Token Ausente", http.StatusUnauthorized)
				return
			}

			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				http.Error(w, "Token mal formatado", http.StatusUnauthorized)
				return
			}
			tokenString := tokenParts[1]

			isBlacklisted, err := redisClient.Exists(r.Context(), "blacklist:"+tokenString).Result()
			if err != nil {
				http.Error(w, "Erro ao verificar segurança do token", http.StatusInternalServerError)
				return
			}
			if isBlacklisted > 0 {
				http.Error(w, "Token inválido ou expirado (Sessão Encerrada)", http.StatusUnauthorized)
				return
			}

			claims, err := jwtService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, "Token inválido/expirado", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), httputil.UserIDKey, claims.UserID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
