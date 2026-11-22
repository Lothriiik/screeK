package jobs

import (
	"log/slog"

	"github.com/robfig/cron/v3"
)

type JobRunner struct {
	cron *cron.Cron
}

func NewRunner() *JobRunner {
	return &JobRunner{
		cron: cron.New(),
	}
}

func (r *JobRunner) Register(spec string, name string, task func()) {
	_, err := r.cron.AddFunc(spec, func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("Panic capturado na execução do job", "job", name, "panic", r)
			}
		}()
		slog.Info("Iniciando execução do job", "job", name)
		task()
		slog.Info("Execução do job finalizada", "job", name)
	})

	if err != nil {
		slog.Error("Falha ao registrar job", "job", name, "error", err)
	} else {
		slog.Info("Job registrado", "job", name, "schedule", spec)
	}
}

func (r *JobRunner) Start() {
	r.cron.Start()
	slog.Info("Motor de jobs iniciado")
}

func (r *JobRunner) Stop() {
	r.cron.Stop()
	slog.Info("Motor de jobs parado")
}
