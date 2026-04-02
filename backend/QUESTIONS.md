# API Route Coverage Audit Summary — screeK

## Project Understanding Summary
O **screeK** é uma plataforma de cinema social que combina a transacionalidade de reservas de ingressos (Stripe/Redis) com a interação social (Reviews/Feeds/Listas). A API é estruturada em monólito modular com 11 domínios principais.

### Critical Flows
- **Auth**: Identidade e controle de acesso (RBAC).
- **Booking**: Motor de reserva com lock e confirmação via Webhook.
- **Social**: Ciclo de vida de postagens e conexões entre usuários.
- **Management**: Configuração da infraestrutura de exibição (Cinemas/Salas/Sessões).

### Areas with Weakest Route Coverage
- **Management Admin**: Quase puramente "Create-Only". Falta capacidade de gestão (Update/Delete/Audit) de recursos fundamentais como Cinemas e Salas.
- **Social Discovery**: Focado em feeds, mas carece de endpoints para detalhamento de interações (replies) e metadados de rede (seguidores).
- **Catalog Management**: Listas personalizadas possuem CRUD parcial, sem possibilidade de edição de metadados após criação.

---

## Questions & Coverage Audit

### 1. Management (Infrastructure Admin)

> [!WARNING]
> Este módulo apresenta o maior risco de "lock-in" de dados, onde erros de digitação no cadastro de um Cinema ou Sala exigem intervenção manual no banco de dados.

**Q1. Missing Cinema/Room Management (Update/Delete)**
- **Where**: `internal/management/handler.go`
- **Gap**: Não existem rotas `PUT /admin/management/cinemas/{id}` ou `DELETE`.
- **Question**: Como um Admin deve proceder para corrigir o endereço de um cinema ou desativar uma sala com defeito? Devemos incluir rotas de Update/Delete ou existe uma trava proposital neste estágio?
- **Status**: [missing]

**Q2. Missing Room Listing for Cinema**
- **Where**: `internal/management/handler.go`
- **Gap**: Só é possível ver as salas via "Detalhes do Cinema" (Preload).
- **Question**: Seria útil um endpoint `GET /admin/management/cinemas/{id}/rooms` para auditoria rápida de capacidade sem carregar todo o objeto Cinema?
- **Status**: [improvement]

### 2. Social & Interactions

**Q3. Post Detail and Threading**
- **Where**: `internal/social/handler.go`
- **Gap**: Não há um endpoint `GET /social/posts/{id}` para ver um post específico e suas respostas de forma isolada.
- **Question**: Como o frontend deve renderizar uma "thread" de conversação? Dependemos apenas do Feed Global?
- **Status**: [missing]

**Q4. Network Transparency (Followers/Following Lists)**
- **Where**: `internal/social/handler.go`
- **Gap**: O usuário pode seguir (`ToggleFollow`), mas não pode listar quem ele segue ou quem o segue.
- **Question**: Como implementaremos a tela de "Seguidores" no Perfil sem esses endpoints de listagem?
- **Status**: [missing]

### 3. Bookings (Transactional Flow)

**Q5. Admin Ticket/Transaction Overrides**
- **Where**: `internal/bookings/handler.go`
- **Gap**: Não existem rotas para um Admin cancelar um ingresso ou forçar um estorno manualmente fora do fluxo de webhook.
- **Question**: Em caso de falha de energia no cinema, como o Admin do screeK cancela massivamente os ingressos de uma sessão e libera os assentos?
- **Status**: [missing]

**Q6. Seat Change Request**
- **Where**: `internal/bookings/handler.go`
- **Gap**: Uma vez reservado (PENDING), o usuário não pode trocar de assento sem cancelar a transação e iniciar outra.
- **Question**: Devemos permitir a troca de assento enquanto o Lock de 10 minutos está ativo no Redis?
- **Status**: [deferred]

### 4. Catalog (Discovery & Lists)

**Q7. Movie List Metadata Update**
- **Where**: `internal/catalog/handler.go`
- **Gap**: `PUT /lists/{id}` ausente.
- **Question**: O usuário consegue criar uma lista, mas não consegue mudar o título ou descrição dela?
- **Status**: [missing]

**Q8. List Discovery (Public Lists)**
- **Where**: `internal/catalog/handler.go`
- **Gap**: Não há endpoint para navegar por listas de outros usuários ou listas "Trending".
- **Question**: O aspecto "Social" do screeK deve incluir a descoberta de curadorias de terceiros por padrão?
- **Status**: [improvement]

---

## Suggested Priority Actions
1. **[IMMEDIATE]** Adicionar Update/Delete para `Cinemas` e `Rooms` (Management).
2. **[S6-SOCIAL]** Implementar listagem de Seguidores e Detalhe de Post.
3. **[CATALOG]** Adicionar edição de metadados para Listas.
