"""Router de recomendações personalizadas."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_recommendation_service
from app.recommender.engine import EngineNotImplementedError
from app.schemas import RecommendationItem, RecommendationsResponse
from app.services.recommendation_service import (
    RecommendationService,
    UserNotFoundError,
    to_movie_id,
)

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations/{user_id}", response_model=RecommendationsResponse)
def get_recommendations(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    genre: str | None = Query(default=None, description="Filtrar por gênero (ex: Terror, Sci-Fi)"),
    min_year: int | None = Query(default=None, ge=1888, le=2100, description="Ano mínimo de lançamento"),
    max_year: int | None = Query(default=None, ge=1888, le=2100, description="Ano máximo de lançamento"),
    in_theaters: bool = Query(default=False, description="Filtrar apenas filmes em cartaz nos cinemas"),
    now_playing_ids: str | None = Query(
        default=None,
        description="IDs em cartaz separados por vírgula (ex: 550,603)",
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> RecommendationsResponse:
    parsed_ids: set[int] | None = None
    if now_playing_ids:
        try:
            parsed_ids = {int(x.strip()) for x in now_playing_ids.split(",") if x.strip()}
        except ValueError:
            parsed_ids = None

    try:
        recommendations = service.recommendations(
            user_id,
            limit=limit,
            genre=genre,
            min_year=min_year,
            max_year=max_year,
            in_theaters=in_theaters,
            now_playing_ids=parsed_ids,
        )
    except EngineNotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    items = [
        RecommendationItem(
            movie_id=to_movie_id(recommendation),
            tmdb_id=recommendation.tmdb_id,
            score=max(0.0, min(float(recommendation.score), 1.0)),
            reason=recommendation.reason,
            is_niche_breaker=recommendation.is_niche_breaker,
            feedback=recommendation.feedback,
        )
        for recommendation in recommendations
    ]

    return RecommendationsResponse(
        user_id=user_id,
        recommendations=items,
        algorithm=service.engine.name,
        id_type=service.dataset.id_type,
        generated_at=datetime.now(UTC),
    )
