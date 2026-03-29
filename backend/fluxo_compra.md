# Fluxo de Compra de Ingresso (screeK)

Este é o caminho feliz (Happy Path) que o cliente vai percorrer no App. Para cada passo do Frontend, listamos a rota que o Backend possui para alimentar aquela tela.

## 1. Seleção Inicial (Filtro Base)
**Ação do Usuário:** O usuário abre o app e seleciona a **Cidade** e a **Data** que deseja ir ao cinema.
- *Na tela:* Vê todos os Filmes em Cartaz naquela cidade. Os filmes que não tem sessão naquele dia devem aparecer cinza ou ocultos.
- *Informações exibidas:* Capa, Título, Classificação, Duração, Idioma, Gênero e Sinopse.
> **👉 Rota do Backend:**
> `GET /playing?city=Sorocaba&date=2026-03-05`

## 2. Escolha do Filme e Visualização dos Cinemas
**Ação do Usuário:** Clica no Filme desejado.
- *Na tela:* Ele vê os **Cinemas** daquela cidade que estão passando o filme, divididos horizontalmente. Abaixo de cada cinema, as sessões (horários).
- *Informações exibidas:* Nome do Cinema, Data, Hora, Preço das Sessões e Qual a Sala (Ex: Sala 3 VIP).
> **👉 Rota do Backend:**
> `GET /{id}/sessions?city=Sorocaba&date=2026-03-05`

## 3. Mapa de Assentos
**Ação do Usuário:** Clica no horário (Sessão) que quer ir.
- *Na tela:* Vê o desenho da sala com as posições das cadeiras.
- *Informações exibidas:* Posição do assento e preço. Cadeiras Ocupadas vs Livres.
> **👉 Rota do Backend:**
> `GET /sessions/{id}/seats`

## 4. Reserva Temporária (Lock de 10 Minutos)
**Ação do Usuário:** Escolhe uma ou mais cadeiras e clica em "Reservar".
- **[CRÍTICO]** O Backend utiliza **Redis (SETNX)** para bloquear os assentos selecionados. O usuário tem **10 minutos** para concluir o pagamento antes que os assentos sejam liberados automaticamente pelo Worker de expiração.
> **👉 Rota do Backend:**
> `POST /tickets/reserve`
> Payload: `{ "session_id": 10, "tickets_request": [{ "seat_id": 45, "type": "STANDARD" }] }`
> *Retorna:* `transaction_id` e o valor total em centavos.

## 5. Pagamento (Stripe Integration)
**Ação do Usuário:** Confirma a intenção de pagar.
- **Segurança:** Exige o cabeçalho `Idempotency-Key` para evitar cobranças duplicadas.
- **Fluxo:** O backend cria um `PaymentIntent` no Stripe e retorna um `client_secret`.
> **👉 Rota do Backend:**
> `POST /transactions/{id}/pay`
> Header: `Idempotency-Key: <uuid-unico>`
> Payload: `{ "payment_method": "card" }`
> *Retorna:* `client_secret` para o Stripe Elements no Frontend.

## 6. Confirmação e Entrega (Webhook & Email)
**Ação Silenciosa:** O Stripe notifica o Backend via Webhook após o sucesso do pagamento.
- **Ação:** O backend marca a transação como `PAID`, gera os QR Codes finais (prefixo `SCREEK-`) e envia os ingressos por **Email (Resend)** de forma assíncrona.
> **👉 Webhook:** `POST /webhooks/stripe`

## 7. Meus Ingressos
**Ação do Usuário:** Visualiza os ingressos comprados.
> **👉 Rota do Backend:**
> `GET /tickets/{id}` (Visualizar um ingresso específico com QR Code)
> `GET /users/me/tickets?status=upcoming` (Listagem para o usuário logado)

