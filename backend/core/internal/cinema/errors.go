package cinema

import "errors"

var (
	ErrSessionOverlap     = errors.New("conflito de horário: a sala já possui uma sessão neste período")
	ErrNotCinemaManager   = errors.New("acesso negado: você não é gerente deste cinema")
	ErrAdminOnly          = errors.New("apenas administradores podem realizar esta ação")
	ErrCinemaNotFound     = errors.New("cinema não encontrado")
	ErrRoomNotFound       = errors.New("sala não encontrada")
	ErrSessionNotFound    = errors.New("sessão não encontrada")
	ErrMovieNotFound      = errors.New("filme não encontrado")
	ErrCinemaHasRooms     = errors.New("não é possível excluir um cinema que possui salas vinculadas")
	ErrRoomHasSessions    = errors.New("não é possível excluir uma sala com sessões futuras agendadas")
	ErrSessionHasBookings = errors.New("não é possível modificar uma sessão que já possui ingressos vendidos")
	ErrSessionInPast      = errors.New("não é possível agendar uma sessão no passado")
)
