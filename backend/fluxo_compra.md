# Fluxo de Compra de Ingresso (Cine Pass)

Este é o caminho feliz (Happy Path) que o cliente vai percorrer no App. Para cada passo do Frontend, listamos a rota que o Backend precisará ter para alimentar aquela tela.

## 1. Seleção Inicial (Filtro Base)
**Ação do Usuário:** O usuário abre o app e seleciona a **Cidade** e a **Data** que deseja ir ao cinema.
- *Na tela:* Vê todos os Filmes em Cartaz naquela cidade. Os filmes que não tem sessão naquele dia devem aparecer cinza ou ocultos.
- *Informações exibidas:* Capa, Título, Classificação, Duração, Idioma, Gênero e Sinopse.
> ** Rota do Backend:**
> `GET /movies/playing?city=SP&date=2026-03-05`

## 2. Escolha do Filme e Visualização dos Cinemas (O Modelo Hub)
**Ação do Usuário:** Clica no Filme desejado.
- *Na tela:* Ele vê os **Cinemas** daquela cidade que estão passando o filme, divididos horizontalmente (ex: Cinemark Eldorado, UCI Anália Franco). Abaixo de cada cinema, as sessões (horários).
- *Informações exibidas:* Nome do Cinema, Data, Hora, Preço das Sessões e Qual a Sala (Ex: Sala 3 VIP).
> ** Rota do Backend:**
> `GET /movies/:id/sessions?city=SP&date=2026-03-05`
> *(O Backend vai retornar a lista de horários unidas a tabela de Cinemas, e o Frontend agrupa o carrossel no visual).*

## 3. A Grande Matriz (Mapa de Assentos)
**Ação do Usuário:** Clica no horário (Sessão) que quer ir.
- *Na tela:* Vê o desenho da sala (O mapa com as posições).
- *Informações exibidas:* Posição do assento e preço. Cadeiras Ocupadas vs Livres.
> ** Rota do Backend:**
> `GET /sessions/:id/seats`

## 4. O "Carrinho" (Seleção de Assentos)
**Ação do Usuário:** Escolhe uma ou mais cadeiras (ex: ir com os amigos) e vê o preço total dos ingressos antes de pagar.
- **[CRÍTICO]** Neste exato momento, o Backend precisa **bloquear (Lock)** todas as cadeiras selecionadas no Banco de Dados para que mais ninguém as veja verde enquanto ele digita o cartão.
> ** Rota do Backend:**
> `POST /tickets/reserve`
> Payload: `{ "session_id": 10, "seat_ids": [45, 46, 47] }`

## 5. O Checkout (Pagamento)
**Ação do Usuário:** Escolhe a forma de pagamento (Cartão/PIX) e confirma a compra.
- *Na tela:* Tela de carregamento do banco processando.
> ** Rota do Backend:**
> `POST /tickets/:ticket_id/pay` 
> Payload: `{ "payment_method": "PIX" }`

## 6. O Ingresso Final
**Ação do Usuário:** Compra aprovada!
- *Na tela:* O bilhete é gerado na tela com todas as informações.
- *Informações exibidas:* QR Code do ingresso ou PDF para baixar.
> ** Rota do Backend:**
> `GET /tickets/:ticket_id` (Retorna os dados pro App renderizar o QR Code)
