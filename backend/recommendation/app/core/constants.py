"""Constantes e regras de domínio compartilhadas."""

from __future__ import annotations

RATING_MIN = 0.5
RATING_MAX = 5.0
RATING_UNRATED = 0.0

MOVIE_COLUMNS = [
    "tmdb_id",
    "movie_id",
    "title",
    "original_title",
    "year",
    "release_date",
    "runtime",
    "genres",
    "keywords",
    "countries",
    "studios",
    "director",
    "cast",
    "overview",
    "certification",
    "vote_average",
    "vote_count",
    "popularity",
    "budget",
    "revenue",
    "poster_url",
    "backdrop_url",
    "original_language",
]

RATING_COLUMNS = [
    "user_id",
    "tmdb_id",
    "movie_id",
    "rating",
    "liked",
    "watched",
    "rated_at",
    "source",
]

LETTERBOXD_RATING_COLUMNS = [
    "date",
    "name",
    "year",
    "letterboxd_uri",
    "rating",
]

LETTERBOXD_WATCHED_COLUMNS = ["date", "name", "year", "letterboxd_uri"]

LETTERBOXD_WATCHLIST_COLUMNS = ["date", "name", "year", "letterboxd_uri"]

LETTERBOXD_LIKES_COLUMNS = ["date", "name", "year", "letterboxd_uri"]

DIARY_COLUMNS = [
    "date",
    "name",
    "year",
    "letterboxd_uri",
    "rating",
    "rewatch",
    "tags",
    "watched_date",
]

REVIEW_COLUMNS = [
    "date",
    "name",
    "year",
    "letterboxd_uri",
    "rating",
    "rewatch",
    "review",
    "tags",
    "watched_date",
]


def is_valid_rating(value: float | None) -> bool:
    """Aceita 0.5–5.0 e 0 (assistido, sem nota). Rejeita o resto."""
    if value is None:
        return False
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return False
    if numeric == RATING_UNRATED:
        return True
    return RATING_MIN <= numeric <= RATING_MAX


def to_display_rating(value: float | None) -> float | None:
    """Converte a nota canônica (0.5–5.0) para a exibição (0–10)."""
    if value is None:
        return None
    numeric = float(value)
    if numeric == RATING_UNRATED:
        return None
    return round(numeric * 2, 1)


def slugify(value: str) -> str:
    """Slug simples para nomes de arquivo (sem dependências externas)."""
    import re
    import unicodedata

    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return ascii_value or "item"
