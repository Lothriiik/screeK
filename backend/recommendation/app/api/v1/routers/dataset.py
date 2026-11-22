"""Router de manutenção do dataset."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_recommendation_service
from app.schemas import MessageResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(tags=["dataset"])


@router.post("/dataset/reload", response_model=MessageResponse)
def reload_dataset(
    service: RecommendationService = Depends(get_recommendation_service),
) -> MessageResponse:
    dataset = service.reload()
    return MessageResponse(
        message=f"Dataset recarregado: {len(dataset.movies)} filmes, {len(dataset.ratings)} ratings."
    )
