package httputil

import (
	"log/slog"
	"net/http"
	"time"
)

// responseWriterInterceptor é um wrapper para capturar o status code da resposta
type responseWriterInterceptor struct {
	http.ResponseWriter
	statusCode int
}

func (w *responseWriterInterceptor) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

// Logger é um middleware que loga todas as requisições HTTP usando slog
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Interceptar o writer para saber o status depois
		interceptor := &responseWriterInterceptor{
			ResponseWriter: w,
			statusCode:     http.StatusOK, // Padrão se WriteHeader não for chamado
		}

		// Seguir para o próximo handler
		next.ServeHTTP(interceptor, r)

		// Calcular duração
		duration := time.Since(start)

		// Logar os dados estruturados
		slog.Info("HTTP Request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", interceptor.statusCode,
			"duration", duration.String(),
			"ip", r.RemoteAddr,
		)
	})
}
