"""Testes da abstração de fonte de dados (Postgres vs CSV)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.config import Settings
from app.core.constants import MOVIE_COLUMNS, RATING_COLUMNS
from app.data.source import (
    CsvDataSource,
    DataSourceError,
    PostgresDataSource,
    get_data_source,
)
from tests.conftest import write_csv


def test_get_data_source_padrao_e_csv(tmp_path: Path) -> None:
    settings = Settings(data_dir=tmp_path / "data")

    source = get_data_source(settings)

    assert isinstance(source, CsvDataSource)
    assert source.name == "csv"


def test_get_data_source_postgres_exige_database_url(tmp_path: Path) -> None:
    settings = Settings(
        data_dir=tmp_path / "data",
        data_source="postgres",
        database_url="",
    )

    with pytest.raises(DataSourceError):
        get_data_source(settings)


def test_postgres_source_rejeita_url_vazia() -> None:
    with pytest.raises(DataSourceError):
        PostgresDataSource("")


def test_get_data_source_desconhecida(tmp_path: Path) -> None:
    settings = Settings(data_dir=tmp_path / "data", data_source="mysql")

    with pytest.raises(DataSourceError):
        get_data_source(settings)


def test_csv_source_dataset_vazio(tmp_path: Path) -> None:
    dataset = CsvDataSource(tmp_path / "processed").load()

    assert dataset.loaded is False
    assert dataset.meta.get("source") == "csv"
    assert dataset.movie_keys == set()
    assert dataset.id_type == "tmdb"


def test_csv_source_le_dataset_construido(tmp_path: Path) -> None:
    processed = tmp_path / "processed"
    processed.mkdir()

    write_csv(
        processed / "movies.csv",
        [
            {"tmdb_id": 1, "movie_id": 10, "title": "Raw", "year": 2016},
            {"tmdb_id": 2, "movie_id": 20, "title": "The Wolf House", "year": 2018},
        ],
        MOVIE_COLUMNS,
    )
    write_csv(
        processed / "ratings.csv",
        [
            {
                "user_id": "lothriik",
                "tmdb_id": 1,
                "movie_id": 10,
                "rating": 4.5,
                "liked": True,
                "watched": True,
                "rated_at": "2024-01-01",
                "source": "letterboxd_rating",
            }
        ],
        RATING_COLUMNS,
    )
    write_csv(processed / "watchlist.csv", [], ["user_id", "tmdb_id", "movie_id"])
    (processed / "dataset_meta.json").write_text(
        json.dumps({"built_at": "2024-01-01T00:00:00Z", "counts": {"movies": 2, "ratings": 1}}),
        encoding="utf-8",
    )

    dataset = CsvDataSource(processed).load()

    assert dataset.loaded is True
    assert dataset.key_column == "movie_id"
    assert dataset.id_type == "internal"
    assert dataset.movie_keys == {10, 20}
    assert dataset.user_ids == ["lothriik"]

    # ID interno canônico.
    assert dataset.find_movie(10, id_type="internal") is not None
    # TMDB explícito.
    assert dataset.find_movie(1, id_type="tmdb") is not None
    # Fallback para CSV sem mapa: interno cai para tmdb_id.
    assert dataset.find_movie(1, id_type="internal") is not None
    assert dataset.find_movie(999, id_type="internal") is None
