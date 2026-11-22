"""Casos de uso do serviço de recomendação (sem dependência de HTTP)."""

from __future__ import annotations

import logging

import pandas as pd

from app.config import Settings, get_settings
from app.data.dataset import Dataset
from app.data.source import MovieDataSource, get_data_source
from app.recommender.base import Recommendation, Recommender
from app.recommender.engine import EngineNotImplementedError, RecommendationEngine

logger = logging.getLogger(__name__)


class UserNotFoundError(LookupError):
    """Usuário sem histórico no dataset."""


class MovieNotFoundError(LookupError):
    """Filme de referência ausente do dataset."""


class RecommendationService:
    """Orquestra fonte de dados + motor de recomendação."""

    def __init__(
        self,
        settings: Settings | None = None,
        engine: Recommender | None = None,
        source: MovieDataSource | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.engine: Recommender = engine or RecommendationEngine()
        self.source: MovieDataSource = source or get_data_source(self.settings)
        self._dataset: Dataset = self.source.load()

    @property
    def dataset(self) -> Dataset:
        return self._dataset

    def ensure_ready(self) -> None:
        """Falha cedo quando o motor ainda não foi implementado."""
        if not self.engine.is_ready:
            raise EngineNotImplementedError(
                "O motor de recomendação ainda não está pronto. "
                "Implemente app/recommender/engine.py."
            )

    def warm_up(self) -> None:
        """Constrói uma vez a matriz compartilhada antes de receber tráfego."""
        if hasattr(self.engine, "warm_up"):
            self.engine.warm_up(self._dataset)

    def reload(self) -> Dataset:
        self._dataset = self.source.load()
        if hasattr(self.engine, "invalidate_cache"):
            self.engine.invalidate_cache()
        logger.info(
            "Dataset recarregado (%s): %d filmes, %d ratings",
            self.source.name,
            len(self._dataset.movies),
            len(self._dataset.ratings),
        )
        return self._dataset

    def info(self) -> dict[str, object]:
        meta = self._dataset.meta or {}
        counts = meta.get("counts", {}) if isinstance(meta.get("counts"), dict) else {}
        return {
            "loaded": self._dataset.loaded,
            "source": self.source.name,
            "id_type": self._dataset.id_type,
            "movies": int(counts.get("movies", len(self._dataset.movies)) or 0),
            "ratings": int(counts.get("ratings", len(self._dataset.ratings)) or 0),
            "watchlist": int(counts.get("watchlist", len(self._dataset.watchlist)) or 0),
            "built_at": meta.get("built_at"),
            "engine_ready": bool(self.engine.is_ready),
        }

    def recommendations(
        self,
        user_id: str,
        *,
        limit: int = 20,
        genre: str | None = None,
        min_year: int | None = None,
        max_year: int | None = None,
        in_theaters: bool = False,
        now_playing_ids: set[int] | None = None,
    ) -> list[Recommendation]:
        self.ensure_ready()
        feedback: dict[int, str] = {}
        if hasattr(self.source, "load_user_feedback"):
            feedback = self.source.load_user_feedback(user_id)

        known_users = {uid.lower() for uid in self._dataset.user_ids}
        if user_id.lower() not in known_users and not feedback:
            raise UserNotFoundError(f"Usuário sem histórico: {user_id}")

        kwargs: dict[str, object] = {}
        if feedback:
            kwargs["feedback"] = feedback
        if genre is not None:
            kwargs["genre"] = genre
        if min_year is not None:
            kwargs["min_year"] = min_year
        if max_year is not None:
            kwargs["max_year"] = max_year
        if in_theaters:
            kwargs["in_theaters"] = True
        if now_playing_ids is not None:
            kwargs["now_playing_ids"] = now_playing_ids

        try:
            return self.engine.recommend_for_user(
                user_id,
                self._dataset,
                limit=limit,
                **kwargs,
            )
        except TypeError:
            return self.engine.recommend_for_user(user_id, self._dataset, limit=limit)

    def similar(
        self,
        movie_id: int,
        *,
        id_type: str = "internal",
        limit: int = 20,
    ) -> list[Recommendation]:
        self.ensure_ready()

        movie = self._dataset.find_movie(movie_id, id_type=id_type)
        if movie is None:
            raise MovieNotFoundError(f"Filme ausente do dataset: {id_type}={movie_id}")

        canonical = movie.get(self._dataset.key_column)
        reference = int(canonical) if pd.notna(canonical) else movie_id
        return self.engine.similar_movies(reference, self._dataset, limit=limit)

    def graph(
        self,
        movie_id: int,
        *,
        id_type: str = "internal",
        depth: int = 2,
        branching: int = 4,
        min_score: float = 0.15,
    ) -> dict[str, object]:
        self.ensure_ready()

        movie = self._dataset.find_movie(movie_id, id_type=id_type)
        if movie is None:
            raise MovieNotFoundError(f"Filme ausente do dataset: {id_type}={movie_id}")

        canonical = movie.get(self._dataset.key_column)
        reference = int(canonical) if pd.notna(canonical) else movie_id
        if hasattr(self.engine, "movie_graph"):
            return self.engine.movie_graph(
                reference,
                self._dataset,
                depth=depth,
                branching=branching,
                min_score=min_score,
            )
        return {"root": reference, "nodes": [], "edges": []}


def to_movie_id(recommendation: Recommendation) -> int:
    """Chave canônica devolvida ao consumidor (Go core / frontend)."""
    return int(recommendation.movie_id)
