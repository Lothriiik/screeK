# 🛠 Cine Pass: Backend Architecture

Este diretório contém o coração transacional e API do Cine Pass. Focado estritamente na alta performance provida por concorrência da linguagem Go (Goroutines) e isolamento atômico das compras (Go Context/DB Txn).

## 📊 Modelagem do Banco de Dados (PostgreSQL)

O banco de dados do projeto suporta carga relacional massiva, garantida por fortes integridades (Foreign Keys e Unique Indices). As tabelas se conectam para refletir 5 Domain Flows independentes:

### 1. Filmes / Catálogo (Sync com TMDB)
- **`Movie`**: Entidade principal que estoca as infos estáticas dos filmes da TMDB. 
- **`Genre`**: Muitos-para-muitos link com `Movie`.
- **`Person`**: Abstrai os técnicos da indústria de cinema.
- **`MovieCredit`**: O link que liga Atores e Equipe à `Movie`, contendo detalhes de `Character` e `Role`.

### 2. Social & Usuário
- **`User`**: Core de contas e Auth (Senhas Hasheadas). 
- **`Follow`**: Tabela pivot com controle simétrico de Seguinte e Seguido para as TLs.
- **`Review`, `WatchedMovie`**: Ligações Polimórficas engatando o Movie ao User, suportando `ReviewLike` e `ReviewComment`.
- **`MovieList`, `WatchlistItem`**: Para agregações e filas de filme.

### 3. Venda & Booking
- Entidades de Ambiente: **`Cinema`** -> **`Room`** -> **`Seat`**.
- Motor de Concorrência: **`Session`** vinculando Sala, Horário e Filme.
- Entidades de Carrinho (A Prova de Erro): **`Transaction`** gerando childs de **`Ticket`** amarrados à Poltrona final.

---

## 🔌 API Externa & Cache-Aside
A estratégia **Cache-Aside** blinda a aplicação de bloqueios do *The Movie Database* (TMDB).
Toda requisição pública funciona da seguinte maneira (No `GetDetails` Handler):
1. Vai de encontro ao PG Local: `db.GetMovie(123)`.
2. Em caso de *Miss*, consome a API REST externa do TMDB, injeta/mapeia dentro do nosso formato Go Struct.
3. Roda internamente um bulk save do filme (e todos seus créditos) no PostgreSQL.
4. Responde o Client (E todas as próximas calls responderão do banco PG super rápido por latência interna).

---

## 🔥 Estratégia de Reserva de Poltronas
A reserva de poltronas do `/tickets/reserve` foi desenhada utilizando **Select For Update (Pessimistic DB Lock)** e Controle Transacional nativo do GORM.
- Se o Usuário A e Usuário B clicam na mesma cadeira (mesmo Seat ID na mesma Sessão) no exato milissegundo: As Request-goroutines bloqueiam o banco na verificação para impedir Double-Booking ou Phantom Reads de forma implacável.
- Caso o usuário vença o lock, a Poltrona entra em status `PENDING` por um Timer.

---

## 🚀 Estrutura de Pastas

```bash
/cmd/api      -> Entrypoint e Inicialização (Main, Env Vars, DB Start)
/internal
  /handlers   -> Recebem Echo Context, limpam Payload e roteiam (MVC Controllers)
  /models     -> Definições GORM Structs (Domínios de Tabela puro)
  /services   -> Integrações "World Wide" (API do TMDB HTTP Client, Emails, Scripts)
  /store      -> Conexão pesada no Banco. Todas queries raw e transações Gorm
```

## Setup do Workspace (Dev)
1. Preencha seu `.env` contendo `DATABASE_URL` (DSN de Postgres) + `TMDB_TOKEN`.
2. Garanta as dependências: `go get github.com/joho/godotenv github.com/labstack/echo/v4 gorm.io/driver/postgres x/crypto/bcrypt`.
3. Inicie a compilação: `go run cmd/api/main.go`.

---
*Backend arquitetado do zero para consolidação de conhecimentos avançados em Go, Bancos Relacionais e APIs de alta vazão.*
