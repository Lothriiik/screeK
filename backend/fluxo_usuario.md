# Fluxo de Usuário e Perfil (screeK)

Este documento mapeia o ciclo de vida do usuário no aplicativo, desde a criação da conta até o gerenciamento da sua identidade online (Social).

## 1. Cadastro de Nova Conta (Sign Up)
**Ação do Usuário:** Preenche o formulário para se juntar à plataforma.
> **👉 Rota do Backend:**
> `POST /users/register`
> Payload: `{ "name": "Ana", "email": "ana@...", "password": "***", "username": "ana_cine" }`

## 2. Autenticação (Login)
**Ação do Usuário:** Entra no aplicativo.
- *Retorno:* Recebe um **Token JWT** que deve ser enviado no Header `Authorization: Bearer <token>` em todas as rotas protegidas.
> **👉 Rota do Backend:**
> `POST /auth/login`
> Payload: `{ "username": "ana_cine", "password": "***" }`

## 3. Recuperação de Senha
**Ação do Usuário:** Solicita email de recuperação e redefine a senha.
> **👉 Rotas do Backend:**
> 1. `POST /auth/forgot-password` Payload: `{ "email": "ana@..." }`
> 2. `POST /auth/reset-password` Payload: `{ "token": "...", "new_password": "***" }`

## 4. Visualização do Perfil
**Ação do Usuário:** Abre a aba "Meu Perfil" ou visualiza outro usuário.
> **👉 Rota do Backend:**
> `GET /users/me` (Logado - vê dados sensíveis)
> `GET /users/{uuid}` (Público - vê bio e favoritos)

## 5. Edição de Perfil
**Ação do Usuário:** Atualiza dados de bio, foto ou localização.
> **👉 Rota do Backend:**
> `PUT /users/me`
> Payload: `{ "bio": "Amo a Marvel", "pronouns": "ela/dela", "default_city": "Sorocaba" }`

## 6. Filmes Favoritos (Top 3)
**Ação do Usuário:** Fixa filmes no perfil global.
> **👉 Rotas do Backend:**
> `POST /users/me/favorites/{tmdb_id}` (Adiciona ao Top 3)
> `DELETE /users/me/favorites/{tmdb_id}` (Remove do Top 3)

## 7. Trocar a Senha (Logado)
**Ação do Usuário:** Altera a senha dentro das configurações.
> **👉 Rota do Backend:**
> `PUT /auth/change-password`
> Payload: `{ "old_password": "***", "password": "***" }`

## 8. Meus Ingressos (Histórico e Cancelamento)
**Ação do Usuário:** Gerencia seus ingressos ativos e passados.
> **👉 Rotas do Backend:**
> 1. `GET /users/me/tickets?status=upcoming` (Próximas sessões)
> 2. `GET /users/me/tickets?status=past` (Histórico)
> 3. `POST /tickets/{id}/cancel` (Cancela o ingresso e libera a poltrona)

## 9. Rede Social (Followers & Watchlist) **[EM BREVE]**
**Ação do Usuário:** Seguir amigos, ver listas e gerenciar filmes para ver depois.
> **👉 Operações Disponíveis:**
> - `POST /users/{username}/follow` (Toggle Follow)
> - `GET /feed` (Posts de quem você segue)
> - *Listagem de seguidores e Watchlist pendente de implementação de Handlers.*

## 10. Logout e Exclusão
**Ação do Usuário:** Encerra a sessão ou apaga a conta.
> **👉 Rotas do Backend:**
> `POST /auth/logout` (Invalida o token)
> `DELETE /users/me` Payload: `{ "password": "***" }` (LGPD)

## 11. Pesquisa de Usuários
**Ação do Usuário:** Busca amigos pelo nome ou @username.
> **👉 Rota do Backend:**
> `GET /users/search?q=Ana`