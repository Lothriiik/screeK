"""Testes do motor de recomendação (Etapas 1, 2 e 3)."""

from __future__ import annotations

import pandas as pd
import pytest

from app.data.dataset import Dataset
from app.recommender.engine import RecommendationEngine


def test_engine_is_ready() -> None:
    """O motor deve estar pronto para responder requisições."""
    engine = RecommendationEngine()
    assert engine.is_ready is True
    assert engine.name == "screek-content-engine"


def test_similar_movies_retorna_mais_semelhantes() -> None:
    """Testa se filmes com gêneros e keywords parecidas são ranqueados no topo."""
    movies = pd.DataFrame(
        [
            {
                "tmdb_id": 101,
                "genres": "Terror Drama",
                "director": "Ari Aster",
                "keywords": "culto luto sobrenatural",
                "overview": "Filme perturbador sobre luto familiar.",
            },
            {
                "tmdb_id": 102,
                "genres": "Terror Mistério",
                "director": "Ari Aster",
                "keywords": "culto festival pagão",
                "overview": "Viagem para festival que vira pesadelo.",
            },
            {
                "tmdb_id": 103,
                "genres": "Comédia",
                "director": "Diretor Comédia",
                "keywords": "amizade festa formatura",
                "overview": "Jovens tentando comprar bebida para festa.",
            },
        ]
    )

    dataset = Dataset(movies=movies)
    engine = RecommendationEngine()

    recommendations = engine.similar_movies(101, dataset, limit=2)
    assert len(recommendations) == 2
    top = recommendations[0]

    assert top.movie_id == 102
    assert top.tmdb_id == 102
    assert top.score > 0
    assert "Aster" in top.reason or "direção" in top.reason.lower()


def test_recommend_for_user_personalizacao_e_exclusao_de_vistos() -> None:
    """O usuário que gosta de terror deve receber terror e nunca filmes já assistidos."""
    movies = pd.DataFrame(
        [
            {
                "tmdb_id": 1,
                "title": "Hereditário",
                "genres": "Terror Drama",
                "director": "Ari Aster",
                "original_language": "en",
            },
            {
                "tmdb_id": 2,
                "title": "Midsommar",
                "genres": "Terror Mistério",
                "director": "Ari Aster",
                "original_language": "en",
            },
            {
                "tmdb_id": 3,
                "title": "Raw",
                "genres": "Terror Drama",
                "director": "Julia Ducournau",
                "original_language": "fr",  # Niche breaker (francês)
            },
            {
                "tmdb_id": 4,
                "title": "Gente Grande",
                "genres": "Comédia",
                "director": "Dennis Dugan",
                "original_language": "en",
            },
        ]
    )

    ratings = pd.DataFrame(
        [
            {"user_id": "lothriik", "tmdb_id": 1, "rating": 5.0},  # Amou Hereditário
            {"user_id": "lothriik", "tmdb_id": 4, "rating": 1.0},  # Odiou Gente Grande
        ]
    )

    watchlist = pd.DataFrame(
        [
            {"user_id": "lothriik", "tmdb_id": 3},  # Raw está na watchlist
        ]
    )

    dataset = Dataset(movies=movies, ratings=ratings, watchlist=watchlist)
    engine = RecommendationEngine()

    recs = engine.recommend_for_user("lothriik", dataset, limit=3)

    rec_ids = [r.movie_id for r in recs]

    # 1. Hereditário (1) e Gente Grande (4) já foram vistos e NUNCA devem aparecer
    assert 1 not in rec_ids
    assert 4 not in rec_ids

    # 2. Midsommar (2) deve aparecer com score alto
    assert 2 in rec_ids

    # 3. Raw (3) foi impulsionado pela watchlist e marcado como niche breaker
    assert 3 in rec_ids
    raw_rec = next(r for r in recs if r.movie_id == 3)
    assert raw_rec.is_niche_breaker is True
    assert "Watchlist" in raw_rec.reason


def test_recommend_for_user_cold_start() -> None:
    """Usuário sem notas deve receber fallback de filmes populares sem quebrar."""
    movies = pd.DataFrame(
        [
            {"tmdb_id": 10, "title": "Filme Top 1", "popularity": 99.5},
            {"tmdb_id": 20, "title": "Filme Top 2", "popularity": 85.0},
        ]
    )
    dataset = Dataset(movies=movies, ratings=pd.DataFrame(columns=["user_id", "tmdb_id", "rating"]))
    engine = RecommendationEngine()

    recs = engine.recommend_for_user("novo_usuario", dataset, limit=2)
    assert len(recs) == 2
    assert recs[0].movie_id == 10
    assert "popular" in recs[0].reason.lower()


def test_recommend_for_user_in_theaters() -> None:
    """Testa se o filtro in_theaters isola apenas filmes em cartaz e adiciona motivo."""
    movies = pd.DataFrame(
        [
            {"tmdb_id": 1, "title": "Raw", "genres": "Horror", "in_theaters": False},
            {"tmdb_id": 2, "title": "Pânico 7", "genres": "Horror", "in_theaters": True},
            {"tmdb_id": 3, "title": "Superbad", "genres": "Comedy", "in_theaters": True},
        ]
    )
    ratings = pd.DataFrame([{"user_id": "lothriik", "tmdb_id": 1, "rating": 5.0}])
    dataset = Dataset(movies=movies, ratings=ratings)
    engine = RecommendationEngine()

    # Pede recomendações com in_theaters=True
    recs = engine.recommend_for_user("lothriik", dataset, in_theaters=True, limit=5)

    assert len(recs) == 2
    # Pânico 7 (Terror em cartaz) deve vir em 1º devido ao gosto do usuário
    assert recs[0].movie_id == 2
    assert "em cartaz nos cinemas" in recs[0].reason

