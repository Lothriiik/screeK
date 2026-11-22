"""Cliente TMDB com cache em disco e retry conservador.

O objetivo é permitir que o desenvolvimento do recomendador rode offline
depois que os metadados forem baixados uma vez. O cache é um JSON por
requisição, com timestamp, e pode ser invalidado por TTL ou por `force=True`.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Self

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

IMAGE_BASE_URL = "https://image.tmdb.org/t/p"


class TMDBError(RuntimeError):
    """Erro genérico de comunicação com o TMDB."""


class TMDBNotConfiguredError(TMDBError):
    """Token do TMDB ausente e cache miss."""


class TMDBClient:
    """Cliente síncrono com cache em disco.

    A injeção de `transport`/`client` existe para testes com `httpx.MockTransport`.
    """

    def __init__(
        self,
        token: str,
        *,
        base_url: str = "https://api.themoviedb.org/3",
        language: str = "en-US",
        cache_dir: str | Path | None = None,
        cache_ttl_days: int = 30,
        request_delay: float = 0.12,
        timeout: float = 20.0,
        client: httpx.Client | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.token = token
        self.base_url = base_url.rstrip("/")
        self.language = language
        self.cache_dir = Path(cache_dir) if cache_dir else None
        self.cache_ttl_days = cache_ttl_days
        self.request_delay = max(request_delay, 0.0)
        self.timeout = timeout

        if client is not None:
            self._client = client
        else:
            self._client = httpx.Client(
                base_url=self.base_url,
                timeout=timeout,
                transport=transport,
                headers={"Accept": "application/json"},
            )

        if self.cache_dir is not None:
            for subdir in ("movies", "search", "discover", "recommendations"):
                (self.cache_dir / subdir).mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Construtores
    # ------------------------------------------------------------------
    @classmethod
    def from_settings(cls, settings: Settings | None = None, **kwargs: Any) -> TMDBClient:
        settings = settings or get_settings()
        return cls(
            token=settings.tmdb_token,
            base_url=settings.tmdb_base_url,
            language=settings.tmdb_language,
            cache_dir=settings.tmdb_cache_dir,
            cache_ttl_days=settings.tmdb_cache_ttl_days,
            request_delay=settings.tmdb_request_delay,
            timeout=settings.tmdb_timeout_seconds,
            **kwargs,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    # ------------------------------------------------------------------
    # Cache
    # ------------------------------------------------------------------
    def _cache_path(self, category: str, key: str) -> Path | None:
        if self.cache_dir is None:
            return None
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        return self.cache_dir / category / f"{digest}.json"

    def _read_cache(self, path: Path | None, *, force: bool) -> dict[str, Any] | None:
        if force or path is None or not path.exists():
            return None
        try:
            envelope = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Cache inválido em %s: %s", path, exc)
            return None

        if self.cache_ttl_days > 0:
            fetched_at = envelope.get("fetched_at")
            if not fetched_at:
                return None
            try:
                fetched = datetime.fromisoformat(fetched_at)
            except ValueError:
                return None
            if datetime.now(UTC) - fetched > timedelta(days=self.cache_ttl_days):
                return None

        payload = envelope.get("payload")
        return payload if isinstance(payload, dict) else None

    @staticmethod
    def _write_cache(path: Path | None, payload: dict[str, Any]) -> None:
        if path is None:
            return
        envelope = {
            "fetched_at": datetime.now(UTC).isoformat(),
            "payload": payload,
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(envelope, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # HTTP
    # ------------------------------------------------------------------
    def _request(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        max_attempts: int = 3,
    ) -> dict[str, Any]:
        if not self.token:
            raise TMDBNotConfiguredError(
                "TMDB_TOKEN não configurado. Defina no .env ou use apenas o cache."
            )

        request_params = {"language": self.language, **(params or {})}
        headers = {"Authorization": f"Bearer {self.token}"}

        last_error: Exception | None = None
        for attempt in range(1, max_attempts + 1):
            if self.request_delay:
                time.sleep(self.request_delay)
            try:
                response = self._client.get(path, params=request_params, headers=headers)
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning("Falha de rede no TMDB (%s): %s", path, exc)
                time.sleep(min(2**attempt, 8))
                continue

            if response.status_code == 429 or response.status_code >= 500:
                last_error = TMDBError(f"TMDB respondeu {response.status_code} em {path}")
                logger.warning("TMDB %s; tentativa %d/%d", response.status_code, attempt, max_attempts)
                time.sleep(min(2**attempt, 8))
                continue

            if response.status_code >= 400:
                raise TMDBError(f"TMDB recusou {path}: {response.status_code} {response.text[:200]}")

            return response.json()

        raise TMDBError(f"Falha ao chamar TMDB {path}: {last_error}")

    # ------------------------------------------------------------------
    # Endpoints
    # ------------------------------------------------------------------
    def search_movies(
        self,
        query: str,
        year: int | None = None,
        *,
        language: str | None = None,
        force: bool = False,
    ) -> list[dict[str, Any]]:
        language = language or self.language
        key = f"search|{query.strip().lower()}|{year or ''}|{language}"
        path = self._cache_path("search", key)

        cached = self._read_cache(path, force=force)
        if cached is not None:
            results = cached.get("results", [])
            return results if isinstance(results, list) else []

        params: dict[str, Any] = {
            "query": query,
            "language": language,
            "include_adult": "false",
        }
        if year:
            params["primary_release_year"] = year

        payload = self._request("/search/movie", params)
        self._write_cache(path, payload)
        results = payload.get("results", [])
        return results if isinstance(results, list) else []

    def get_movie_details(
        self,
        tmdb_id: int,
        *,
        language: str | None = None,
        force: bool = False,
    ) -> dict[str, Any]:
        language = language or self.language
        key = f"movie|{tmdb_id}|{language}"
        path = self._cache_path("movies", key)

        cached = self._read_cache(path, force=force)
        if cached is not None:
            return cached

        payload = self._request(
            f"/movie/{tmdb_id}",
            {
                "language": language,
                "append_to_response": "credits,keywords,release_dates",
            },
        )
        self._write_cache(path, payload)
        return payload

    def discover_movies(
        self,
        page: int = 1,
        *,
        genre_id: int | None = None,
        year: int | None = None,
        sort_by: str = "popularity.desc",
        force: bool = False,
    ) -> list[dict[str, Any]]:
        key = f"discover|{page}|{genre_id or ''}|{year or ''}|{sort_by}|{self.language}"
        path = self._cache_path("discover", key)

        cached = self._read_cache(path, force=force)
        if cached is not None:
            results = cached.get("results", [])
            return results if isinstance(results, list) else []

        params: dict[str, Any] = {
            "page": max(page, 1),
            "sort_by": sort_by,
            "language": self.language,
        }
        if genre_id:
            params["with_genres"] = genre_id
        if year:
            params["primary_release_year"] = year

        payload = self._request("/discover/movie", params)
        self._write_cache(path, payload)
        results = payload.get("results", [])
        return results if isinstance(results, list) else []

    def get_recommendations(
        self,
        tmdb_id: int,
        *,
        force: bool = False,
    ) -> list[dict[str, Any]]:
        key = f"recommendations|{tmdb_id}|{self.language}"
        path = self._cache_path("recommendations", key)

        cached = self._read_cache(path, force=force)
        if cached is not None:
            results = cached.get("results", [])
            return results if isinstance(results, list) else []

        payload = self._request(f"/movie/{tmdb_id}/recommendations", {"language": self.language})
        self._write_cache(path, payload)
        results = payload.get("results", [])
        return results if isinstance(results, list) else []


def image_url(path: str | None, size: str = "w500") -> str:
    """Monta a URL completa de uma imagem do TMDB."""
    if not path:
        return ""
    if path.startswith("http"):
        return path
    return f"{IMAGE_BASE_URL}/{size}{path}"


def extract_certification(details: dict[str, Any]) -> str:
    """Extrai a certificação priorizando EUA, depois Brasil, depois a primeira."""
    results = details.get("release_dates", {}).get("results", [])
    if not isinstance(results, list):
        return ""

    for country_code in ("US", "BR"):
        for result in results:
            if result.get("iso_3166_1") != country_code:
                continue
            for release in result.get("release_dates", []):
                certification = str(release.get("certification", "")).strip()
                if certification:
                    return certification

    for result in results:
        for release in result.get("release_dates", []):
            certification = str(release.get("certification", "")).strip()
            if certification:
                return certification
    return ""
