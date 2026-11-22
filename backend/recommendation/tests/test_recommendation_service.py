"""Testes da orquestração fonte + motor (sem HTTP)."""

from __future__ import annotations

import pandas as pd
import pytest

from app.config import Settings
from app.data.dataset import Dataset
from app.recommender.base import Recommendation
from app.services.recommendation_service import (
    MovieNotFoundError,
    RecommendationService,
    UserNotFoundError,
)


class FakeEngine:
    name = "fake"

    def __init__(self) -> None:
        self.last_user: str | None = None
        self.last_movie: int | None = None

    @property
    def is_ready(self) -> bool:
        return True

    def recommend_for_user(
        self,
        user_id: str,
        dataset: Dataset,
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        self.last_user = user_id
        return [Recommendation(movie_id=20, tmdb_id=2, score=0.9, reason="teste")]

    def similar_movies(
        self,
        movie_id: int,
        dataset: Dataset,
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        self.last_movie = movie_id
        return [Recommendation(movie_id=20, tmdb_id=2, score=0.8, reason="similar")]


class FakeSource:
    name = "fake"

    def __init__(self, dataset: Dataset) -> None:
        self.dataset = dataset

    def load(self) -> Dataset:
        return self.dataset


def make_service(tmp_path) -> tuple[RecommendationService, FakeEngine]:
    dataset = Dataset(
        movies=pd.DataFrame(
            [
                {"tmdb_id": 1, "movie_id": 10, "title": "Raw"},
                {"tmdb_id": 2, "movie_id": 20, "title": "The Wolf House"},
            ]
        ),
        ratings=pd.DataFrame(
            [{"user_id": "lothriik", "movie_id": 10, "tmdb_id": 1, "rating": 4.5}]
        ),
        watchlist=pd.DataFrame(columns=["user_id", "movie_id", "tmdb_id"]),
        meta={"counts": {"movies": 2, "ratings": 1, "watchlist": 0}},
    )
    engine = FakeEngine()
    service = RecommendationService(
        settings=Settings(data_dir=tmp_path / "data", debug=False),
        engine=engine,
        source=FakeSource(dataset),
    )
    return service, engine


def test_recommendations_usa_o_motor(tmp_path) -> None:
    service, engine = make_service(tmp_path)

    result = service.recommendations("lothriik", limit=5)

    assert engine.last_user == "lothriik"
    assert [item.movie_id for item in result] == [20]
    assert service.info()["id_type"] == "internal"


def test_recommendations_falha_para_usuario_sem_historico(tmp_path) -> None:
    service, _ = make_service(tmp_path)

    with pytest.raises(UserNotFoundError):
        service.recommendations("ninguem")


def test_similar_resolve_tmdb_para_id_interno(tmp_path) -> None:
    service, engine = make_service(tmp_path)

    result = service.similar(1, id_type="tmdb")

    assert engine.last_movie == 10
    assert [item.movie_id for item in result] == [20]


def test_similar_falha_para_filme_ausente(tmp_path) -> None:
    service, _ = make_service(tmp_path)

    with pytest.raises(MovieNotFoundError):
        service.similar(999, id_type="internal")
