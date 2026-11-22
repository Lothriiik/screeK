"""Testes de ponta a ponta da API HTTP com motor ativo."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

from app.config import Settings
from app.data.dataset import Dataset
from app.main import create_app
from app.services.recommendation_service import RecommendationService


def make_client(tmp_path: Path, dataset: Dataset | None = None) -> TestClient:
    settings = Settings(data_dir=tmp_path / "data", debug=False)
    app = create_app(settings)
    if dataset is not None:
        service = app.state.recommendation_service
        service._dataset = dataset
    return TestClient(app)


def test_root_e_health(tmp_path: Path) -> None:
    client = make_client(tmp_path)

    root = client.get("/")
    assert root.status_code == 200
    assert "running" in root.json()["message"]

    health = client.get("/health")
    assert health.status_code == 200
    payload = health.json()
    assert payload["status"] == "ok"
    assert payload["dataset"]["loaded"] is False
    # Agora que o Passo 1 foi implementado, o motor está pronto!
    assert payload["dataset"]["engine_ready"] is True

    v1_health = client.get("/api/v1/health")
    assert v1_health.status_code == 200


def test_similar_retorna_recomendacoes_quando_filme_existe(tmp_path: Path) -> None:
    dataset = Dataset(
        movies=pd.DataFrame(
            [
                {
                    "tmdb_id": 1,
                    "movie_id": 10,
                    "title": "Raw",
                    "genres": "Horror Drama",
                    "director": "Julia Ducournau",
                    "cast": "Garance Marillier",
                    "overview": "Vegetarian student develops cannibal taste.",
                },
                {
                    "tmdb_id": 2,
                    "movie_id": 20,
                    "title": "Titane",
                    "genres": "Horror Drama Sci-Fi",
                    "director": "Julia Ducournau",
                    "cast": "Agathe Rousselle",
                    "overview": "Young woman with a titanium plate in her skull.",
                },
            ]
        ),
        ratings=pd.DataFrame(columns=["user_id", "movie_id", "tmdb_id", "rating"]),
        meta={"counts": {"movies": 2, "ratings": 0, "watchlist": 0}},
    )
    client = make_client(tmp_path, dataset=dataset)

    response = client.get("/api/v1/similar/10")
    assert response.status_code == 200
    data = response.json()
    assert data["movie_id"] == 10
    assert len(data["similar_movies"]) == 1
    assert data["similar_movies"][0]["movie_id"] == 20
    assert data["similar_movies"][0]["tmdb_id"] == 2


def test_similar_retorna_404_quando_filme_inexistente(tmp_path: Path) -> None:
    client = make_client(tmp_path)

    response = client.get("/api/v1/similar/999")
    assert response.status_code == 404


def test_health_reporta_fonte_csv(tmp_path: Path) -> None:
    client = make_client(tmp_path)

    payload = client.get("/health").json()
    assert payload["dataset"]["source"] == "csv"


def test_similar_graph_endpoint_retorna_nos_e_arestas(tmp_path: Path) -> None:
    dataset = Dataset(
        movies=pd.DataFrame(
            [
                {
                    "tmdb_id": 1,
                    "movie_id": 10,
                    "title": "Raw",
                    "genres": "Horror Drama",
                    "director": "Julia Ducournau",
                    "cast": "Garance Marillier",
                    "overview": "Vegetarian student develops cannibal taste.",
                },
                {
                    "tmdb_id": 2,
                    "movie_id": 20,
                    "title": "Titane",
                    "genres": "Horror Drama Sci-Fi",
                    "director": "Julia Ducournau",
                    "cast": "Agathe Rousselle",
                    "overview": "Young woman with a titanium plate in her skull.",
                },
            ]
        ),
        ratings=pd.DataFrame(columns=["user_id", "movie_id", "tmdb_id", "rating"]),
        meta={"counts": {"movies": 2, "ratings": 0, "watchlist": 0}},
    )
    client = make_client(tmp_path, dataset=dataset)

    response = client.get("/api/v1/similar/10/graph?depth=1&min_score=0.1")
    assert response.status_code == 200
    data = response.json()
    assert data["root"] == 10
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1
    assert data["edges"][0]["source"] == 10
    assert data["edges"][0]["target"] == 20
    assert "reason" in data["edges"][0]


def test_recommendations_com_filtro_de_genero(tmp_path: Path) -> None:
    dataset = Dataset(
        movies=pd.DataFrame(
            [
                {"tmdb_id": 1, "movie_id": 10, "title": "Raw", "genres": "Horror", "year": 2016},
                {"tmdb_id": 2, "movie_id": 20, "title": "Superbad", "genres": "Comedy", "year": 2007},
            ]
        ),
        ratings=pd.DataFrame([{"user_id": "lothriik", "movie_id": 10, "rating": 5.0}]),
        meta={"counts": {"movies": 2, "ratings": 1, "watchlist": 0}},
    )
    client = make_client(tmp_path, dataset=dataset)

    # Filtrando apenas por Comédia
    response = client.get("/api/v1/recommendations/lothriik?genre=Comedy")
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["movie_id"] == 20


