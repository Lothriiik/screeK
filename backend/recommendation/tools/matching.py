"""Matching entre títulos do Letterboxd e IDs do TMDB.

Regras principais:
- buscar sempre em `en-US` (os títulos do Letterboxd são em inglês);
- tentar com o ano e, se o resultado for ruim, tentar sem ano;
- pontuar título + ano em vez de confiar no primeiro resultado;
- persistir o cache de matches para permitir reruns incrementais.
"""

from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.text import normalize_title
from tools.tmdb import TMDBClient, extract_certification, image_url

logger = logging.getLogger(__name__)

MATCH_CACHE_COLUMNS = [
    "letterboxd_uri",
    "name",
    "year",
    "tmdb_id",
    "match_score",
    "match_method",
    "matched_title",
    "matched_year",
    "matched_at",
]

MOVIE_DETAIL_COLUMNS = [
    "tmdb_id",
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


@dataclass
class MatchResult:
    tmdb_id: int
    score: int
    method: str
    title: str
    year: int | None
    letterboxd_uri: str = ""

    @property
    def confidence(self) -> float:
        return round(min(self.score / 100, 1.0), 3)


def strip_leading_article(value: str) -> str:
    return re.sub(r"^(the|a|an)\s+", "", value)


def _release_year(candidate: dict[str, Any]) -> int | None:
    release_date = str(candidate.get("release_date") or "")
    if len(release_date) >= 4 and release_date[:4].isdigit():
        return int(release_date[:4])
    return None


def _is_reliable_prefix(query: str, variant: str) -> bool:
    """Prefixos só são confiáveis com contexto suficiente.

    Evita que títulos curtos ("Raw", "300") casem com qualquer coisa que
    comece com eles ("Raw Sauce", "300 Yen").
    """
    if not query or not variant or not variant.startswith(query):
        return False
    words = query.split()
    return len(words) >= 2 or len(query) >= 14


def score_candidate(
    candidate: dict[str, Any],
    title: str,
    year: int | None,
    *,
    year_tolerance: int = 2,
) -> int:
    """Pontua um candidato do TMDB. Maior é melhor; 70 é o mínimo aceito."""
    query = normalize_title(title)
    query_no_article = strip_leading_article(query)

    candidate_title = normalize_title(candidate.get("title"))
    candidate_original = normalize_title(candidate.get("original_title"))
    candidate_variants = {
        candidate_title,
        candidate_original,
        strip_leading_article(candidate_title),
        strip_leading_article(candidate_original),
    }
    candidate_variants.discard("")

    score = 0
    if query and query in candidate_variants:
        score += 70
    elif query_no_article and query_no_article in candidate_variants:
        score += 68
    elif any(_is_reliable_prefix(query, variant) for variant in candidate_variants):
        # Letterboxd costuma encurtar subtítulos ("Glass Onion" vs
        # "Glass Onion: A Knives Out Mystery").
        score += 55
    elif any(
        _is_reliable_prefix(query_no_article, variant) for variant in candidate_variants
    ):
        score += 52
    elif query and any(query in variant for variant in candidate_variants):
        # Substring arbitrário é sinal fraco; sozinho nunca atinge 70.
        score += 20
    elif query_no_article and any(
        query_no_article in variant for variant in candidate_variants
    ):
        score += 18

    candidate_year = _release_year(candidate)
    if year and candidate_year:
        delta = abs(candidate_year - year)
        if delta == 0:
            score += 30
        elif delta == 1:
            score += 18
        elif delta <= year_tolerance:
            score += 8
        else:
            # Título igual com ano muito distante costuma ser outro filme
            # (remake, curta, making-of).
            score -= 25

    # Desempate leve por popularidade, sem deixar um blockbuster roubar um
    # match de título exato.
    popularity = float(candidate.get("popularity") or 0.0)
    if popularity > 0:
        score += min(int(popularity // 50), 5)

    return score


def pick_best_match(
    candidates: list[dict[str, Any]],
    title: str,
    year: int | None,
    *,
    min_score: int = 70,
    year_tolerance: int = 2,
) -> tuple[dict[str, Any], int] | None:
    best: dict[str, Any] | None = None
    best_score = -1

    for candidate in candidates:
        score = score_candidate(candidate, title, year, year_tolerance=year_tolerance)
        if score > best_score:
            best = candidate
            best_score = score

    if best is None or best_score < min_score:
        return None
    return best, best_score


def match_movie(
    client: TMDBClient,
    title: str,
    year: int | None,
    *,
    min_score: int = 70,
    year_tolerance: int = 2,
    letterboxd_uri: str = "",
    force: bool = False,
) -> MatchResult | None:
    """Resolve um filme do Letterboxd em um TMDB ID."""
    candidates = client.search_movies(title, year, language="en-US", force=force)
    method = "search_with_year" if year else "search"

    picked = pick_best_match(
        candidates,
        title,
        year,
        min_score=min_score,
        year_tolerance=year_tolerance,
    )

    # A busca com ano pode devolver só resultados ruins (o ano do Letterboxd
    # costuma ser o de festival, enquanto o TMDB usa a estreia comercial).
    # Nesse caso vale tentar de novo sem o filtro de ano.
    if picked is None and year:
        candidates = client.search_movies(title, None, language="en-US", force=force)
        method = "search_without_year"
        picked = pick_best_match(
            candidates,
            title,
            year,
            min_score=min_score,
            year_tolerance=year_tolerance,
        )

    if picked is None:
        return None

    candidate, score = picked
    return MatchResult(
        tmdb_id=int(candidate["id"]),
        score=score,
        method=method,
        title=str(candidate.get("title") or title),
        year=_release_year(candidate),
        letterboxd_uri=letterboxd_uri,
    )


def _cache_key(row: pd.Series) -> str:
    uri = str(row.get("letterboxd_uri") or "").strip()
    if uri and uri.lower() != "nan":
        return uri
    return f"{normalize_title(str(row.get('name') or ''))}|{row.get('year') or ''}"


def load_match_cache(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        return pd.DataFrame(columns=MATCH_CACHE_COLUMNS)
    frame = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    for column in MATCH_CACHE_COLUMNS:
        if column not in frame.columns:
            frame[column] = ""
    return frame[MATCH_CACHE_COLUMNS]


def save_match_cache(frame: pd.DataFrame, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False, encoding="utf-8")


def match_ratings(
    client: TMDBClient,
    ratings: pd.DataFrame,
    cache_path: str | Path,
    *,
    limit: int = 0,
    force: bool = False,
    min_score: int = 70,
    year_tolerance: int = 2,
    flush_every: int = 25,
) -> pd.DataFrame:
    """Faz matching incremental de ratings e persiste o cache."""
    cache = load_match_cache(cache_path)
    cache_by_key = {_cache_key(row): row for _, row in cache.iterrows()}

    rows = ratings.head(limit) if limit and limit > 0 else ratings
    total = len(rows)
    processed = 0

    for _, row in rows.iterrows():
        key = _cache_key(row)
        if key in cache_by_key and not force:
            continue

        title = str(row.get("name") or "").strip()
        year_value = row.get("year")
        year = (
            int(year_value)
            if pd.notna(year_value) and str(year_value) not in ("", "<NA>")
            else None
        )

        result = match_movie(
            client,
            title,
            year,
            min_score=min_score,
            year_tolerance=year_tolerance,
            letterboxd_uri=str(row.get("letterboxd_uri") or ""),
            force=force,
        )

        processed += 1
        if result is None:
            logger.warning("Sem match para %s (%s)", title, year)
            cache_by_key[key] = pd.Series(
                {
                    "letterboxd_uri": str(row.get("letterboxd_uri") or ""),
                    "name": title,
                    "year": year or "",
                    "tmdb_id": "",
                    "match_score": "0",
                    "match_method": "unmatched",
                    "matched_title": "",
                    "matched_year": "",
                    "matched_at": datetime.now(UTC).isoformat(),
                }
            )
        else:
            cache_by_key[key] = pd.Series(
                {
                    "letterboxd_uri": result.letterboxd_uri,
                    "name": title,
                    "year": year or "",
                    "tmdb_id": result.tmdb_id,
                    "match_score": result.score,
                    "match_method": result.method,
                    "matched_title": result.title,
                    "matched_year": result.year or "",
                    "matched_at": datetime.now(UTC).isoformat(),
                }
            )

        if processed % max(flush_every, 1) == 0:
            logger.info("Matching: %d/%d processados", processed, total)
            save_match_cache(pd.DataFrame(cache_by_key.values()), cache_path)

    result_frame = pd.DataFrame(cache_by_key.values())
    for column in MATCH_CACHE_COLUMNS:
        if column not in result_frame.columns:
            result_frame[column] = ""
    result_frame = result_frame[MATCH_CACHE_COLUMNS]
    save_match_cache(result_frame, cache_path)
    return result_frame


def _join_names(items: Any, limit: int | None = None) -> str:
    if not isinstance(items, list):
        return ""
    names = [str(item.get("name", "")).strip() for item in items if isinstance(item, dict)]
    names = [name for name in names if name]
    if limit:
        names = names[:limit]
    return "|".join(names)


def flatten_movie_details(details: dict[str, Any]) -> dict[str, Any]:
    """Transforma o JSON detalhado do TMDB em uma linha tabular."""
    credits = details.get("credits", {}) if isinstance(details.get("credits"), dict) else {}
    crew = credits.get("crew", []) if isinstance(credits.get("crew"), list) else []
    cast = credits.get("cast", []) if isinstance(credits.get("cast"), list) else []

    directors = [
        str(member.get("name", "")).strip()
        for member in crew
        if isinstance(member, dict) and member.get("job") == "Director"
    ]

    release_date = str(details.get("release_date") or "")
    year = (
        int(release_date[:4])
        if len(release_date) >= 4 and release_date[:4].isdigit()
        else None
    )

    keywords = details.get("keywords", {}).get("keywords", [])
    countries = details.get("production_countries", [])
    companies = details.get("production_companies", [])

    return {
        "tmdb_id": int(details.get("id") or 0),
        "title": str(details.get("title") or ""),
        "original_title": str(details.get("original_title") or ""),
        "year": year or "",
        "release_date": release_date,
        "runtime": details.get("runtime") or 0,
        "genres": _join_names(details.get("genres", [])),
        "keywords": _join_names(keywords),
        "countries": _join_names(countries),
        "studios": _join_names(companies),
        "director": "|".join(name for name in directors if name),
        "cast": _join_names(cast, limit=12),
        "overview": str(details.get("overview") or ""),
        "certification": extract_certification(details),
        "vote_average": details.get("vote_average") or 0,
        "vote_count": details.get("vote_count") or 0,
        "popularity": details.get("popularity") or 0,
        "budget": details.get("budget") or 0,
        "revenue": details.get("revenue") or 0,
        "poster_url": image_url(details.get("poster_path"), "w500"),
        "backdrop_url": image_url(details.get("backdrop_path"), "original"),
        "original_language": str(details.get("original_language") or ""),
    }


def fetch_movie_details(
    client: TMDBClient,
    matches: pd.DataFrame,
    cache_path: str | Path,
    *,
    limit: int = 0,
    force: bool = False,
) -> pd.DataFrame:
    """Baixa detalhes dos filmes casados e mantém um cache incremental."""
    cache_path = Path(cache_path)
    if cache_path.exists():
        cached = pd.read_csv(cache_path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    else:
        cached = pd.DataFrame(columns=MOVIE_DETAIL_COLUMNS)

    known_ids = set()
    if not cached.empty and "tmdb_id" in cached.columns:
        known_ids = {
            int(value)
            for value in pd.to_numeric(cached["tmdb_id"], errors="coerce").dropna().astype(int)
        }

    valid_matches = matches[matches["tmdb_id"].astype(str).str.strip() != ""]
    tmdb_ids = pd.to_numeric(valid_matches["tmdb_id"], errors="coerce").dropna().astype(int)
    unique_ids = list(dict.fromkeys(tmdb_ids.tolist()))

    if limit and limit > 0:
        unique_ids = unique_ids[:limit]

    rows: list[dict[str, Any]] = cached.to_dict("records")
    for index, tmdb_id in enumerate(unique_ids, start=1):
        if tmdb_id in known_ids and not force:
            continue
        try:
            details = client.get_movie_details(tmdb_id, force=force)
        except Exception as exc:  # noqa: BLE001 - uma falha não deve parar o lote
            logger.warning("Falha ao buscar detalhes de %s: %s", tmdb_id, exc)
            continue

        row = flatten_movie_details(details)
        rows = [existing for existing in rows if int(existing.get("tmdb_id") or 0) != tmdb_id]
        rows.append(row)
        logger.info("Detalhes: %d/%d (tmdb_id=%s)", index, len(unique_ids), tmdb_id)

        if index % 25 == 0:
            _save_movie_rows(rows, cache_path)

    _save_movie_rows(rows, cache_path)
    return pd.DataFrame(rows, columns=MOVIE_DETAIL_COLUMNS)


def _save_movie_rows(rows: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows, columns=MOVIE_DETAIL_COLUMNS).to_csv(path, index=False, encoding="utf-8")


def summarize_matches(matches: pd.DataFrame) -> dict[str, int]:
    """Contagens para relatório/log."""
    if matches.empty:
        return {"total": 0, "matched": 0, "unmatched": 0}
    matched = int((matches["match_method"] != "unmatched").sum())
    return {
        "total": len(matches),
        "matched": matched,
        "unmatched": len(matches) - matched,
    }


def match_result_to_dict(result: MatchResult) -> dict[str, Any]:
    return asdict(result)
