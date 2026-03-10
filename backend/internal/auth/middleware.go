package auth

import (
	"context"
	"net/http"
	"strings"
)

func AuthMiddleware(jwtService *JWTService) func(next http.Handler) http.Handler {
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

			claims, err := jwtService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, "Token inválido/expirado", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), "userID", claims.UserID)
			
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
