"""Motor de recomendação (contrato e implementação)."""

from app.recommender.base import Recommendation, Recommender
from app.recommender.engine import EngineNotImplementedError, RecommendationEngine

__all__ = [
    "EngineNotImplementedError",
    "Recommendation",
    "RecommendationEngine",
    "Recommender",
]
