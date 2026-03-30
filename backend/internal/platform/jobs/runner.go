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
		slog.Info("[Job] Iniciando execução", "name", name)
		task()
		slog.Info("[Job] Execução finalizada", "name", name)
	})

	if err != nil {
		slog.Error("[Job] Erro ao registrar job", "name", name, "error", err)
	} else {
		slog.Info("[Job] Registrado com sucesso", "name", name, "spec", spec)
	}
}

func (r *JobRunner) Start() {
	r.cron.Start()
	slog.Info("[Job] Motor de jobs iniciado")
}

func (r *JobRunner) Stop() {
	r.cron.Stop()
	slog.Info("[Job] Motor de jobs parado")
}
