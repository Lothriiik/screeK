"""Contratos Pydantic da API (não vazar estruturas internas)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

IdType = Literal["internal", "tmdb"]


class RecommendationItem(BaseModel):
    """Um filme recomendado.

    `movie_id` é o ID interno canônico (movies.id) quando o mapa
    Postgres → Python estiver disponível; caso contrário recebe o `tmdb_id`
    para manter o contrato do frontend estável.
    """

    movie_id: int
    tmdb_id: int | None = None
    score: float = Field(ge=0.0, le=1.0)
    reason: str = ""
    is_niche_breaker: bool = False
    feedback: str = ""


class RecommendationsResponse(BaseModel):
    user_id: str
    recommendations: list[RecommendationItem]
    algorithm: str
    id_type: IdType = Field(
        default="internal",
        description="Semântica de movie_id: internal (movies.id) ou tmdb.",
    )
    generated_at: datetime


class SimilarMovieItem(BaseModel):
    movie_id: int
    tmdb_id: int | None = None
    similarity_score: float = Field(ge=0.0, le=1.0)
    reason: str = ""


class SimilarMoviesResponse(BaseModel):
    movie_id: int
    tmdb_id: int
    similar_movies: list[SimilarMovieItem]
    algorithm: str
    id_type: IdType = Field(
        default="internal",
        description="Semântica de movie_id: internal (movies.id) ou tmdb.",
    )
    generated_at: datetime


class DatasetInfo(BaseModel):
    loaded: bool
    source: str = "csv"
    id_type: str = "tmdb"
    movies: int = 0
    ratings: int = 0
    watchlist: int = 0
    built_at: str | None = None
    engine_ready: bool = False


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    dataset: DatasetInfo


class MessageResponse(BaseModel):
    message: str
