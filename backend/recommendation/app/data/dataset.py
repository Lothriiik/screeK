"""Construção e carregamento do dataset consumido pelo recomendador.

Artefatos gerados em `data/processed/`:
- `movies.csv`: metadados por filme (tmdb_id + movie_id interno opcional);
- `ratings.csv`: histórico do usuário na escala 0.5–5.0;
- `watchlist.csv`: filmes que o usuário quer assistir;
- `dataset_meta.json`: contagens, escala e proveniência.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.constants import MOVIE_COLUMNS, RATING_COLUMNS, RATING_MAX, RATING_MIN, RATING_UNRATED
from app.core.text import normalize_title

logger = logging.getLogger(__name__)

RATING_SCALE_META = {
    "min": RATING_MIN,
    "max": RATING_MAX,
    "unrated": RATING_UNRATED,
    "display_multiplier": 2,
    "source": "letterboxd",
}


@dataclass
class Dataset:
    movies: pd.DataFrame = field(default_factory=lambda: pd.DataFrame(columns=MOVIE_COLUMNS))
    ratings: pd.DataFrame = field(default_factory=lambda: pd.DataFrame(columns=RATING_COLUMNS))
    watchlist: pd.DataFrame = field(default_factory=pd.DataFrame)
    meta: dict[str, Any] = field(default_factory=dict)

    @property
    def loaded(self) -> bool:
        return not self.movies.empty or not self.ratings.empty

    @property
    def user_ids(self) -> list[str]:
        users: set[str] = set()
        if not self.ratings.empty and "user_id" in self.ratings.columns:
            users.update(str(value) for value in self.ratings["user_id"].dropna().unique())
        if not self.watchlist.empty and "user_id" in self.watchlist.columns:
            users.update(str(value) for value in self.watchlist["user_id"].dropna().unique())
        return sorted(users)

    @property
    def key_column(self) -> str:
        """Coluna que identifica um filme no Dataset.

        Preferimos `movie_id` (movies.id canônico). No modo CSV sem mapa de
        IDs, caímos para `tmdb_id` para não travar o desenvolvimento.
        """
        if "movie_id" in self.movies.columns and self.movies["movie_id"].notna().any():
            return "movie_id"
        return "tmdb_id"

    @property
    def id_type(self) -> str:
        """Semântica pública da chave canônica: `internal` ou `tmdb`."""
        return "internal" if self.key_column == "movie_id" else "tmdb"

    @property
    def movie_keys(self) -> set[int]:
        """Conjunto de chaves canônicas presentes no catálogo."""
        column = self.key_column
        if self.movies.empty or column not in self.movies.columns:
            return set()
        return set(pd.to_numeric(self.movies[column], errors="coerce").dropna().astype(int))

    def find_movie(self, value: int, *, id_type: str = "internal") -> pd.Series | None:
        """Localiza um filme por ID interno ou TMDB, tolerando CSV sem mapa."""
        if self.movies.empty:
            return None

        column = "tmdb_id" if id_type == "tmdb" else self.key_column
        if column not in self.movies.columns:
            return None

        numeric = pd.to_numeric(self.movies[column], errors="coerce")
        match = self.movies[numeric == value]
        if match.empty and id_type == "internal" and "tmdb_id" in self.movies.columns:
            # Fallback explícito: CSV offline sem movies_id_map.csv.
            fallback = pd.to_numeric(self.movies["tmdb_id"], errors="coerce")
            match = self.movies[fallback == value]
        if match.empty:
            return None
        return match.iloc[0]

    @property
    def engine_ready(self) -> bool:
        return bool(self.meta.get("engine_ready", False))


def _read_csv(path: Path, columns: list[str] | None = None) -> pd.DataFrame:
    if not path.exists():
        logger.warning("Arquivo não encontrado: %s", path)
        return pd.DataFrame(columns=columns or [])
    frame = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    if columns:
        for column in columns:
            if column not in frame.columns:
                frame[column] = ""
        frame = frame[columns]
    return frame


def _key_series(frame: pd.DataFrame, column: str) -> pd.Series:
    if column not in frame.columns:
        return pd.Series([""] * len(frame), index=frame.index, dtype="object")
    return frame[column].fillna("").astype(str).str.strip()


def _year_series(frame: pd.DataFrame) -> pd.Series:
    if "year" not in frame.columns:
        return pd.Series([pd.NA] * len(frame), index=frame.index, dtype="Int64")
    return pd.to_numeric(frame["year"].replace("", pd.NA), errors="coerce").astype("Int64")


def _build_match_lookups(matches: pd.DataFrame) -> tuple[dict[str, int], dict[tuple[str, int], int], dict[str, int]]:
    """Cria índices por URI, (nome, ano) e nome único."""
    uri_to_tmdb: dict[str, int] = {}
    name_year_to_tmdb: dict[tuple[str, int], int] = {}
    name_to_ids: dict[str, set[int]] = {}

    if matches.empty:
        return uri_to_tmdb, name_year_to_tmdb, {}

    for _, row in matches.iterrows():
        raw_tmdb = str(row.get("tmdb_id") or "").strip()
        if not raw_tmdb:
            continue
        try:
            tmdb_id = int(float(raw_tmdb))
        except ValueError:
            continue

        uri = str(row.get("letterboxd_uri") or "").strip()
        if uri:
            uri_to_tmdb[uri] = tmdb_id

        name_key = normalize_title(str(row.get("name") or ""))
        year_value = row.get("year")
        try:
            year = int(float(year_value)) if str(year_value).strip() not in ("", "nan", "<NA>") else None
        except ValueError:
            year = None
        if name_key and year is not None:
            name_year_to_tmdb[(name_key, year)] = tmdb_id
        if name_key:
            name_to_ids.setdefault(name_key, set()).add(tmdb_id)

    unique_name_to_tmdb = {
        name: next(iter(ids)) for name, ids in name_to_ids.items() if len(ids) == 1
    }
    return uri_to_tmdb, name_year_to_tmdb, unique_name_to_tmdb


def _resolve_tmdb_ids(
    frame: pd.DataFrame,
    uri_to_tmdb: dict[str, int],
    name_year_to_tmdb: dict[tuple[str, int], int],
    name_to_tmdb: dict[str, int],
) -> pd.Series:
    if frame.empty:
        return pd.Series([], dtype="Int64")

    resolved: list[int | None] = []
    names = frame["name"] if "name" in frame.columns else pd.Series([""] * len(frame), index=frame.index)
    years = _year_series(frame)
    uris = _key_series(frame, "letterboxd_uri")

    for index, uri in uris.items():
        tmdb_id = uri_to_tmdb.get(uri)
        if tmdb_id is None:
            name_key = normalize_title(str(names.loc[index]))
            year_value = years.loc[index]
            year = int(year_value) if pd.notna(year_value) else None
            if year is not None:
                tmdb_id = name_year_to_tmdb.get((name_key, year))
            if tmdb_id is None:
                tmdb_id = name_to_tmdb.get(name_key)
        resolved.append(tmdb_id)

    return pd.Series(resolved, index=frame.index, dtype="Int64")


def _load_id_map(processed_dir: Path, id_map_path: str | Path | None) -> pd.DataFrame:
    candidates = []
    if id_map_path:
        candidates.append(Path(id_map_path))
    candidates.extend(
        [
            processed_dir / "movies_id_map.csv",
            processed_dir.parent / "raw" / "movies_id_map.csv",
        ]
    )

    for path in candidates:
        if not path.exists():
            continue
        frame = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
        columns = {column.lower(): column for column in frame.columns}
        tmdb_column = columns.get("tmdb_id") or columns.get("tmdbid")
        id_column = columns.get("movie_id") or columns.get("id")
        if not tmdb_column or not id_column:
            logger.warning("Mapa de IDs ignorado (colunas tmdb_id/movie_id ausentes): %s", path)
            continue
        normalized = pd.DataFrame(
            {
                "tmdb_id": pd.to_numeric(frame[tmdb_column], errors="coerce").astype("Int64"),
                "movie_id": pd.to_numeric(frame[id_column], errors="coerce").astype("Int64"),
            }
        ).dropna(subset=["tmdb_id"])
        logger.info("Mapa de IDs carregado de %s (%d linhas)", path, len(normalized))
        return normalized.drop_duplicates(subset=["tmdb_id"], keep="last")

    return pd.DataFrame(columns=["tmdb_id", "movie_id"])


def _attach_internal_ids(movies: pd.DataFrame, id_map: pd.DataFrame) -> pd.DataFrame:
    movies = movies.copy()
    movies["tmdb_id"] = pd.to_numeric(movies["tmdb_id"], errors="coerce").astype("Int64")
    if id_map.empty:
        movies["movie_id"] = pd.Series([pd.NA] * len(movies), dtype="Int64")
        return movies

    movies = movies.drop(columns=["movie_id"], errors="ignore").merge(
        id_map, on="tmdb_id", how="left"
    )
    return movies


def _build_movies(processed_dir: Path, id_map: pd.DataFrame) -> pd.DataFrame:
    movies = _read_csv(processed_dir / "tmdb_movies.csv")
    if movies.empty:
        matches = _read_csv(processed_dir / "matches.csv")
        if not matches.empty:
            matched = matches[matches["tmdb_id"].astype(str).str.strip() != ""]
            movies = pd.DataFrame(
                {
                    "tmdb_id": matched["tmdb_id"],
                    "title": matched.get("matched_title", matched.get("name", "")),
                    "year": matched.get("matched_year", matched.get("year", "")),
                }
            )
        else:
            return pd.DataFrame(columns=MOVIE_COLUMNS)

    for column in MOVIE_COLUMNS:
        if column not in movies.columns:
            movies[column] = ""
    movies = _attach_internal_ids(movies, id_map)
    movies = movies.drop_duplicates(subset=["tmdb_id"], keep="last")
    return movies[MOVIE_COLUMNS].reset_index(drop=True)


def _build_ratings(
    processed_dir: Path,
    movies: pd.DataFrame,
    *,
    user_id: str,
    uri_to_tmdb: dict[str, int],
    name_year_to_tmdb: dict[tuple[str, int], int],
    name_to_tmdb: dict[str, int],
) -> pd.DataFrame:
    ratings = _read_csv(processed_dir / "letterboxd_ratings.csv")
    watched = _read_csv(processed_dir / "letterboxd_watched.csv")
    likes = _read_csv(processed_dir / "letterboxd_likes.csv")

    liked_uris = set(_key_series(likes, "letterboxd_uri"))
    rated_uris = set(_key_series(ratings, "letterboxd_uri"))

    frames: list[pd.DataFrame] = []

    if not ratings.empty:
        rated = ratings.copy()
        rated["rating"] = pd.to_numeric(rated["rating"], errors="coerce")
        rated["watched"] = True
        rated["liked"] = _key_series(rated, "letterboxd_uri").isin(liked_uris)
        rated["rated_at"] = _key_series(rated, "date")
        rated["source"] = "letterboxd_rating"
        frames.append(rated)

    if not watched.empty:
        unrated = watched[~_key_series(watched, "letterboxd_uri").isin(rated_uris)].copy()
        if not unrated.empty:
            unrated["rating"] = RATING_UNRATED
            unrated["watched"] = True
            unrated["liked"] = _key_series(unrated, "letterboxd_uri").isin(liked_uris)
            unrated["rated_at"] = _key_series(unrated, "date")
            unrated["source"] = "letterboxd_watched"
            frames.append(unrated)

    if not frames:
        return pd.DataFrame(columns=RATING_COLUMNS + ["matched"])

    combined = pd.concat(frames, ignore_index=True)
    combined["tmdb_id"] = _resolve_tmdb_ids(
        combined, uri_to_tmdb, name_year_to_tmdb, name_to_tmdb
    )
    combined["user_id"] = user_id
    combined["matched"] = combined["tmdb_id"].notna()

    movie_ids = movies.set_index("tmdb_id")["movie_id"] if not movies.empty else pd.Series(dtype="Int64")
    combined["movie_id"] = combined["tmdb_id"].map(movie_ids).astype("Int64")

    combined = combined.drop_duplicates(subset=["user_id", "letterboxd_uri"], keep="last")
    return combined[RATING_COLUMNS + ["matched"]].reset_index(drop=True)


def _build_watchlist(
    processed_dir: Path,
    movies: pd.DataFrame,
    *,
    user_id: str,
    uri_to_tmdb: dict[str, int],
    name_year_to_tmdb: dict[tuple[str, int], int],
    name_to_tmdb: dict[str, int],
) -> pd.DataFrame:
    watchlist = _read_csv(processed_dir / "letterboxd_watchlist.csv")
    if watchlist.empty:
        return pd.DataFrame(columns=["user_id", "tmdb_id", "movie_id", "name", "year", "added_at", "matched"])

    watchlist = watchlist.copy()
    watchlist["tmdb_id"] = _resolve_tmdb_ids(
        watchlist, uri_to_tmdb, name_year_to_tmdb, name_to_tmdb
    )
    watchlist["user_id"] = user_id
    watchlist["added_at"] = _key_series(watchlist, "date")
    watchlist["matched"] = watchlist["tmdb_id"].notna()

    movie_ids = movies.set_index("tmdb_id")["movie_id"] if not movies.empty else pd.Series(dtype="Int64")
    watchlist["movie_id"] = watchlist["tmdb_id"].map(movie_ids).astype("Int64")

    watchlist = watchlist.drop_duplicates(subset=["user_id", "letterboxd_uri"], keep="last")
    return watchlist[
        ["user_id", "tmdb_id", "movie_id", "name", "year", "added_at", "matched"]
    ].reset_index(drop=True)


def infer_processed_user_id(processed_dir: str | Path, fallback: str = "local") -> str:
    """Lê o username de `letterboxd_profile.csv` gerado no ingest."""
    profile_path = Path(processed_dir) / "letterboxd_profile.csv"
    if not profile_path.exists():
        return fallback

    profile = _read_csv(profile_path)
    if profile.empty:
        return fallback

    for column in ("username", "Username"):
        if column in profile.columns:
            value = str(profile.iloc[0][column]).strip()
            if value and value.lower() != "nan":
                return value
    return fallback


def build_dataset(
    processed_dir: str | Path,
    *,
    user_id: str | None = None,
    id_map_path: str | Path | None = None,
) -> Dataset:
    """Monta os artefatos finais a partir dos CSVs intermediários.

    Quando `user_id` não é informado, tenta o username do `profile.csv`.
    """
    processed_dir = Path(processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    user_id = user_id or infer_processed_user_id(processed_dir)

    id_map = _load_id_map(processed_dir, id_map_path)
    movies = _build_movies(processed_dir, id_map)
    matches = _read_csv(processed_dir / "matches.csv")
    uri_to_tmdb, name_year_to_tmdb, name_to_tmdb = _build_match_lookups(matches)

    ratings = _build_ratings(
        processed_dir,
        movies,
        user_id=user_id,
        uri_to_tmdb=uri_to_tmdb,
        name_year_to_tmdb=name_year_to_tmdb,
        name_to_tmdb=name_to_tmdb,
    )
    watchlist = _build_watchlist(
        processed_dir,
        movies,
        user_id=user_id,
        uri_to_tmdb=uri_to_tmdb,
        name_year_to_tmdb=name_year_to_tmdb,
        name_to_tmdb=name_to_tmdb,
    )

    movies.to_csv(processed_dir / "movies.csv", index=False, encoding="utf-8")
    ratings.to_csv(processed_dir / "ratings.csv", index=False, encoding="utf-8")
    watchlist.to_csv(processed_dir / "watchlist.csv", index=False, encoding="utf-8")

    matched_ratings = int(ratings["matched"].sum()) if "matched" in ratings.columns else 0
    meta: dict[str, Any] = {
        "built_at": datetime.now(UTC).isoformat(),
        "user_id": user_id,
        "rating_scale": RATING_SCALE_META,
        "counts": {
            "movies": len(movies),
            "ratings": len(ratings),
            "ratings_matched": matched_ratings,
            "ratings_unmatched": len(ratings) - matched_ratings,
            "watchlist": len(watchlist),
            "watchlist_matched": int(watchlist["matched"].sum()) if "matched" in watchlist.columns else 0,
        },
        "id_map_used": not id_map.empty,
        "files": {
            "movies": "movies.csv",
            "ratings": "ratings.csv",
            "watchlist": "watchlist.csv",
        },
        "engine_ready": False,
    }
    (processed_dir / "dataset_meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return Dataset(movies=movies, ratings=ratings, watchlist=watchlist, meta=meta)


def load_dataset(processed_dir: str | Path) -> Dataset:
    """Carrega os artefatos finais, tolerando ausência (dataset vazio)."""
    processed_dir = Path(processed_dir)
    meta_path = processed_dir / "dataset_meta.json"
    meta: dict[str, Any] = {}
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            logger.warning("dataset_meta.json inválido: %s", meta_path)

    movies = _read_csv(processed_dir / "movies.csv", MOVIE_COLUMNS)
    ratings = _read_csv(processed_dir / "ratings.csv", RATING_COLUMNS + ["matched"])
    watchlist = _read_csv(processed_dir / "watchlist.csv")

    if not movies.empty:
        movies["tmdb_id"] = pd.to_numeric(movies["tmdb_id"], errors="coerce").astype("Int64")
        movies["movie_id"] = pd.to_numeric(movies["movie_id"], errors="coerce").astype("Int64")
    if not ratings.empty:
        ratings["tmdb_id"] = pd.to_numeric(ratings["tmdb_id"], errors="coerce").astype("Int64")
        ratings["movie_id"] = pd.to_numeric(ratings["movie_id"], errors="coerce").astype("Int64")
        ratings["rating"] = pd.to_numeric(ratings["rating"], errors="coerce")

    return Dataset(movies=movies, ratings=ratings, watchlist=watchlist, meta=meta)
