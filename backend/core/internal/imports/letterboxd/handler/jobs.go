package handler

import (
	"context"
	"sync"
	"time"

	"github.com/StartLivin/screek/backend/internal/imports/letterboxd"
	"github.com/google/uuid"
)

type DatasetReloader interface {
	ReloadDataset(ctx context.Context) error
}

type ImportJobStatus struct {
	JobID     uuid.UUID                    `json:"job_id"`
	Status    string                       `json:"status"`
	Stage     string                       `json:"stage"`
	Processed int                          `json:"processed"`
	Total     int                          `json:"total"`
	Percent   int                          `json:"percent"`
	Summary   *letterboxd.ZipImportSummary `json:"summary,omitempty"`
	Error     string                       `json:"error,omitempty"`
	CreatedAt time.Time                    `json:"created_at"`
	UpdatedAt time.Time                    `json:"updated_at"`
}

type importJobManager struct {
	svc      *letterboxd.Service
	reloader DatasetReloader

	mu           sync.RWMutex
	jobs         map[uuid.UUID]*ImportJobStatus
	owners       map[uuid.UUID]uuid.UUID
	activeByUser map[uuid.UUID]uuid.UUID
}

func newImportJobManager(svc *letterboxd.Service, reloader DatasetReloader) *importJobManager {
	return &importJobManager{
		svc:          svc,
		reloader:     reloader,
		jobs:         make(map[uuid.UUID]*ImportJobStatus),
		owners:       make(map[uuid.UUID]uuid.UUID),
		activeByUser: make(map[uuid.UUID]uuid.UUID),
	}
}

func (m *importJobManager) start(userID uuid.UUID, content []byte) (*ImportJobStatus, bool) {
	m.mu.Lock()
	m.removeExpired(time.Now().UTC())
	if activeID, ok := m.activeByUser[userID]; ok {
		if active := m.jobs[activeID]; active != nil && (active.Status == "pending" || active.Status == "running") {
			copy := cloneImportJob(active)
			m.mu.Unlock()
			return copy, false
		}
	}

	now := time.Now().UTC()
	job := &ImportJobStatus{
		JobID:     uuid.New(),
		Status:    "pending",
		Stage:     "queued",
		CreatedAt: now,
		UpdatedAt: now,
	}
	m.jobs[job.JobID] = job
	m.owners[job.JobID] = userID
	m.activeByUser[userID] = job.JobID
	jobCopy := cloneImportJob(job)
	m.mu.Unlock()

	go m.run(userID, job.JobID, content)
	return jobCopy, true
}

func (m *importJobManager) removeExpired(now time.Time) {
	const retention = 24 * time.Hour
	for jobID, job := range m.jobs {
		if job.Status == "pending" || job.Status == "running" || now.Sub(job.UpdatedAt) < retention {
			continue
		}
		delete(m.jobs, jobID)
		delete(m.owners, jobID)
	}
}

func (m *importJobManager) get(userID, jobID uuid.UUID) *ImportJobStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.owners[jobID] != userID {
		return nil
	}
	return cloneImportJob(m.jobs[jobID])
}

func (m *importJobManager) run(userID, jobID uuid.UUID, content []byte) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Minute)
	defer cancel()
	m.update(jobID, func(job *ImportJobStatus) {
		job.Status = "running"
		job.Stage = "matching"
	})

	summary, err := m.svc.ImportZip(ctx, userID, content, 25, func(progress letterboxd.ZipImportProgress) {
		m.update(jobID, func(job *ImportJobStatus) {
			job.Stage = progress.Stage
			job.Processed = progress.Processed
			job.Total = progress.Total
			job.Percent = importProgressPercent(progress)
			job.Summary = progress.Summary
			if progress.Stage == "complete" {
				job.Stage = "saving"
				job.Percent = 99
			}
		})
	})
	if err != nil {
		m.finish(userID, jobID, func(job *ImportJobStatus) {
			job.Status = "failed"
			job.Stage = "failed"
			job.Error = err.Error()
		})
		return
	}

	if m.reloader != nil {
		reloadCtx, reloadCancel := context.WithTimeout(ctx, 20*time.Second)
		if err := m.reloader.ReloadDataset(reloadCtx); err != nil {
			summary.Errors = append(summary.Errors, "dataset de recomendações não recarregado: "+err.Error())
		}
		reloadCancel()
	}

	m.finish(userID, jobID, func(job *ImportJobStatus) {
		job.Status = "completed"
		job.Stage = "complete"
		job.Percent = 100
		job.Summary = summary
		job.Processed = job.Total
	})
}

func (m *importJobManager) update(jobID uuid.UUID, mutate func(*ImportJobStatus)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if job := m.jobs[jobID]; job != nil {
		mutate(job)
		job.UpdatedAt = time.Now().UTC()
	}
}

func (m *importJobManager) finish(userID, jobID uuid.UUID, mutate func(*ImportJobStatus)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if job := m.jobs[jobID]; job != nil {
		mutate(job)
		job.UpdatedAt = time.Now().UTC()
	}
	if m.activeByUser[userID] == jobID {
		delete(m.activeByUser, userID)
	}
}

func importProgressPercent(progress letterboxd.ZipImportProgress) int {
	if progress.Stage == "complete" {
		return 100
	}
	if progress.Total <= 0 {
		return 0
	}
	stagePercent := progress.Processed * 100 / progress.Total
	if progress.Stage == "saving" {
		return 90 + stagePercent*9/100
	}
	return stagePercent * 90 / 100
}

func cloneImportJob(source *ImportJobStatus) *ImportJobStatus {
	if source == nil {
		return nil
	}
	copy := *source
	if source.Summary != nil {
		copy.Summary = cloneZipSummary(source.Summary)
	}
	return &copy
}

func cloneZipSummary(source *letterboxd.ZipImportSummary) *letterboxd.ZipImportSummary {
	copy := *source
	copy.FailedItems = append([]letterboxd.ImportFailure(nil), source.FailedItems...)
	copy.Errors = append([]string(nil), source.Errors...)
	if source.Watched != nil {
		item := *source.Watched
		copy.Watched = &item
	}
	if source.Ratings != nil {
		item := *source.Ratings
		copy.Ratings = &item
	}
	if source.Likes != nil {
		item := *source.Likes
		copy.Likes = &item
	}
	if source.Watchlist != nil {
		item := *source.Watchlist
		copy.Watchlist = &item
	}
	return &copy
}
