"""Fonte de dados canônica do recomendador.

O motor nunca fala com CSV ou Postgres diretamente: ele recebe um `Dataset`.
Quem monta o `Dataset` é uma implementação de `MovieDataSource`.

- `PostgresDataSource`: produção. Lê as tabelas canônicas do Go core e usa
  `movies.id` como chave.
- `CsvDataSource`: desenvolvimento/testes. Lê os artefatos gerados por
  `tools/cli.py` (bootstrap offline, sem Docker).
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

import pandas as pd

from app.config import Settings
from app.core.constants import MOVIE_COLUMNS, RATING_COLUMNS, RATING_MAX, RATING_MIN, RATING_UNRATED
from app.data.dataset import Dataset, load_dataset as load_csv_dataset

logger = logging.getLogger(__name__)

RATING_SCALE_META = {
    "min": RATING_MIN,
    "max": RATING_MAX,
    "unrated": RATING_UNRATED,
    "display_multiplier": 2,
}


class DataSourceError(RuntimeError):
    """Erro de configuração ou leitura da fonte de dados."""


class MovieDataSource(Protocol):
    """Contrato de uma fonte de dados do recomendador."""

    name: str

    def load(self) -> Dataset:
        """Carrega filmes, histórico e watchlist em um `Dataset`."""
        ...


class CsvDataSource:
    """Fonte offline: lê `data/processed/*.csv` gerados pelo bootstrap."""

    name = "csv"

    def __init__(self, processed_dir: str | Path) -> None:
        self.processed_dir = Path(processed_dir)

    def load(self) -> Dataset:
        dataset = load_csv_dataset(self.processed_dir)
        meta = dict(dataset.meta)
        meta.setdefault("source", self.name)
        return Dataset(
            movies=dataset.movies,
            ratings=dataset.ratings,
            watchlist=dataset.watchlist,
            meta=meta,
        )

    def load_user_feedback(self, user_id: str) -> dict[int, str]:
        return {}


class PostgresDataSource:
    """Fonte de produção: lê as tabelas canônicas do Go core (read-only).

    O schema é criado pelo GORM (`AutoMigrate`), então os nomes reais podem
    variar. Detectamos `movie_logs` vs `movie_log_records` e
    `watchlists` vs `watchlist_item_records` em tempo de execução.
    """

    name = "postgres"

    def __init__(self, database_url: str, *, connect_timeout: int = 10) -> None:
        if not database_url:
            raise DataSourceError("DATABASE_URL não configurada para a fonte postgres.")
        self.database_url = database_url
        self.connect_timeout = connect_timeout

    def load(self) -> Dataset:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:  # pragma: no cover - depende do ambiente
            raise DataSourceError(
                "psycopg não instalado. Rode: uv pip install 'psycopg[binary]'"
            ) from exc

        with psycopg.connect(
            self.database_url,
            row_factory=dict_row,
            connect_timeout=self.connect_timeout,
        ) as conn:
            movie_logs = _first_existing_table(conn, ("movie_logs", "movie_log_records"))
            watchlists = _first_existing_table(
                conn, ("watchlists", "watchlist_item_records")
            )

            movies = _frame(conn.execute(_MOVIES_SQL), MOVIE_COLUMNS)
            ratings = _frame(conn.execute(_ratings_sql(movie_logs)), RATING_COLUMNS)
            watchlist = _frame(conn.execute(_watchlist_sql(watchlists)), _WATCHLIST_COLUMNS)

        meta: dict[str, Any] = {
            "built_at": datetime.now(UTC).isoformat(),
            "source": self.name,
            "rating_scale": RATING_SCALE_META,
            "tables": {"movie_logs": movie_logs, "watchlists": watchlists},
            "counts": {
                "movies": len(movies),
                "ratings": len(ratings),
                "ratings_matched": int(ratings["movie_id"].notna().sum()) if not ratings.empty else 0,
                "watchlist": len(watchlist),
                "watchlist_matched": int(watchlist["movie_id"].notna().sum()) if not watchlist.empty else 0,
            },
            "engine_ready": False,
        }
        return Dataset(movies=movies, ratings=ratings, watchlist=watchlist, meta=meta)

    def load_user_feedback(self, user_id: str) -> dict[int, str]:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:  # pragma: no cover
            raise DataSourceError("psycopg não instalado") from exc
        with psycopg.connect(
            self.database_url,
            row_factory=dict_row,
            connect_timeout=self.connect_timeout,
        ) as conn:
            reg = conn.execute(
                "SELECT to_regclass('recommendation_feedbacks') AS reg"
            ).fetchone()
            if not reg or not reg.get("reg"):
                return {}
            rows = conn.execute(
                "SELECT movie_id, feedback FROM recommendation_feedbacks WHERE user_id::text = %s",
                (user_id,),
            ).fetchall()
        return {int(row["movie_id"]): str(row["feedback"]) for row in rows}


def get_data_source(settings: Settings) -> MovieDataSource:
    """Escolhe a fonte conforme `DATA_SOURCE` (csv por padrão)."""
    source = (settings.data_source or "csv").strip().lower()
    if source == "postgres":
        return PostgresDataSource(
            settings.database_url,
            connect_timeout=settings.db_connect_timeout_seconds,
        )
    if source != "csv":
        raise DataSourceError(f"DATA_SOURCE desconhecida: {settings.data_source!r}")
    return CsvDataSource(settings.processed_dir)


def _first_existing_table(conn: Any, candidates: tuple[str, ...]) -> str:
    for table in candidates:
        row = conn.execute("SELECT to_regclass(%s) AS reg", (table,)).fetchone()
        if row and row.get("reg"):
            return table
    return candidates[-1]


def _frame(cursor: Any, columns: list[str]) -> pd.DataFrame:
    rows = cursor.fetchall()
    if not rows:
        return pd.DataFrame(columns=columns)
    frame = pd.DataFrame(rows)
    for column in columns:
        if column not in frame.columns:
            frame[column] = None
    return frame[columns]


_MOVIES_SQL = """
SELECT
    m.id AS movie_id,
    m.tmdb_id,
    m.title,
    COALESCE(m.original_title, '') AS original_title,
    CASE
        WHEN m.release_date IS NULL OR m.release_date < DATE '1800-01-01' THEN NULL
        ELSE EXTRACT(YEAR FROM m.release_date)::int
    END AS year,
    CASE
        WHEN m.release_date IS NULL OR m.release_date < DATE '1800-01-01' THEN ''
        ELSE to_char(m.release_date, 'YYYY-MM-DD')
    END AS release_date,
    COALESCE(m.runtime, 0) AS runtime,
    COALESCE((
        SELECT string_agg(g.name, '|' ORDER BY g.name)
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
    ), '') AS genres,
    COALESCE(m.keywords, '') AS keywords,
    COALESCE(m.countries, '') AS countries,
    COALESCE(m.studios, '') AS studios,
    COALESCE((
        SELECT string_agg(p.name, '|' ORDER BY p.name)
        FROM movie_credits mc
        JOIN people p ON p.id = mc.person_id
        WHERE mc.movie_id = m.id AND mc.role = 'Director'
    ), '') AS director,
    COALESCE((
        SELECT string_agg(p.name, '|' ORDER BY p.name)
        FROM movie_credits mc
        JOIN people p ON p.id = mc.person_id
        WHERE mc.movie_id = m.id AND mc.role = 'Actor'
    ), '') AS cast,
    COALESCE(m.overview, '') AS overview,
    COALESCE(m.certification, '') AS certification,
    COALESCE(m.vote_average, 0) AS vote_average,
    COALESCE(m.vote_count, 0) AS vote_count,
    COALESCE(m.popularity, 0) AS popularity,
    COALESCE(m.budget, 0) AS budget,
    COALESCE(m.revenue, 0) AS revenue,
    COALESCE(m.poster_url, '') AS poster_url,
    COALESCE(m.backdrop_url, '') AS backdrop_url,
    COALESCE(m.original_language, '') AS original_language
FROM movies m
"""


def _ratings_sql(movie_logs_table: str) -> str:
    return f"""
SELECT
    ml.user_id::text AS user_id,
    ml.movie_id,
    m.tmdb_id,
    ml.rating,
    ml.liked,
    ml.watched,
    ml.updated_at AS rated_at,
    'postgres' AS source
FROM {movie_logs_table} ml
JOIN movies m ON m.id = ml.movie_id
"""


_WATCHLIST_COLUMNS = [
    "user_id",
    "tmdb_id",
    "movie_id",
    "name",
    "year",
    "added_at",
    "matched",
]


def _watchlist_sql(watchlist_table: str) -> str:
    return f"""
SELECT
    w.user_id::text AS user_id,
    w.movie_id,
    m.tmdb_id,
    m.title AS name,
    CASE
        WHEN m.release_date IS NULL OR m.release_date < DATE '1800-01-01' THEN NULL
        ELSE EXTRACT(YEAR FROM m.release_date)::int
    END AS year,
    w.added_at,
    TRUE AS matched
FROM {watchlist_table} w
JOIN movies m ON m.id = w.movie_id
"""
