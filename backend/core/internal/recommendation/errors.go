// Package recommendation integra o Go core ao serviço Python de recomendação.
//
// O Python é o dono do ranking; o Go é o gateway para o frontend e hidrata os
// metadados usando o ID canônico (`movies.id`) devolvido pelo serviço.
package recommendation

import "errors"

var (
	// ErrNotReady indica que o motor Python ainda não foi implementado.
	ErrNotReady = errors.New("motor de recomendação ainda não está pronto")
	// ErrUserNotFound indica usuário sem histórico no dataset do Python.
	ErrUserNotFound = errors.New("usuário sem histórico de recomendações")
	// ErrMovieNotFound indica filme de referência ausente no dataset.
	ErrMovieNotFound = errors.New("filme de referência não encontrado")
	// ErrUnavailable indica falha de comunicação ou resposta inválida do Python.
	ErrUnavailable = errors.New("serviço de recomendação indisponível")
)
