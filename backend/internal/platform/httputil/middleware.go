package httputil

import (
	"net/http"
)

func CheckRole(allowedRoles ...Role) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(UserRoleKey).(Role)
			if !ok {
				WriteJSON(w, http.StatusForbidden, ErrorResponse{Error: "Acesso negado: Perfil não identificado"})
				return
			}

			isAllowed := false
			for _, role := range allowedRoles {
				if userRole == role {
					isAllowed = true
					break
				}
			}

			if !isAllowed {
				WriteJSON(w, http.StatusForbidden, ErrorResponse{Error: "Acesso negado: Você não tem permissão para esta operação"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
