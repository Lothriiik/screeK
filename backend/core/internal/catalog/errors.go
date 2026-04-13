package catalog

import "errors"

var (
	ErrListNotFound       = errors.New("lista de filmes não encontrada")
	ErrPermissionDenied   = errors.New("você não tem permissão para realizar esta ação")
	ErrLogNotFound        = errors.New("registro de atividade não encontrado")
	ErrMovieNotFoundLocal = errors.New("filme não encontrado na base do catálogo")
	ErrAddMovieToList     = errors.New("não foi possível adicionar o filme à lista")
)
