# 🎬 screeK

<img width="1440" height="1024" alt="Desktop - 2" src="https://github.com/user-attachments/assets/f7b5d4c4-6967-4aa5-ad02-bb95b848eb86" />


> **O ecossistema perfeito para verdadeiros amantes de cinema. Descubra filmes, avalie, acompanhe seus amigos e compre seu ingresso — tudo no mesmo lugar.**

O **screeK** é uma plataforma que resolve a fragmentação da experiência do cinéfilo. Unificando a busca por metadados (TMDB), a interação social (Reviews/Feed) e a compra garantida de ingressos.

---

## 🎯 Objetivo do Projeto
- **Para o Usuário:** Unificar a jornada de ida ao cinema em um único app social e transacional.
- **Para o Desenvolvedor:** Validar a performance e consistência transacional usando **Go**, servindo como um portfólio.

---

## 🏗 Arquitetura & Stack Técnica

O backend é um **Monólito Modular** (Feature-First) onde cada domínio vive em seu próprio pacote, facilitando a manutenção e testes isolados.

### Tecnologias Core
| Camada | Tecnologia |
|--------|-----------|
| **Linguagem** | Go 1.25+ |
| **Banco de Dados** | PostgreSQL + GORM (Locks Pessimistas) |
| **Cache & Locks** | Redis (TTL de 10min para assentos) |
| **Pagamentos** | Stripe API (Idempotency + Webhooks) |
| **E-mails** | Resend API (Tickets via QR Code) |
| **Docs** | Swagger / OpenAPI (via `swaggo`) |

---

## 🚀 Como Rodar o Projeto (Backend)

### Pré-requisitos
- Go 1.25+ e Docker / Docker Compose.
- Tokens de API: [TMDB](https://www.themoviedb.org/settings/api), [Stripe](https://dashboard.stripe.com/apikeys) e [Resend](https://resend.com).

### 1. Configuração do Ambiente
Crie um arquivo `.env` na pasta `backend/` seguindo o exemplo:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/screek?sslmode=disable
REDIS_URL=localhost:6379
TMDB_TOKEN=seu_token
JWT_SECRET=sua_secret
STRIPE_KEY=sk_test_...
RESEND_KEY=re_...
```

### 2. Subir Infraestrutura e API
```bash
# Na raiz do projeto ou na pasta backend
docker-compose up -d
go mod download
go run cmd/api/main.go
```
A API estará disponível em `http://localhost:8003` (conforme config). O **Swagger** pode ser acessado em `/swagger/index.html`.

---

## 🛠 Fluxos Críticos & Performance

### 🔒 Reserva de Assentos (Redis Lock)
O sistema utiliza um **Locking Distribuído** no Redis com TTL de 10 minutos. Se o pagamento não for confirmado via Webhook do Stripe nesse período, os assentos são liberados automaticamente por um worker interno.

### 🍱 Cache-Aside (TMDB)
Para evitar limites de taxa da API externa e lentidão, o sistema faz cache automático de filmes, gêneros e créditos no PostgreSQL. Se os dados locais tiverem menos de 7 dias, eles são servidos instantaneamente.

### ⚡ Performance PostgreSQL
Implementamos **índices compostos** nas tabelas de `tickets`, `sessions` e `transactions` para eliminar Sequential Scans. Confira o guia [PERFORMANCE_INDEXES.md](backend/PERFORMANCE_INDEXES.md) para detalhes.

---

## 📖 Referência da API (Principais Endpoints)

| Domínio | Método | Rota | Descrição |
|--------|--------|------|-----------|
| **Auth** | POST | `/auth/login` | Login stateless (JWT) |
| **Movies** | GET | `/movies/{id}` | Detalhes com Cache-Aside |
| **Bookings** | POST | `/tickets/reserve` | Reserva com Redis Lock |
| **Social** | GET | `/feed` | Feed polimórfico de amigos |
| **Notifications** | WS | `/ws` | Notificações real-time via WebSocket |

---

## 🎨 Design & UI
O ecossistema é suportado por uma Interface baseada na estética **Brutalist Design**.
- [Acesse o projeto oficial no Figma](https://www.figma.com/design/YU8WBTTEUgTk70VLmZAtBo/Design-Project---screek)

---
*Desenvolvido como portfólio focado em arquitetura modular, concorrência em Go e resiliência de sistemas.*
