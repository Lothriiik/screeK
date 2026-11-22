"""Router de filmes similares.

O consumidor natural é o Go core, que chama com `movies.id` (id_type=internal)
e hidrata os metadados. O modo `tmdb` existe para desenvolvimento offline.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_recommendation_service
from app.recommender.engine import EngineNotImplementedError
from app.schemas import SimilarMovieItem, SimilarMoviesResponse
from app.services.recommendation_service import (
    MovieNotFoundError,
    RecommendationService,
    to_movie_id,
)

router = APIRouter(tags=["similar"])


@router.get("/similar/{movie_id}", response_model=SimilarMoviesResponse)
def get_similar_movies(
    movie_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    id_type: Literal["internal", "tmdb"] = Query(
        default="internal",
        description="internal (movies.id, padrão) ou tmdb (apenas offline/dev)",
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> SimilarMoviesResponse:
    try:
        recommendations = service.similar(movie_id, id_type=id_type, limit=limit)
    except EngineNotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except MovieNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    movie = service.dataset.find_movie(movie_id, id_type=id_type)
    raw_tmdb = movie.get("tmdb_id") if movie is not None else None
    tmdb_id = int(raw_tmdb) if raw_tmdb is not None and pd.notna(raw_tmdb) else 0

    # A resposta sempre usa a chave canônica, mesmo quando a busca foi por TMDB.
    raw_key = movie.get(service.dataset.key_column) if movie is not None else None
    canonical_id = int(raw_key) if raw_key is not None and pd.notna(raw_key) else movie_id

    items = [
        SimilarMovieItem(
            movie_id=to_movie_id(recommendation),
            tmdb_id=recommendation.tmdb_id,
            similarity_score=max(0.0, min(float(recommendation.score), 1.0)),
            reason=recommendation.reason,
        )
        for recommendation in recommendations
    ]

    return SimilarMoviesResponse(
        movie_id=canonical_id,
        tmdb_id=tmdb_id,
        similar_movies=items,
        algorithm=service.engine.name,
        id_type=service.dataset.id_type,
        generated_at=datetime.now(UTC),
    )


@router.get("/similar/{movie_id}/graph")
def get_movie_graph(
    movie_id: int,
    depth: int = Query(default=2, ge=1, le=3, description="Profundidade do grafo (1 ou 2)"),
    branching: int = Query(default=4, ge=2, le=8, description="Número de conexões por nó"),
    min_score: float = Query(default=0.15, ge=0.0, le=1.0, description="Score mínimo da aresta"),
    id_type: Literal["internal", "tmdb"] = Query(
        default="internal",
        description="internal (movies.id, padrão) ou tmdb (apenas offline/dev)",
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> dict[str, object]:
    """Retorna o subgrafo kNN com conexões explicadas para renderização visual."""
    try:
        result = dict(
            service.graph(
                movie_id,
                id_type=id_type,
                depth=depth,
                branching=branching,
                min_score=min_score,
            )
        )
        result.setdefault("id_type", service.dataset.id_type)
        return result
    except EngineNotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except MovieNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

