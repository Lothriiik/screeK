# Fluxo de Usuário e Perfil (Cine Pass)

Este documento mapeia o ciclo de vida do usuário no aplicativo, desde a criação da conta até o gerenciamento da sua identidade online (Social).

## 1. Cadastro de Nova Conta (Sign Up)
**Ação do Usuário:** Preenche o formulário para se juntar à plataforma. Todos os dados abaixo são obrigatórios no cadastro, exceto Foto.
> **👉 Rota do Backend:**
> `POST /users/register`
> Payload: `{ "name": "Ana", "email": "ana@...", "password": "***", "username": "ana_cine", "photo_url": "" }`

## 2. Autenticação (Login)
**Ação do Usuário:** Entra no aplicativo.
- *Na tela:* Retorna para a tela Inicial logado (O App guarda o Token).
> **👉 Rota do Backend:**
> `POST /auth/login`
> Payload: `{ "username": "ana_cine", "password": "***" }`  -> *Retorna Token JWT*

## 3. Recuperação de Senha (Esqueci Senha)
**Ação do Usuário:** Perdeu a senha e solicita email de recuperação.
> **👉 Rotas do Backend:**
> 1. `POST /auth/forgot-password` Payload: `{ "email": "ana@..." }` *(Envia código pro email)*
> 2. `POST /auth/reset-password` Payload: `{ "token": "12345", "new_password": "***" }`

## 4. Visualização do Perfil
**Ação do Usuário:** Abre a aba "Meu Perfil" (ou o perfil público de um amigo).
- *Informações exibidas:* Nome, Email, Senha(Oculta), Username.
- *Campos Opcionais (Social):* Bio, Foto, 3 Filmes Favoritos, Pronomes, Localização Padrão.
> **👉 Rota do Backend:**
> `GET /users/:username` (ou `/users/me` usando JWT para ver a si mesmo)

## 5. Edição de Perfil
**Ação do Usuário:** Atualiza dados sensíveis ou informações do Perfil Público.
> **👉 Rota do Backend:**
> `PUT /users/me` (Rota Protegida)
> Payload: `{ "bio": "Amo a Marvel", "pronouns": "ela/dela", "favorite_movies": [123, 456, 789], "default_city": "SP" }`

## 6. Logout
**Ação do Usuário:** Sai do App no celular atual.
- *Na tela:* Ele é deslogado. (No backend, invalida o Token dele recebido pelo Payload).
> **👉 Rota do Backend:**
> `POST /auth/logout`

## 7. Exclusão de Conta (Delete Profile)
**Ação do Usuário:** Decide apagar todos os seus dados da plataforma (LGPD).
- *Requisito:* Exige confirmação da Senha para não deletar sem querer.
> **👉 Rota do Backend:**
> `DELETE /users/me`
> Payload: `{ "password": "***" }`

## 8. Trocar a Senha (Logado)
**Ação do Usuário:** Acha que foi hackeado e quer mudar a senha atual.
- *Requisito:* O usuário digita a senha velha e a nova.
> **👉 Rota do Backend:**
> `PUT /auth/change-password`
> Payload: `{ "old_password": "***", "new_password": "***" }`

## 9. Meus Ingressos (Histórico de Compras e Cancelamento)
**Ação do Usuário:** Abre a aba de Ingressos do App para ver os QR Codes ou cancelar uma reserva.
- *Informações Exibidas:* Separa os Ingressos "Futuros" (onde vai clicar pra abrir o QR Code e entrar) dos ingressos "Passados" (filmes que ele já foi).
- *Ação Crítica:* O usuário pode clicar num botão para **Cancelar o Ingresso** em caso de imprevisto, o que força o Banco de Dados a libertar aquela cadeira pra venda novamente.
> **👉 Rotas do Backend:**
> 1. `GET /users/me/tickets?status=upcoming`
> 2. `GET /users/me/tickets?status=past`
> 3. `POST /tickets/:ticket_id/cancel` (O motor de reembolso/estorno de liberação de Poltrona)

## 10. Rede Social (Seguidores & Seguindo)
**Ação do Usuário:** Clica no número de "Seguidores" no próprio Perfil ou no perfil de um amigo pra ver quem ele é fã.
- *Informações Exibidas:* Lista com Nome, Foto e Username da galera.
> **👉 Rotas do Backend:**
> 1. `GET /users/:username/followers`
> 2. `GET /users/:username/following`
> *(Ação de Seguir alguém entra no `fluxo_social`)*

## 11. "Watchlist" (Filmes para Ver Depois)
**Ação do Usuário:** Exibe a prateleira de Filmes que o usuário adicionou para não esquecer de assistir.
- *Onde fica:* Geralmente no Perfil do usuário.
- *Layout Visual:* A lista é uma só para não bagunçar a tela. No entanto, Filmes que estão passando no cinema atualmente recebem um **símbolo/destaque**. (Para o frontend desenhar isso, a API retorna um campo _booleano_ extra no JSON, ex: `"is_playing_in_cinemas": true`).
> ** Rota do Backend:**
> `GET /users/me/watchlist`
> *(O botão de Adicionar e Remover da lista fica no `fluxo_filmes`)*

## 12. Pesquisa de Usuários (A Busca Social)
**Ação do Usuário:** Na aba de Busca Geral, o usuário clica na aba "Pessoas" para procurar um amigo pelo Nome Real ou pelo `@arroba`.
- *Informações Exibidas:* A foto em miniatura e o nome de usuário (Ex: @ana_cine).
> ** Rota do Backend:**
> `GET /users/search?q=Ana`