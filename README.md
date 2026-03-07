# 🎬 Cine Pass

> **O ecossistema perfeito para verdadeiros amantes de cinema. Descubra filmes, avalie, acompanhe seus amigos e compre seu ingresso — tudo no mesmo lugar.**

O **Cine Pass** é o software centralizado que resolve o problema da fragmentação na experiência do cinéfilo. Em vez de usar diferentes aplicativos para buscar filmes (IMDB/Letterboxd), conversar com amigos (Redes Sociais) e comprar o bilhete (Ingresso.com), o projeto une a **Auditoria Social** ao **Comércio de Ingresso**, tornando o processo orgânico, engajante e seguro.

---

## 🎯 Objetivo do Projeto (Portfólio / Aprendizado)
- **Para o Usuário (Produto):** Unificar a experiência de ida ao cinema.
- **Para o Desenvolvedor:** Desenvolver e expor arquiteturas Backend concisas de alto nível. Validar a performance e consistência transacional do ecossistema construído com alta linguagem de concorrência (Go), implementando travas precisas (Locking) durante a compra para assegurar a consistência de cadeiras simultâneas, servindo de portfólio rico.

---

## � Requisitos Funcionais

### 1. Gestão de Usuário e Autenticação
- **RF01:** O usuário deve poder se cadastrar e fazer login no sistema (JWT).
- **RF02:** O usuário deve poder ter um perfil customizável com foto, bio e seleção de pronomes.
- **RF03:** O usuário deve poder fixar 3 filmes favoritos em seu perfil global.

### 2. Domínio de Filmes (Catálogo)
- **RF04:** O usuário deve poder pesquisar filmes e pessoas (Atores/Diretores).
- **RF05:** O sistema consumirá e fará cache automático dos metadados globais da API TMDB.
- **RF06:** O usuário deve acessar a biblioteca completa de informações de um filme: sinopse, capa, gênero, duração e membros do elenco.

### 3. Aspectos Sociais e Iterativos
- **RF07:** O usuário deve poder registrar ("logar") se assistiu a um filme, sua data de visualização, dar like e nota.
- **RF08:** O usuário deve poder criar, editar e apagar "Reviews" textuais com **Defesa Anti-Spoiler** ativada.
- **RF09:** O usuário deve ser capaz de curtir e comentar nas reviews de outras pessoas.
- **RF10:** O fluxo comportará a função de Seguir e Deixar de Seguir perfis.
- **RF11:** O sistema deve oferecer um Feed Pessoal ("Meus logs") e Feed Social ("Logs e reviews recentes dos meus amigos").
- **RF12:** O usuário deve poder criar Listas customizadas e gerenciar itens da própria "Watchlist".

### 4. Compra de Ingressos (Booking)
- **RF13:** O sistema listará os Filmes Ativos em Cartaz na cidade/data escolhida.
- **RF14:** O aplicativo mostrará a matriz visual das sessões mapeando as cadeiras ocupadas e livres.
- **RF15:** O usuário deve conseguir selecionar e "travar" 1 ou mais cadeiras no banco de dados temporariamente (Lock).
- **RF16:** O sistema fará a conversão do "Carrinho" em "Transaction Paga" mediante finalização, gerando tickets únicos com QR Code.
- **RF17:** O dono do ingresso poderá cancelar bilhetes (estornando os assentos do banco).

### 5. Notificações Tempo Real
- **RF18:** O sistema enviará notificações através do sino global quando: um pacote de ingresso for lançado, a compra expirar, novas interações sociais acontecerem ou quando um filme da sua watchlist estrear no cinema local.

---

## 🏗 Arquitetura & Tecnologias
- **Backend Core:** **Monólito Modular** (Feature-First) em **Go** (Chi Router + net/http). Cada domínio (Users, Movies, Bookings, Social) vive em seu próprio pacote com handlers, models e stores isolados. Toda a API é **REST**.
- **Banco de Dados:** PostgreSQL com **GORM**. Transações com Locking Pessimista para compras de ingressos. Índices compostos nas queries mais frequentes.
- **Cache & Lock de Assentos:** **Redis** para lock temporário de poltronas (TTL) durante o fluxo de compra, evitando double-booking.
- **Resiliência:** **Circuit Breaker** (`sony/gobreaker`) na integração com a API TMDB — se a API externa cair, o app serve dados do cache local.
- **Segurança:** Bcrypt (hashing de senhas) + JWT (autenticação stateless) + Rate Limiting.
- **Observabilidade:** Logging estruturado com `slog` (stdlib Go 1.21+).
- **DevOps:** Docker + Docker Compose (Postgres + Redis + API) + CI/CD com GitHub Actions + Swagger/OpenAPI.

## 🎨 UI & Frontend
O ecossistema é suportado por uma Interface User-Centric baseada na estética **Brutalist Design**. O Design System independente define a tipografia, colorimetria e componentes isolados.
- **Design System & Mockups:** [Acesse o projeto oficial no Figma](https://www.figma.com/design/YU8WBTTEUgTk70VLmZAtBo/Design-Project---CINEPASS?node-id=0-1&t=Ok9SFoy1isIhGm2T-1)
- O frontend consome a API REST do backend.

> Para detalhes das APIs e da Modelagem do Banco de Dados, consulte o [README Técnico na pasta /backend](backend/README.md).

---
*Projeto desenvolvido para fins de aprendizado, validação de arquitetura e portfólio profissional.*
