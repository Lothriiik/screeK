"""Testes de pontuação, matching e cache incremental."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from tools.matching import (
    flatten_movie_details,
    match_movie,
    match_ratings,
    normalize_title,
    score_candidate,
)


class FakeTMDBClient:
    def __init__(self) -> None:
        self.search_calls = 0

    def search_movies(
        self,
        query: str,
        year: int | None = None,
        *,
        language: str = "en-US",
        force: bool = False,
    ) -> list[dict[str, object]]:
        self.search_calls += 1
        return [
            {
                "id": 999,
                "title": query,
                "original_title": query,
                "release_date": f"{year or 2000}-01-01",
                "popularity": 10.0,
            },
            {
                "id": 1000,
                "title": "Outro Filme",
                "original_title": "Outro Filme",
                "release_date": "1999-01-01",
                "popularity": 500.0,
            },
        ]


def test_normalize_title_remove_acentos_e_pontuacao() -> None:
    assert normalize_title("Amélie!") == "amelie"
    assert normalize_title("The   Wolf-House") == "the wolf house"
    assert normalize_title("Fast & Furious") == "fast and furious"


def test_score_candidate_prioriza_titulo_e_ano() -> None:
    exact = {
        "title": "Raw",
        "original_title": "Grave",
        "release_date": "2016-03-15",
        "popularity": 10,
    }
    wrong_year = {
        "title": "Raw",
        "original_title": "Raw",
        "release_date": "2020-01-01",
        "popularity": 10,
    }
    wrong_title = {
        "title": "Outro",
        "original_title": "Outro",
        "release_date": "2016-01-01",
        "popularity": 10,
    }

    assert score_candidate(exact, "Raw", 2016) > score_candidate(wrong_year, "Raw", 2016)
    assert score_candidate(exact, "Raw", 2016) > score_candidate(wrong_title, "Raw", 2016)


def test_score_rejeita_substring_fraco_com_ano_exato() -> None:
    # "Raw" não deve casar com "Raw Sauce" só porque o ano bate.
    false_positive = {
        "title": "Raw Sauce",
        "original_title": "Raw Sauce",
        "release_date": "2016-01-01",
        "popularity": 10,
    }
    assert score_candidate(false_positive, "Raw", 2016) < 70

    # Título exato com ano muito distante costuma ser outro filme.
    wrong_year = {
        "title": "Seance",
        "original_title": "Seance",
        "release_date": "2006-01-01",
        "popularity": 10,
    }
    assert score_candidate(wrong_year, "Seance", 2000) < 70

    # Prefixo com contexto (subtítulo encurtado) continua válido.
    shortened = {
        "title": "Glass Onion: A Knives Out Mystery",
        "original_title": "Glass Onion: A Knives Out Mystery",
        "release_date": "2022-11-23",
        "popularity": 100,
    }
    assert score_candidate(shortened, "Glass Onion", 2022) >= 70


def test_match_movie_usa_fallback_sem_ano() -> None:
    class YearSensitiveClient(FakeTMDBClient):
        def search_movies(
            self,
            query: str,
            year: int | None = None,
            *,
            language: str = "en-US",
            force: bool = False,
        ) -> list[dict[str, object]]:
            self.search_calls += 1
            if year:
                # Resultado ruim: mesmo ano, título diferente.
                return [
                    {
                        "id": 1,
                        "title": "Outro Filme",
                        "original_title": "Outro Filme",
                        "release_date": f"{year}-01-01",
                        "popularity": 10.0,
                    }
                ]
            return [
                {
                    "id": 999,
                    "title": query,
                    "original_title": query,
                    "release_date": "2017-01-01",
                    "popularity": 10.0,
                }
            ]

    client = YearSensitiveClient()
    result = match_movie(client, "Raw", 2016, letterboxd_uri="https://boxd.it/raw")

    assert result is not None
    assert result.tmdb_id == 999
    assert result.method == "search_without_year"
    assert client.search_calls == 2


def test_match_ratings_e_incremental(tmp_path: Path) -> None:
    client = FakeTMDBClient()
    ratings = pd.DataFrame(
        [
            {"name": "Raw", "year": 2016, "letterboxd_uri": "https://boxd.it/raw"},
            {"name": "The Wolf House", "year": 2018, "letterboxd_uri": "https://boxd.it/wolf"},
        ]
    )
    cache_path = tmp_path / "matches.csv"

    first = match_ratings(client, ratings, cache_path)
    calls_after_first = client.search_calls
    second = match_ratings(client, ratings, cache_path)

    assert len(first) == 2
    assert len(second) == 2
    assert client.search_calls == calls_after_first
    assert set(second["match_method"]) == {"search_with_year"}


def test_flatten_movie_details_extrai_campos() -> None:
    details = {
        "id": 123,
        "title": "Raw",
        "original_title": "Grave",
        "release_date": "2016-03-15",
        "runtime": 99,
        "genres": [{"name": "Horror"}, {"name": "Drama"}],
        "keywords": {"keywords": [{"name": "cannibalism"}]},
        "production_countries": [{"name": "France"}],
        "production_companies": [{"name": "Petit Film"}],
        "credits": {
            "crew": [{"name": "Julia Ducournau", "job": "Director"}],
            "cast": [{"name": "Garance Marillier"}],
        },
        "release_dates": {
            "results": [
                {
                    "iso_3166_1": "US",
                    "release_dates": [{"certification": "R"}],
                }
            ]
        },
        "vote_average": 7.1,
        "vote_count": 1000,
        "popularity": 20.0,
        "budget": 0,
        "revenue": 0,
        "poster_path": "/raw.jpg",
        "backdrop_path": "/raw-bg.jpg",
        "original_language": "fr",
    }

    row = flatten_movie_details(details)

    assert row["tmdb_id"] == 123
    assert row["year"] == 2016
    assert row["genres"] == "Horror|Drama"
    assert row["director"] == "Julia Ducournau"
    assert row["certification"] == "R"
    assert row["poster_url"].endswith("/w500/raw.jpg")
