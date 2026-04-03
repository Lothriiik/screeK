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
				httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Token Ausente"})
				return
			}

			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Token mal formatado"})
				return
			}
			tokenString := tokenParts[1]

			isBlacklisted, err := redisClient.Exists(r.Context(), "blacklist:"+tokenString).Result()
			if err != nil {
				httputil.WriteJSON(w, http.StatusInternalServerError, httputil.ErrorResponse{Error: "Erro ao verificar segurança do token"})
				return
			}
			if isBlacklisted > 0 {
				httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Token inválido ou expirado (Sessão Encerrada)"})
				return
			}

			claims, err := jwtService.ValidateToken(tokenString, TokenTypeAccess)
			if err != nil {
				httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "Token inválido ou expirado"})
				return
			}

			ctx := context.WithValue(r.Context(), httputil.UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, httputil.UserRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
