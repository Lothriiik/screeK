# T64 — Estratégia de Performance: Índices no PostgreSQL

> **Objetivo:** Documentar quais índices existem, por que foram criados, e quais ainda precisam ser adicionados para eliminar sequential scans nas queries mais críticas do screeK.

---

## Por que isso importa

Sem índice, o Postgres faz um **sequential scan**: lê todas as linhas da tabela até encontrar o que precisa. Isso é aceitável para tabelas pequenas, mas catastrófico em produção:

| Tabela        | Estimativa de linhas (produção) | Custo sem índice |
|---------------|----------------------------------|------------------|
| `tickets`     | milhões                          | scan completo a cada consulta de ingresso |
| `posts`       | centenas de milhares             | feed lento a cada requisição social |
| `transactions`| centenas de milhares             | checkout travado |
| `sessions`    | dezenas de milhares              | mapa de assentos lento |

**B-Tree** é o tipo de índice padrão do Postgres e funciona para a maioria dos casos: igualdade (`=`), intervalo (`>`, `<`, `BETWEEN`), e ordenação (`ORDER BY`).

---

## Índices Existentes (via GORM tags)

Esses índices já são criados pelo AutoMigrate com base nas tags dos models.

### `users`
```
UNIQUE INDEX on username
UNIQUE INDEX on email
```
**Por quê:** Login (`WHERE username = ?`) e recuperação de senha (`WHERE email = ?`) são queries de alta frequência. Sem índice único, o Postgres faria scan completo da tabela a cada login.

---

### `movies`
```
UNIQUE INDEX on tmdb_id
```
**Por quê:** Todo acesso a filme passa pelo TMDB ID (`WHERE tmdb_id = ?`). É o ponto de entrada do cache-aside — deve ser instantâneo.

---

### `genres`
```
UNIQUE INDEX on tmdb_id
```

---

### `people`
```
UNIQUE INDEX on tmdb_id
```

---

### `posts`
```
INDEX on user_id
INDEX on post_type
INDEX on created_at
INDEX on parent_id
INDEX on reference_id
```
**Por quê:**
- `user_id` — buscar posts de um usuário específico
- `post_type` — filtrar apenas REVIEWs, SESSION_SHAREs etc.
- `created_at` — ordenação do feed (`ORDER BY created_at DESC`)
- `parent_id` — buscar replies de um post
- `reference_id` — buscar posts vinculados a um filme ou sessão

---

### `follows`
```
UNIQUE INDEX composto on (follower_id, followee_id)
```
**Por quê:** Evita follows duplicados e garante que a verificação "A segue B?" seja O(log n) em vez de O(n).

---

## ⚠️ Índices Faltando (a adicionar)

Estas são as queries identificadas no código que **não têm índice** e vão gerar sequential scans em produção.

---

### 1. `tickets` — Queries mais críticas do sistema

**Query em `store.go → GetSeatsBySession`:**
```sql
LEFT JOIN tickets t ON t.seat_id = s.id
  AND t.session_id = ?
  AND t.status != 'CANCELLED'
```

**Query em `store.go → CreateReservation`:**
```sql
WHERE seat_id IN ? AND session_id = ? AND status != 'CANCELLED'
```

**Query em `store.go → GetUserTickets`:**
```sql
JOIN transactions trx ON trx.id = tickets.transaction_id
WHERE trx.user_id = ?
```

**Índices necessários:**
```sql
-- Índice composto para o mapa de assentos e verificação de conflito
CREATE INDEX idx_tickets_session_seat_status
  ON tickets (session_id, seat_id, status);

-- Índice para buscar tickets por transaction_id (join frequente)
CREATE INDEX idx_tickets_transaction_id
  ON tickets (transaction_id);
```

**Por quê o composto?** A query sempre filtra por `session_id` + `seat_id` + `status` juntos. Um índice nos três elimina o scan e resolve a query num único lookup de B-Tree.

---

### 2. `transactions` — Checkout e webhook

**Query em `store.go → PayTransaction`:**
```sql
WHERE id = ? AND user_id = ? AND status = 'PENDING'
```

**Query em `store.go → GetTransactionByID`:**
```sql
WHERE id = ? AND user_id = ?
```

**Índice necessário:**
```sql
-- Filtragem por user + status é comum no checkout e histórico
CREATE INDEX idx_transactions_user_id_status
  ON transactions (user_id, status);
```

**Nota:** `id` (UUID, primary key) já tem índice automático. O composto `(user_id, status)` cobre os dois padrões de query acima.

---

### 3. `sessions` — Listagem de filmes em cartaz

**Query em `store.go → GetMoviesPlaying` e `GetSessionsByMovie`:**
```sql
WHERE c.city ILIKE ?
  AND s.start_time >= ?
  AND s.start_time < ?
```

**Índices necessários:**
```sql
-- Busca de sessões por janela de tempo (muito frequente)
CREATE INDEX idx_sessions_start_time
  ON sessions (start_time);

-- Busca de sessões por filme (join frequente)
CREATE INDEX idx_sessions_movie_id
  ON sessions (movie_id);

-- Busca de sessões por sala (join com cinemas)
CREATE INDEX idx_sessions_room_id
  ON sessions (room_id);
```

