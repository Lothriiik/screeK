"""Testes da escala de notas e das features de conteúdo."""

from __future__ import annotations

import pandas as pd

from app.core.constants import is_valid_rating, to_display_rating
from app.data.features import build_content_features, similar_by_content


def test_escala_canonica_e_exibicao() -> None:
    assert is_valid_rating(0.5) is True
    assert is_valid_rating(5.0) is True
    assert is_valid_rating(0.0) is True
    assert is_valid_rating(5.5) is False
    assert is_valid_rating(None) is False

    assert to_display_rating(4.5) == 9.0
    assert to_display_rating(0.0) is None


def test_build_content_features_e_similaridade() -> None:
    movies = pd.DataFrame(
        [
            {
                "tmdb_id": 1,
                "genres": "Horror|Drama",
                "keywords": "cannibalism",
                "countries": "France",
                "studios": "Petit Film",
                "director": "Julia Ducournau",
                "cast": "Garance Marillier",
                "overview": "A vegetarian student develops a taste for human flesh.",
            },
            {
                "tmdb_id": 2,
                "genres": "Horror|Thriller",
                "keywords": "cannibalism",
                "countries": "France",
                "studios": "Petit Film",
                "director": "Outro Diretor",
                "cast": "Outra Atriz",
                "overview": "A dark horror story about hunger.",
            },
            {
                "tmdb_id": 3,
                "genres": "Comedy",
                "keywords": "friends",
                "countries": "USA",
                "studios": "Big Studio",
                "director": "Comedy Director",
                "cast": "Comedian",
                "overview": "A light comedy about friendship.",
            },
        ]
    )

    features = build_content_features(movies)
    similar = similar_by_content(features, 1, limit=2)

    assert features.matrix.shape[0] == 3
    assert features.key_column == "tmdb_id"
    assert features.movie_keys == [1, 2, 3]
    assert features.tmdb_ids == [1, 2, 3]
    assert similar[0][0] == 2
    assert all(tmdb_id != 1 for tmdb_id, _ in similar)


def test_build_content_features_usa_movie_id_quando_pedido() -> None:
    movies = pd.DataFrame(
        [
            {"movie_id": 10, "tmdb_id": 1, "genres": "Horror", "overview": "horror"},
            {"movie_id": 20, "tmdb_id": 2, "genres": "Horror", "overview": "horror"},
            {"movie_id": 30, "tmdb_id": 3, "genres": "Comedy", "overview": "comedy"},
        ]
    )

    features = build_content_features(movies, key_column="movie_id")
    similar = similar_by_content(features, 10, limit=2)

    assert features.key_column == "movie_id"
    assert features.movie_keys == [10, 20, 30]
    assert similar[0][0] == 20
    assert all(movie_id != 10 for movie_id, _ in similar)


def test_explain_connection_identifica_diretor_e_generos() -> None:
    from app.data.dataset import Dataset
    from app.data.features import build_movie_graph, explain_connection

    movies = pd.DataFrame(
        [
            {
                "tmdb_id": 1,
                "title": "Raw",
                "genres": "Horror Drama",
                "director": "Julia Ducournau",
                "keywords": "cannibalism",
                "countries": "France",
            },
            {
                "tmdb_id": 2,
                "title": "Titane",
                "genres": "Horror Sci-Fi",
                "director": "Julia Ducournau",
                "keywords": "cars thriller",
                "countries": "France",
            },
        ]
    )

    features = build_content_features(movies)
    explanation = explain_connection(features, 1, 2)

    # Devem se conectar fortemente pelo mesmo diretor (Julia Ducournau)
    assert explanation["group"] == "director"
    assert "Ducournau" in explanation["reason"]

    # Testa também a montagem do grafo
    dataset = Dataset(movies=movies)
    graph = build_movie_graph(features, dataset, root_movie_key=1, depth=1)
    assert graph["root"] == 1
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert graph["edges"][0]["source"] == 1
    assert graph["edges"][0]["target"] == 2
    assert "Ducournau" in graph["edges"][0]["reason"]

