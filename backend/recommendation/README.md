# screeK Intelligence Service

Serviço Python responsável por **uma coisa**: transformar dados de catálogo e
histórico em **ranking de filmes**.

> O motor de recomendação é intencionalmente um esqueleto. Toda a base
> (fonte de dados, features, API, testes) está pronta; a lógica de ranking
> será implementada incrementalmente em `app/recommender/engine.py`.

---

## Fronteiras: quem faz o quê

| Responsabilidade | Dono |
| --- | --- |
| Auth, usuários, catálogo, social, bookings | Go core (`backend/core`) |
| Import do Letterboxd | Go core (`internal/imports/letterboxd`) |
| Matching Letterboxd → TMDB | Go core (`MovieService.MatchMovieByTitleAndYear`) |
| Enriquecimento TMDB / seed do catálogo | Go core (`MovieService`, `cmd/seed`) |
| Busca textual / NLP | Meilisearch (futuro) |
| Similaridade semântica / "vibe" | pgvector (futuro) |
| **Ranking e recomendação** | **este serviço** |

O import do Letterboxd é **onboarding**: serve para o usuário não começar com
o perfil vazio. Ele não é o motor de recomendação e não deve ser duplicado
aqui.

`tools/` existe apenas para bootstrap offline (testes e desenvolvimento sem
Docker). Em produção, o Go é a única porta de entrada de dados.

---

## Fonte de dados

O motor nunca lê CSV ou Postgres diretamente: ele recebe um `Dataset`. Quem
monta o `Dataset` é uma implementação de `MovieDataSource`
(`app/data/source.py`).

### `postgres` (produção)

Lê as tabelas canônicas do Go core em modo **read-only**:

- `movies` (`id` interno + `tmdb_id` externo)
- `movie_logs` / `movie_log_records` (`user_id`, `movie_id`, `rating`, `liked`)
- `watchlists` / `watchlist_item_records`
- `genres` / `movie_genres`, `people` / `movie_credits`

Os nomes reais variam porque o schema é criado pelo GORM (`AutoMigrate`), não
pelo `01_initial_schema.sql` (que está desatualizado). A fonte detecta
`movie_logs` vs `movie_log_records` e `watchlists` vs `watchlist_item_records`
em tempo de execução.

```dotenv
DATA_SOURCE=postgres
DATABASE_URL=postgres://postgres:password@localhost:5432/screek?sslmode=disable
```

### `csv` (desenvolvimento/testes)

Lê `data/processed/{movies,ratings,watchlist}.csv`, gerados por `tools/cli.py`.
É o caminho rápido para testar a API de recomendação sem subir o Go nem o
Postgres.

```dotenv
DATA_SOURCE=csv
```

No modo CSV, se não houver `movies_id_map.csv`, a chave usada pelo motor é
`tmdb_id`. Com o mapa, passa a ser `movie_id` (canônico). O `Dataset` expõe
`key_column` para o motor não precisar adivinhar.

---

## Requisitos

- Python **3.13** (o ambiente local foi criado com `uv`).
- Token de leitura do TMDB (apenas para o bootstrap offline).
- Nenhum Docker/Postgres é necessário para o modo CSV.

## Setup

```powershell
cd backend/recommendation

# Ambiente virtual (já existe em .venv)
uv venv --python 3.13 .venv
.\.venv\Scripts\activate

# Dependências
uv pip install -r requirements.txt

# Configuração
Copy-Item .env.example .env
# edite .env e preencha TMDB_TOKEN (bootstrap) e/ou DATABASE_URL (produção)
```

Sem `uv`, use `python -m venv .venv` e `pip install -r requirements.txt`.

---

## Estrutura

