"""Router de health check."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_recommendation_service
from app.schemas import DatasetInfo, HealthResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(service: RecommendationService = Depends(get_recommendation_service)) -> HealthResponse:
    info = service.info()
    return HealthResponse(
        status="ok",
        app=service.settings.app_name,
        version=service.settings.app_version,
        dataset=DatasetInfo(**info),
    )
