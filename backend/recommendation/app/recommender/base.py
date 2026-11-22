"""Contrato do motor de recomendação.

O motor real será implementado pelo usuário em `engine.py`. A API e os
serviços dependem apenas deste Protocol, então a implementação pode mudar
sem afetar o restante do serviço.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.data.dataset import Dataset


@dataclass(frozen=True)
class Recommendation:
    """Resultado de uma recomendação, independente do algoritmo.

    `movie_id` é a chave canônica usada no Dataset: `movies.id` quando o
    mapa de IDs está disponível, ou `tmdb_id` no modo CSV sem Postgres.
    `tmdb_id` é apenas um atalho para exibição/hidratação.
    """

    movie_id: int
    score: float
    tmdb_id: int | None = None
    reason: str = ""
    is_niche_breaker: bool = False
    feedback: str = ""


class Recommender(Protocol):
    """Interface que o motor de recomendação deve implementar."""

    name: str

    @property
    def is_ready(self) -> bool:
        """Indica se o motor já pode responder requisições."""
        ...

    def recommend_for_user(
        self,
        user_id: str,
        dataset: Dataset,
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        """Recomenda filmes para um usuário."""
        ...

    def similar_movies(
        self,
        movie_id: int,
        dataset: Dataset,
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        """Recomenda filmes parecidos com `movie_id` (chave canônica)."""
        ...