```text
backend/recommendation/
  app/
    config.py                 # Settings (pydantic-settings, .env)
    core/
      constants.py            # escala de notas, colunas canônicas
      text.py                 # normalização de títulos
    schemas/                  # contratos Pydantic (API e domínio)
    data/
      dataset.py              # Dataset + builder CSV (bootstrap)
      source.py               # MovieDataSource: postgres | csv
      features.py             # TF-IDF de conteúdo + cosine similarity
    recommender/
      base.py                 # Protocol Recommender + Recommendation
      engine.py               # >>> MOTOR A IMPLEMENTAR <<<
    services/
      recommendation_service.py
    api/v1/routers/           # health, recommendations, similar, dataset
    cli.py                    # shim para tools.cli
    main.py                   # create_app() / FastAPI
  tools/                      # BOOTSTRAP (fora do runtime)
    letterboxd.py             # parser/normalizador do export
    tmdb.py                   # cliente TMDB + cache JSON em disco
    matching.py               # Letterboxd -> TMDB (score, cache incremental)
    import_service.py         # grava CSVs normalizados
    cli.py                    # ingest, match, details, dataset, all, serve, doctor
  data/
    raw/                      # export do Letterboxd
    cache/tmdb/               # cache de respostas do TMDB
    processed/                # artefatos do dataset offline
  tests/                      # pytest
```

---

## Fluxo offline (bootstrap)

```text
Letterboxd export (zip/pasta)
        │  python -m tools.cli ingest
        ▼
data/processed/letterboxd_*.csv      (normalizado)
        │  python -m tools.cli match   (TMDB search, cache incremental)
        ▼
data/processed/matches.csv           (letterboxd_uri -> tmdb_id)
        │  python -m tools.cli details (TMDB details, cache em disco)
        ▼
data/processed/tmdb_movies.csv       (metadados por tmdb_id)
        │  python -m tools.cli dataset
        ▼
data/processed/{movies,ratings,watchlist}.csv + dataset_meta.json
        │
        ▼
app/recommender/engine.py            (implementação do usuário)
```

Em produção esse fluxo é substituído por: **Go importa → Postgres → Python lê**.

## Comandos

Execute a partir de `backend/recommendation` com o `.venv` ativo.

```powershell
# 1. Normaliza o export (pasta extraída ou .zip/.csv)
python -m tools.cli ingest --export data/raw/letterboxd

# 2. Matching incremental Letterboxd -> TMDB
#    (ratings + watched + watchlist + likes, deduplicado por URI)
python -m tools.cli match --limit 20        # amostra
python -m tools.cli match                   # todos
python -m tools.cli match --force           # ignora cache

# 3. Metadados TMDB (cache em disco)
python -m tools.cli details --limit 20
python -m tools.cli details

# 4. Dataset final
python -m tools.cli dataset
python -m tools.cli dataset --id-map data/processed/movies_id_map.csv

# Tudo de uma vez
python -m tools.cli all --export data/raw/letterboxd --limit 20

# API
python -m tools.cli serve --reload

# Diagnóstico (fonte, dataset, cache)
python -m tools.cli doctor
```

`python -m app.cli ...` continua funcionando como shim.

Testes e lint:

```powershell
python -m pytest -q
python -m ruff check app tools tests
```

---

## Identidade canônica dos filmes

- **`movies.id` (interno) é a chave canônica** para `movie_logs`,
  recomendações e qualquer referência persistida.
- **`tmdb_id` é a chave externa**, usada para falar com o TMDB e com a borda
  (Go/frontend).
- No modo Postgres, `movie_id` vem direto de `movies.id`.
- No modo CSV, `movie_id` é preenchido quando existe um mapa vindo do
  Postgres:

```csv
tmdb_id,movie_id
550,1234
27205,5678
```

Coloque em `data/processed/movies_id_map.csv` (ou passe `--id-map`). Sem o
mapa, a chave do motor é `tmdb_id` e `Dataset.key_column == "tmdb_id"`.

---

## Escala de notas

- Escala canônica: **0.5 – 5.0** (igual ao Letterboxd).
- **0** significa "assistido, mas sem nota".
- Conversão para exibição `0–10` somente em `to_display_rating()`
  (`app/core/constants.py`).

---

## API

Base: `http://localhost:8081/api/v1`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Status + contagens + fonte de dados |
| GET | `/recommendations/{user_id}?limit=20` | Recomendações (501 até o motor existir) |
| GET | `/similar/{movie_id}?id_type=internal\|tmdb&limit=20` | Filmes similares (501 até o motor existir) |
| POST | `/dataset/reload` | Recarrega a fonte de dados |

Aliases fora do prefixo: `GET /` e `GET /health`.

> O endpoint de import **não existe mais aqui**. Import é responsabilidade do
> Go core (`POST /api/v1/import/letterboxd`). O frontend deve falar com o Go,
> e o Go chama este serviço com `user_id` / `movies.id`.