**Nota sobre `ILIKE`:** O filtro `c.city ILIKE ?` em `cinemas` não usa B-Tree. Para buscas case-insensitive eficientes, o ideal futuro é um índice funcional: `CREATE INDEX idx_cinemas_city_lower ON cinemas (lower(city))`. Por agora, como o número de cinemas é pequeno, o impacto é baixo.

---

### 4. `seats` — Mapa de assentos

**Query em `store.go → GetSeatsBySession`:**
```sql
WHERE s.room_id = ?
ORDER BY s.row, s.number
```

**Índice necessário:**
```sql
-- Busca de todas as poltronas de uma sala, ordenadas
CREATE INDEX idx_seats_room_id_row_number
  ON seats (room_id, row, number);
```

**Por quê composto com `row, number`?** O `ORDER BY s.row, s.number` é resolvido direto pelo índice, sem operação de sort adicional.

---

### 5. `movie_logs` — Atividade social

**Query implícita no feed e perfil de usuário:**
```sql
WHERE user_id = ? AND movie_id = ?
```

**Índice existente:** `(user_id, movie_id)` já é primary key composta — coberto.

---

## Como Adicionar os Índices

### Opção A — Via Migration SQL (recomendado para produção futura)

Crie um arquivo `migrations/002_performance_indexes.sql`:

```sql
-- Tickets: resolução do mapa de assentos e verificação de conflito
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_session_seat_status
  ON tickets (session_id, seat_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_transaction_id
  ON tickets (transaction_id);

-- Transactions: filtros de checkout
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id_status
  ON transactions (user_id, status);

-- Sessions: listagem por data e filme
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_start_time
  ON sessions (start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_movie_id
  ON sessions (movie_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_room_id
  ON sessions (room_id);

-- Seats: mapa ordenado por sala
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_room_id_row_number
  ON seats (room_id, row, number);
```

> **`CONCURRENTLY`** cria o índice sem travar a tabela. Essencial em produção.

---

### Opção B — Via GORM tags (para o AutoMigrate atual)

Adicione tags nos models enquanto ainda usa AutoMigrate:

```go
// bookings/model.go

type Ticket struct {
    SessionID int `gorm:"not null;index:idx_tickets_session_seat_status,composite:session"`
    SeatID    *int `gorm:"index:idx_tickets_session_seat_status,composite:seat"`
    Status    TicketStatus `gorm:"index:idx_tickets_session_seat_status,composite:status"`
    TransactionID uuid.UUID `gorm:"index"`
    // ...
}

type Session struct {
    StartTime time.Time `gorm:"not null;index"`
    MovieID   int       `gorm:"not null;index"`
    RoomID    int       `gorm:"not null;index"`
    // ...
}

type Seat struct {
    RoomID int    `gorm:"not null;index:idx_seats_room"`
    Row    string `gorm:"not null;index:idx_seats_room"`
    Number int    `gorm:"not null;index:idx_seats_room"`
    // ...
}

type Transaction struct {
    UserID uuid.UUID    `gorm:"index:idx_tx_user_status,composite:user"`
    Status TicketStatus `gorm:"index:idx_tx_user_status,composite:status"`
    // ...
}
```

---

## Como Verificar se um Índice está Sendo Usado

Conecte no banco e use `EXPLAIN ANALYZE`:

```sql
-- Exemplo: verificar o mapa de assentos
EXPLAIN ANALYZE
SELECT s.*, CASE WHEN t.id IS NOT NULL THEN true ELSE false END as is_occupied
FROM seats s
LEFT JOIN tickets t ON t.seat_id = s.id AND t.session_id = 1 AND t.status != 'CANCELLED'
WHERE s.room_id = 1
ORDER BY s.row, s.number;
```

**O que procurar na saída:**
- ✅ `Index Scan using idx_...` — índice em uso
- ❌ `Seq Scan on tickets` — sequential scan, índice faltando ou não usado

---

## Resumo de Prioridade

| Índice | Tabela | Impacto | Prioridade |
|--------|--------|---------|------------|
| `idx_tickets_session_seat_status` | tickets | Crítico — mapa de assentos e anti double-booking | 🔴 Alta |
| `idx_tickets_transaction_id` | tickets | Alto — listagem de ingressos do usuário | 🔴 Alta |
| `idx_transactions_user_id_status` | transactions | Alto — checkout e histórico | 🔴 Alta |
| `idx_sessions_start_time` | sessions | Médio — filmes em cartaz por data | 🟡 Média |
| `idx_sessions_movie_id` | sessions | Médio — sessões de um filme | 🟡 Média |
| `idx_seats_room_id_row_number` | seats | Médio — ordenação do mapa | 🟡 Média |
| `idx_cinemas_city_lower` | cinemas | Baixo — número de cinemas é pequeno | 🟢 Baixa |
