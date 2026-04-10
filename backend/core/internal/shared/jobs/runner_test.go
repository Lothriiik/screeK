package jobs

import (
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_deve_registrar_job_com_sucesso(t *testing.T) {
	runner := NewRunner()

	require.NotPanics(t, func() {
		runner.Register("@every 1s", "TestJob", func() {})
	})
}

func Test_deve_rejeitar_spec_invalido(t *testing.T) {
	runner := NewRunner()

	require.NotPanics(t, func() {
		runner.Register("invalido!!!", "BadJob", func() {})
	})
}

func Test_deve_executar_job_registrado(t *testing.T) {
	runner := NewRunner()
	var executed int32

	runner.Register("@every 1s", "QuickJob", func() {
		atomic.AddInt32(&executed, 1)
	})

	runner.Start()
	defer runner.Stop()

	time.Sleep(1500 * time.Millisecond)

	assert.GreaterOrEqual(t, atomic.LoadInt32(&executed), int32(1))
}

func Test_deve_parar_jobs_ao_chamar_stop(t *testing.T) {
	runner := NewRunner()
	var count int32

	runner.Register("@every 1s", "StopTest", func() {
		atomic.AddInt32(&count, 1)
	})

	runner.Start()
	time.Sleep(1500 * time.Millisecond)
	runner.Stop()

	snapshot := atomic.LoadInt32(&count)
	time.Sleep(1500 * time.Millisecond)

	assert.Equal(t, snapshot, atomic.LoadInt32(&count))
}
