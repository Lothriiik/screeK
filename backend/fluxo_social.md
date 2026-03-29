# Fluxo Social e Interações (screeK)

O coração comunitário do nosso app fica aqui. Onde os usuários expressam suas opiniões, criam listas (estilo Letterboxd) e interagem uns com os outros.

## 1. O Log (Marcadores Rápidos)
**Ação do Usuário:** Dentro da página de um Filme, ele usa os botões rápidos de interação.
- *Tipos de Ação:* Marcar como Visto (Assistidos), Dar uma Nota de 1 a 5 estrelas e Dar um "Coração" (Favorito).
> **👉 Rotas do Backend:**
> - `POST /movies/:id/log`
>   Payload: `{ "watched": true, "rating": 4.5, "liked": false }`
> - `GET /users/:username/watched` (Para exibir a lista completa de "Assistidos para filmes" depois)

## 2. A Resenha (Reviews e Defesa Anti-Spoiler)
**Ação do Usuário:** Escreve um texto longo com Opinião sobre o filme. Se a flag de spoiler estiver ativa, o texto vem "borrado" da API para quem está lendo pela primeira vez.
- *Na tela:* O usuário cria, lê as resenhas dos outros, tem o poder de editar/deletar as suas próprias, e precisa clicar num botão "Ler mesmo assim" para desembaçar os textos bloqueados.
> ** Rotas do Backend (CRUD Completo de Review):**
> - `POST /movies/:id/reviews` (Payload: `{ "text": "Amei!", "contains_spoilers": false }`)
> - `GET /movies/:id/reviews` (Lê todas as Reviews daquele filme, a flag `contains_spoilers=true` avisa o Front para borrar)
> - `PUT /reviews/:review_id` (Para edição)
> - `DELETE /reviews/:review_id`

## 3. Listas Personalizadas (Watchlists Públicas)
**Ação do Usuário:** Cria coleções arranjadas (Ex: "Melhores de 2026", "Só Filmes Ruins").
- *Na tela:* Ele pode criar a lista, alterar o nome, adicionar/remover filmes dela, excluí-la, e visitar as listas dos amigos.
> ** Rotas do Backend:**
> - `POST /lists` (Payload: `{ "title": "Top 10", "description": "...", "is_public": true }`)
> - `POST /lists/:list_id/movies/:movie_id` (Adiciona o filme na lista)
> - `DELETE /lists/:list_id/movies/:movie_id` (Remove o filme da lista)
> - `PUT /lists/:list_id` (Edita o texto da Lista)
> - `DELETE /lists/:list_id` 
> - `GET /users/:username/lists` (Ver listas)

## 4. Interação em Comunidade (Engajamento)
**Ação do Usuário:** Viu uma Resenha engraçada de outra pessoa e decidiu interagir.
- *Regra:* Só pode curtir ou comentar se estiver logado.
> ** Rotas do Backend:**
> - `POST /reviews/:review_id/likes` (Curtir)
> - `POST /reviews/:review_id/comments` (Comentar, Payload: `{ "text": "Hahaha concordo" }`)

## 5. A Timeline (Feed de Atividades)
**Ação do Usuário:** Abre a Home do aplicativo na aba "Social" para ver o que tá rolando.
- *Timeline Pessoal (Sua):* Mostra um histórico de tudo o que você fez (Ex: Maria curtiu Thor, Maria fez uma maratona de 3 filmes hoje).
- *Timeline dos Amigos:* O App agrupa cronologicamente os logs das pessoas que você Segue.
> ** Rotas do Backend:**
> - `GET /users/me/feed` (Atividade da sua conta)
> - `GET /users/me/social-feed` (Atividade de todo mundo que você está seguindo na tabela `Follow`).

## 6. Seguir e Deixar de Seguir (A Cola Social)
**Ação do Usuário:** Na página de perfil de outra pessoa, clica no botão "Seguir" (ou "Deixar de Seguir" se já segue).
- *Regra:* Precisa estar logado. A ação dispara uma Notificação pro outro usuário.
> ** Rotas do Backend:**
> - `POST /users/:username/follow` (Seguir)
> - `DELETE /users/:username/follow` (Deixar de seguir)
