package crypto

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_deve_hashear_senha_com_sucesso(t *testing.T) {
	hash, err := HashPassword("minha_senha_secreta")

	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, "minha_senha_secreta", hash)
}

func Test_deve_verificar_senha_correta(t *testing.T) {
	hash, _ := HashPassword("senha123")

	assert.True(t, VerifyPassword("senha123", hash))
}

func Test_deve_rejeitar_senha_incorreta(t *testing.T) {
	hash, _ := HashPassword("senha_certa")

	assert.False(t, VerifyPassword("senha_errada", hash))
}

func Test_deve_gerar_hashes_diferentes_para_mesma_senha(t *testing.T) {
	hash1, _ := HashPassword("mesma_senha")
	hash2, _ := HashPassword("mesma_senha")

	assert.NotEqual(t, hash1, hash2)
}

func Test_deve_verificar_senha_vazia(t *testing.T) {
	hash, err := HashPassword("")

	require.NoError(t, err)
	assert.True(t, VerifyPassword("", hash))
	assert.False(t, VerifyPassword("qualquer_coisa", hash))
}
