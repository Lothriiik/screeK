package handler

import (
	"context"
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	"github.com/StartLivin/screek/backend/internal/shared/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ImportHandler struct {
	svc      *letterboxd.Service
	reloader DatasetReloader
	jobs     *importJobManager
}

const (
	maxUploadBytes           = 50 << 20
	maxMultipartRequestBytes = maxUploadBytes + (1 << 20)
)

func NewHandler(svc *letterboxd.Service, reloaders ...DatasetReloader) *ImportHandler {
	var reloader DatasetReloader
	if len(reloaders) > 0 {
		reloader = reloaders[0]
	}
	handler := &ImportHandler{svc: svc, reloader: reloader}
	handler.jobs = newImportJobManager(svc, reloader)
	return handler
}

func (h *ImportHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Post("/import/letterboxd", h.ImportFromCSV)
		r.Get("/import/letterboxd/{jobID}", h.GetImportStatus)
	})
}

type GlobalImportSummary struct {
	Watched   *letterboxd.ImportSummary `json:"watched,omitempty"`
	Ratings   *letterboxd.ImportSummary `json:"ratings,omitempty"`
	Likes     *letterboxd.ImportSummary `json:"likes,omitempty"`
	Watchlist *letterboxd.ImportSummary `json:"watchlist,omitempty"`
	Errors    []string                  `json:"errors,omitempty"`
}

// @Summary Importar export do Letterboxd
// @Description Envie um ZIP oficial no campo `file` ou `zip`, ou CSVs separados (`ratings`, `watched`, `watchlist`). Os dados são associados ao usuário autenticado.
// @Tags Users
// @Accept multipart/form-data
// @Produce json
// @Param file formData file false "ZIP do export do Letterboxd ou CSV de ratings"
// @Param zip formData file false "ZIP do export do Letterboxd"
// @Param ratings formData file false "ratings.csv"
// @Param watched formData file false "watched.csv"
// @Param watchlist formData file false "watchlist.csv"
// @Success 200 {object} GlobalImportSummary
// @Success 202 {object} ImportJobStatus
// @Failure 400 {object} httputil.ErrorResponse
// @Failure 401 {object} httputil.ErrorResponse
// @Failure 413 {object} httputil.ErrorResponse
// @Failure 409 {object} ImportJobStatus
// @Security BearerAuth
// @Router /import/letterboxd [post]
func (h *ImportHandler) ImportFromCSV(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxMultipartRequestBytes)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			httputil.WriteJSON(w, http.StatusRequestEntityTooLarge, httputil.ErrorResponse{Error: "arquivo excede o limite de 50 MB"})
			return
		}
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "erro ao processar form"})
		return
	}
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}

	zipField := ""
	if len(r.MultipartForm.File["zip"]) > 0 {
		zipField = "zip"
	} else if files := r.MultipartForm.File["file"]; len(files) > 0 && strings.EqualFold(filepath.Ext(files[0].Filename), ".zip") {
		zipField = "file"
	}
	if zipField != "" {
		if len(r.MultipartForm.File[zipField]) != 1 {
			httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "envie apenas um arquivo ZIP"})
			return
		}
		if len(r.MultipartForm.File["ratings"]) > 0 || len(r.MultipartForm.File["watched"]) > 0 || len(r.MultipartForm.File["watchlist"]) > 0 || (zipField == "zip" && len(r.MultipartForm.File["file"]) > 0) {
			httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "envie o ZIP sozinho ou envie os CSVs separados"})
			return
		}
		file, _, err := r.FormFile(zipField)
		if err != nil {
			httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "não foi possível ler o ZIP enviado"})
			return
		}
		defer file.Close()
		content, err := io.ReadAll(io.LimitReader(file, maxUploadBytes+1))
		if err != nil {
			httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{Error: "falha ao ler o ZIP"})
			return
		}
		if len(content) > maxUploadBytes {
			httputil.WriteJSON(w, http.StatusRequestEntityTooLarge, httputil.ErrorResponse{Error: "arquivo excede o limite de 50 MB"})
			return
		}
		job, started := h.jobs.start(userID, content)
		if !started {
			httputil.WriteJSON(w, http.StatusConflict, job)
			return
		}
		httputil.WriteJSON(w, http.StatusAccepted, job)
		return
	}

	summary := &GlobalImportSummary{}
	processed := false

	process := func(field string, importFn func(io.Reader) (*letterboxd.ImportSummary, error)) *letterboxd.ImportSummary {
		file, _, err := r.FormFile(field)
		if err != nil {
			return nil
		}
		defer file.Close()
		processed = true

		result, err := importFn(file)
		if err != nil {
			summary.Errors = append(summary.Errors, field+": "+err.Error())
			return nil
		}
		return result
	}

	summary.Watched = process("watched", func(reader io.Reader) (*letterboxd.ImportSummary, error) {
		return h.svc.ImportWatchedCSV(r.Context(), userID, reader)
	})
	summary.Ratings = process("ratings", func(reader io.Reader) (*letterboxd.ImportSummary, error) {
		return h.svc.ImportRatingsCSV(r.Context(), userID, reader)
	})
	if summary.Ratings == nil {
		// Compatibilidade: um CSV único enviado em "file" é tratado como ratings.csv.
		summary.Ratings = process("file", func(reader io.Reader) (*letterboxd.ImportSummary, error) {
			return h.svc.ImportRatingsCSV(r.Context(), userID, reader)
		})
	}
	summary.Watchlist = process("watchlist", func(reader io.Reader) (*letterboxd.ImportSummary, error) {
		return h.svc.ImportWatchlistCSV(r.Context(), userID, reader)
	})

	if !processed {
		httputil.WriteJSON(w, http.StatusBadRequest, httputil.ErrorResponse{
			Error: "envie ao menos um CSV nos campos watched, ratings, watchlist ou file",
		})
		return
	}

	h.reloadRecommendationDataset(r.Context(), &summary.Errors)

	httputil.WriteJSON(w, http.StatusOK, summary)
}

// @Summary Consultar andamento da importação Letterboxd
// @Tags Users
// @Produce json
// @Param jobID path string true "ID da importação"
// @Success 200 {object} ImportJobStatus
// @Failure 401 {object} httputil.ErrorResponse
// @Failure 404 {object} httputil.ErrorResponse
// @Security BearerAuth
// @Router /import/letterboxd/{jobID} [get]
func (h *ImportHandler) GetImportStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(httputil.UserIDKey).(uuid.UUID)
	if !ok {
		httputil.WriteJSON(w, http.StatusUnauthorized, httputil.ErrorResponse{Error: "não autorizado"})
		return
	}
	jobID, err := uuid.Parse(chi.URLParam(r, "jobID"))
	if err != nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "importação não encontrada"})
		return
	}
	job := h.jobs.get(userID, jobID)
	if job == nil {
		httputil.WriteJSON(w, http.StatusNotFound, httputil.ErrorResponse{Error: "importação não encontrada"})
		return
	}
	httputil.WriteJSON(w, http.StatusOK, job)
}

func (h *ImportHandler) reloadRecommendationDataset(ctx context.Context, errorsList *[]string) {
	if h.reloader == nil {
		return
	}
	reloadCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	if err := h.reloader.ReloadDataset(reloadCtx); err != nil {
		*errorsList = append(*errorsList, "dataset de recomendações não recarregado: "+err.Error())
	}
}
