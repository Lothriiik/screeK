"""Schemas Pydantic (API e domínio)."""

from app.schemas.models import (
    DatasetInfo,
    HealthResponse,
    MessageResponse,
    RecommendationItem,
    RecommendationsResponse,
    SimilarMovieItem,
    SimilarMoviesResponse,
)
from app.schemas.movie import MovieCatalog, MovieMetadata
from app.schemas.recommendation import (
    Recommendation,
    RecommendationResponse,
    SimilarMovie,
    UserProfile,
    UserRating,
)
from app.schemas.recommendation import (
    SimilarMoviesResponse as LegacySimilarMoviesResponse,
)

__all__ = [
    "DatasetInfo",
    "HealthResponse",
    "LegacySimilarMoviesResponse",
    "MessageResponse",
    "MovieCatalog",
    "MovieMetadata",
    "Recommendation",
    "RecommendationItem",
    "RecommendationResponse",
    "RecommendationsResponse",
    "SimilarMovie",
    "SimilarMovieItem",
    "SimilarMoviesResponse",
    "UserProfile",
    "UserRating",
]
