"""Routers da API v1."""

from app.api.v1.routers import dataset, health, recommendations, similar

__all__ = ["dataset", "health", "recommendations", "similar"]
