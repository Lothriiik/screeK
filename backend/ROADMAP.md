# 🗺️ Roadmap — Cine Pass Backend

> Visão macro das próximas fases de desenvolvimento. Documento informativo.

---

## Fase 1 · Segurança, Autenticação e Gestão de Usuários
Blindar a API antes de expor qualquer funcionalidade.

- Hashing de senhas com **Bcrypt**
- Geração e validação de **JWT** (Access Token)
- Middleware de autenticação no Chi
- Rotas de Auth: Register, Login, Logout, Forgot/Reset Password, Change Password
- Rotas protegidas de Perfil: `GET/PUT/DELETE /users/me`, `GET /users/{username}`
- Busca de usuários, Followers/Following, Watchlist
- **Interfaces nos stores** (Repository Pattern com Dependency Inversion)
- **DTOs** (separar request/response dos models internos)
- **Config struct** centralizada + separação `main.go`/`app.go`

---

## Fase 2 · Motor de Compras & Alta Concorrência (Bookings)
O coração transacional com lock de assentos via Redis.

- Handlers REST para Cinemas, Sessões e Mapa de Assentos
- **Redis**: Lock temporário de poltronas (TTL ~5 min) no carrinho
- Fluxo completo: Reservar → Pagar → Gerar QR Code
- Cancelamento com liberação automática de assento
- Campo `SessionType` (`PREMIERE`, `RESCREENING`, `FESTIVAL`)
- **Lock Pessimista (PostgreSQL)**: Uso de `SELECT FOR UPDATE` (`clause.Locking`) no GORM para a gravação definitiva do assento.
- **Context Propagation**: Passar o `r.Context()` do HTTP para o GORM impedir operações fantasmas no banco.
- Testes de race condition na reserva simultânea

---

## Fase 3 · Domínio Social & Interações (REST)
Reviews, Listas, Feed e Follow.

- CRUD de Reviews com flag Anti-Spoiler
- Likes e Comments em Reviews
- Listas customizadas de filmes
- Log de filmes assistidos (nota, like, data)
- Follow/Unfollow
- Feed pessoal e social (timeline dos amigos)

---

## Fase 4 · Integrações Externas (Pagamento & Email)
Conectar com serviços reais para fluxos críticos.

- **Strategy Pattern** no pagamento: interface `PaymentStrategy` com implementações pra Cartão (Stripe) e PIX
- **Idempotency-Key**: Garantir processamento único de pagamentos evitando cobranças duplicadas
- **Stripe (Sandbox)**: Substituir mock por PaymentIntent + Webhooks
- **Resend (Email)**: Emails transacionais (confirmação de compra, redefinição de senha, alertas)

---

## Fase 5 · Notificações & Jobs
Engajamento e automação.

- **Observer Pattern (EventBus)**: Eventos como `PURCHASE_COMPLETED` ou `NEW_FOLLOW` disparam listeners (email, notificação, histórico)
- CRUD de Notificações
- CRON Job: Watchlist × Sessões → alertas de estreia e exibições alternativas
- *(Opcional)* WebSockets para push em tempo real

---

## Fase 6 · Infraestrutura & DevOps
Profissionalizar o ambiente de desenvolvimento e deploy.

- **Docker**: Dockerfile multi-stage pro backend Go + `docker-compose.yml` subindo Postgres + Redis + API
- **Migrations SQL**: Configurar ferramenta externa (`golang-migrate`) no lugar do AutoMigrate para versionamento profissional do schema
- **CI/CD com GitHub Actions**: Pipeline automático de `go vet` + `go test` + `go build` a cada push
- **Swagger / OpenAPI**: Documentação interativa auto-gerada das rotas REST com `swaggo/swag`

---

## Fase 7 · Hardening & Observabilidade
Blindar a API e ter visibilidade do que acontece em produção.

- **Graceful Shutdown**: Capturar sinais do sistema (`SIGTERM`) e fechar conexões DB/Redis de forma limpa, processando requests em andamento
- **Rate Limiting**: Middleware de limite de requisições por IP (proteção contra abuso/DDoS)
- **Logging Estruturado**: Trocar `log.Println` por `slog` (stdlib Go 1.21+) com logs em JSON e levels (INFO/WARN/ERROR)
- **Circuit Breaker**: Padrão de resiliência na comunicação com a TMDB (`sony/gobreaker`). Se a API externa cair, o app serve dados do cache local em vez de travar.
- **Requisições Paralelas (Goroutines)**: Usar `golang.org/x/sync/errgroup` para buscar créditos e detalhes da TMDB simultaneamente sem bloquear.
- **Timeouts**: Uso massivo de `context.WithTimeout` para abortar requisições externas lentas.
- **Database Indexing**: Índices compostos nas queries mais frequentes (reviews por usuário+filme, tickets por sessão, cinemas por cidade). Documentar estratégia no README.

---

## Fase 8 · Testes & Documentação Final (Portfólio)
Polir o projeto para o GitHub.

- Testes unitários (Bcrypt, JWT, Lock de assentos)
- Testes de integração nas APIs REST
- README técnico com diagramas de arquitetura e badge de CI verde
