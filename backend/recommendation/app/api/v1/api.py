"""Agregador dos routers da API v1."""

from fastapi import APIRouter

from app.api.v1.routers import dataset, health, recommendations, similar

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(recommendations.router)
api_router.include_router(similar.router)
api_router.include_router(dataset.router)

__all__ = ["api_router"]
