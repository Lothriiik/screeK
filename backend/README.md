# 🛠 Cine Pass: Backend Architecture

Este diretório contém o coração transacional e API do Cine Pass. Construído com **Arquitetura de Monólito Modular** (Feature-First) em Go, onde cada domínio do sistema vive isolado em seu próprio pacote.

---

## 🚀 Estrutura de Pastas

```bash
backend/
├── cmd/api/             → Entrypoint (main.go, env vars, boot)
├── internal/
│   ├── users/           → Gestão de Usuários (model, handler, store)
│   ├── movies/          → Catálogo de Filmes + TMDB Client (model, handler, store, tmdb_service)
│   ├── bookings/        → Cinemas, Sessões, Ingressos e Pagamento (model, store)
│   ├── social/          → Reviews, Listas, Follow, Feed (model)
│   ├── auth/            → JWT, Login, Middleware (TODO)
│   └── platform/
│       ├── database/    → Conexão central PostgreSQL (compartilhada)
│       └── redis/       → Conexão Redis para locks de assentos (TODO)
├── fluxo_*.md           → Documentação dos fluxos de negócio
└── ROADMAP.md           → Roadmap completo do projeto
```

> **Princípio:** Cada pacote em `internal/` encapsula seu domínio. O `handler`, `store` e `model` ficam lado a lado. Structs e funções privadas (minúsculas) ficam invisíveis para outros pacotes — só o que é público (Maiúsculo) cruza as fronteiras do módulo.

---

## 📊 Modelagem do Banco de Dados (PostgreSQL)

O banco suporta carga relacional massiva com Foreign Keys e Unique Indices. As tabelas refletem 4 domínios independentes:

### 1. Filmes / Catálogo (`internal/movies/`)
- **`Movie`** → Entidade principal (sync com TMDB)
- **`Genre`** → Muitos-para-muitos com Movie
- **`Person`** → Atores, Diretores e Equipe técnica
- **`MovieCredit`** → Liga Person a Movie (Role + Character)

### 2. Usuários & Social (`internal/users/` + `internal/social/`)
- **`User`** → Core de contas e autenticação
- **`Follow`** → Tabela pivot Seguidor ↔ Seguido
- **`Review`**, **`WatchedMovie`** → Ligações User ↔ Movie com suporte a `ReviewLike` e `ReviewComment`
- **`MovieList`**, **`WatchlistItem`** → Listas e filas de filmes

### 3. Booking & Venda (`internal/bookings/`)
- Ambiente: **`Cinema`** → **`Room`** → **`Seat`**
- Motor: **`Session`** (vincula Sala + Horário + Filme + `SessionType`)
- Tipos de Sessão: `PREMIERE` | `RESCREENING` | `FESTIVAL`
- Carrinho: **`Transaction`** → **`Ticket`** (amarrado à poltrona final com QR Code)

---

## 🔌 API Externa & Cache-Aside

Estratégia **Cache-Aside** com **Circuit Breaker** na comunicação com a TMDB:

1. Busca no PostgreSQL local: `store.GetMovieByTMDBID(123)`
2. Em caso de *Miss*, consome a API TMDB e mapeia para as structs Go
3. Salva em bulk no PostgreSQL (filme + créditos + gêneros)
4. Próximas chamadas respondem direto do banco local

Se a TMDB cair, o Circuit Breaker (`sony/gobreaker`) abre o circuito e serve dados do cache sem travar a aplicação.

---

## 🔥 Estratégia de Reserva de Poltronas

O fluxo `POST /tickets/reserve` usa **Redis Lock (SETNX + TTL)** para segurar assentos temporariamente:

1. Usuário seleciona cadeiras → Redis trava cada `seat:session` com TTL de 5 minutos
2. Se outro usuário tentar o mesmo assento → Redis rejeita (já está travado)
3. No pagamento → Lock é convertido em registro permanente no PostgreSQL
4. Se expirar sem pagar → Redis libera automaticamente

Backup de segurança: Locking Pessimista no PostgreSQL (`SELECT FOR UPDATE`) para prevenir race conditions na gravação final.

---

## ⚙️ Tech Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Go 1.21+ |
| Framework HTTP | Echo v4 |
| ORM | GORM |
| Banco de Dados | PostgreSQL |
| Cache / Locks | Redis |
| Autenticação | Bcrypt + JWT |
| API Externa | TMDB (The Movie Database) |
| Resiliência | Circuit Breaker (sony/gobreaker) |
| Docs | Swagger / OpenAPI (swaggo/swag) |
| DevOps | Docker + Docker Compose + GitHub Actions CI/CD |
| Observabilidade | slog (logging estruturado JSON) |

---

## 🖥 Setup do Workspace (Dev)

1. Preencha o `.env` com `DATABASE_URL` (DSN Postgres) + `TMDB_TOKEN`
2. Suba a infraestrutura: `docker-compose up -d`
3. Inicie a API: `go run cmd/api/main.go`

---

*Backend arquitetado do zero para consolidação de conhecimentos avançados em Go, Bancos Relacionais, Redis e APIs de alta vazão.*