`id_type=internal` é o padrão (canônico). `id_type=tmdb` existe para
desenvolvimento offline quando ainda não há mapa de IDs.

### Gateway no Go

O frontend não chama este serviço diretamente. O Go expõe:

| Método | Rota (Go) | Comportamento |
| --- | --- | --- |
| GET | `/api/v1/users/me/recommendations?limit=20` | Nome canônico; usa o UUID do JWT e chama `/recommendations/{uuid}` |
| GET | `/api/v1/recommendations?limit=20` | Alias de `/users/me/recommendations` |
| GET | `/api/v1/recommendations/{userID}?limit=20` | Chama o Python para um usuário explícito |
| GET | `/api/v1/similar/{movieID}?limit=20` | Chama `/similar/{movieID}?id_type=internal` |

As respostas do Go hidratam `movie` com os metadados do catálogo local e
repassam `id_type` para o consumidor saber a semântica de `movie_id`. O Go lê
a URL do Python em `RECOMMENDATION_SERVICE_URL` (padrão
`http://localhost:8081/api/v1`).

Toda resposta de `/recommendations` e `/similar` inclui `id_type`:

- `internal`: `movie_id` é `movies.id` (produção);
- `tmdb`: `movie_id` é o TMDB ID (CSV offline sem mapa).

---

## Formato dos artefatos CSV

`movies.csv` (uma linha por filme):

```text
tmdb_id, movie_id, title, original_title, year, release_date, runtime,
genres, keywords, countries, studios, director, cast, overview,
certification, vote_average, vote_count, popularity, budget, revenue,
poster_url, backdrop_url, original_language
```

`ratings.csv`:

```text
user_id, tmdb_id, movie_id, rating, liked, watched, rated_at, source, matched
```

- `source = letterboxd_rating` para notas do `ratings.csv`;
- `source = letterboxd_watched` para filmes assistidos sem nota (`rating = 0`);
- `liked` vem de `likes/films.csv`;
- `matched` indica se o `tmdb_id` foi resolvido.

`dataset_meta.json` registra contagens, escala de notas, se o mapa de IDs foi
usado e `engine_ready` (hoje `false`).

---

## Próximo passo: implementar o motor

Edite **`app/recommender/engine.py`**. O contrato está em
`app/recommender/base.py`:

```python
class RecommendationEngine:
    name = "meu-algoritmo"

    @property
    def is_ready(self) -> bool:
        return True

    def recommend_for_user(self, user_id, dataset, *, limit=20):
        # dataset.key_column -> "movie_id" (Postgres) ou "tmdb_id" (CSV)
        ...

    def similar_movies(self, movie_id, dataset, *, limit=20):
        ...
```

Sugestão de roteiro:

1. Filtrar `dataset.ratings` pelo usuário e juntar com `dataset.movies` por
   `dataset.key_column`.
2. Construir o perfil ponderado pelas notas 0.5–5.0 (gêneros, keywords,
   diretores, elenco, países, época).
3. Gerar candidatos (conteúdo, co-ocorrência, popularidade, watchlist).
4. Pontuar, diversificar (inclusive "niche breaker") e explicar.

Blocos de apoio já disponíveis em `app/data/features.py`:

```python
from app.data.features import build_content_features, similar_by_content

features = build_content_features(dataset.movies, key_column=dataset.key_column)
pares = similar_by_content(features, movie_id, limit=50)  # (movie_id, score)
```

`movie_keys`/`similar_by_content` usam a mesma chave de `dataset.key_column`,
então o motor não precisa saber se está em `movie_id` ou `tmdb_id`.

Enquanto `is_ready` for `False`, os endpoints retornam **501** com uma
mensagem clara. Nenhuma outra camada precisa mudar quando o motor for
implementado.

---

## Decisões de projeto

- Import e matching pertencem ao Go core; `tools/` é só bootstrap.
- A chave canônica é `movies.id`; `tmdb_id` é externo.
- Produção lê Postgres read-only; CSV é o atalho offline.
- Matching sempre em `en-US` (títulos do Letterboxd são em inglês).
- Ano do TMDB pode divergir do Letterboxd; tolerância padrão de 2 anos.
- Cache do TMDB é um JSON por requisição, com TTL configurável.
- Matching e detalhes são incrementais e podem ser interrompidos/retomados.
- Meilisearch e pgvector são busca/semântica, não import; ficam fora deste
  marco.
