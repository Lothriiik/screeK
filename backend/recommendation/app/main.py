"""Entrypoint FastAPI do screeK Intelligence Service."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config import Settings, get_settings
from app.schemas import DatasetInfo, HealthResponse
from app.services.recommendation_service import RecommendationService


def create_app(settings: Settings | None = None) -> FastAPI:
    """Cria a aplicação (injetável em testes)."""
    settings = settings or get_settings()
    settings.ensure_directories()

    service = RecommendationService(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.recommendation_service = service
        service.warm_up()
        yield

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Motor de recomendação do screeK. Lê o catálogo canônico do "
            "Postgres (ou um dataset CSV offline) e devolve IDs de filmes."
        ),
        lifespan=lifespan,
    )

    app.state.settings = settings
    app.state.recommendation_service = service

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/", tags=["health"])
    def root() -> dict[str, str]:
        return {
            "message": "screeK Intelligence API is running",
            "version": settings.app_version,
            "docs": "/docs",
        }

    @app.get("/health", response_model=HealthResponse, tags=["health"], include_in_schema=False)
    def root_health() -> HealthResponse:
        info = service.info()
        return HealthResponse(
            status="ok",
            app=settings.app_name,
            version=settings.app_version,
            dataset=DatasetInfo(**info),
        )

    return app


app = create_app()
