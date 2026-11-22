"""Testes da montagem do dataset final."""

from __future__ import annotations

from pathlib import Path

from app.data.dataset import build_dataset, load_dataset
from tests.conftest import write_csv


def _prepare_processed(tmp_path: Path) -> Path:
    processed = tmp_path / "processed"
    processed.mkdir()

    write_csv(
        processed / "letterboxd_ratings.csv",
        [
            {
                "date": "2024-01-01",
                "name": "Raw",
                "year": 2016,
                "letterboxd_uri": "https://boxd.it/raw",
                "rating": 4.5,
            },
            {
                "date": "2024-01-02",
                "name": "The Wolf House",
                "year": 2018,
                "letterboxd_uri": "https://boxd.it/wolf",
                "rating": 5,
            },
        ],
        ["date", "name", "year", "letterboxd_uri", "rating"],
    )
    write_csv(
        processed / "letterboxd_watched.csv",
        [
            {
                "date": "2024-01-04",
                "name": "Unrated Film",
                "year": 2021,
                "letterboxd_uri": "https://boxd.it/unrated",
            }
        ],
        ["date", "name", "year", "letterboxd_uri"],
    )
    write_csv(
        processed / "letterboxd_watchlist.csv",
        [
            {
                "date": "2024-02-01",
                "name": "Forrest Gump",
                "year": 1994,
                "letterboxd_uri": "https://boxd.it/gump",
            }
        ],
        ["date", "name", "year", "letterboxd_uri"],
    )
    write_csv(
        processed / "letterboxd_likes.csv",
        [
            {
                "date": "2024-01-01",
                "name": "Raw",
                "year": 2016,
                "letterboxd_uri": "https://boxd.it/raw",
            }
        ],
        ["date", "name", "year", "letterboxd_uri"],
    )
    write_csv(
        processed / "matches.csv",
        [
            {
                "letterboxd_uri": "https://boxd.it/raw",
                "name": "Raw",
                "year": 2016,
                "tmdb_id": 999,
                "match_score": 90,
                "match_method": "search_with_year",
                "matched_title": "Raw",
                "matched_year": 2016,
                "matched_at": "2024-01-01T00:00:00Z",
            },
            {
                "letterboxd_uri": "https://boxd.it/wolf",
                "name": "The Wolf House",
                "year": 2018,
                "tmdb_id": 1000,
                "match_score": 90,
                "match_method": "search_with_year",
                "matched_title": "The Wolf House",
                "matched_year": 2018,
                "matched_at": "2024-01-01T00:00:00Z",
            },
            {
                "letterboxd_uri": "https://boxd.it/unrated",
                "name": "Unrated Film",
                "year": 2021,
                "tmdb_id": 1001,
                "match_score": 80,
                "match_method": "search_with_year",
                "matched_title": "Unrated Film",
                "matched_year": 2021,
                "matched_at": "2024-01-01T00:00:00Z",
            },
            {
                "letterboxd_uri": "https://boxd.it/gump",
                "name": "Forrest Gump",
                "year": 1994,
                "tmdb_id": 13,
                "match_score": 90,
                "match_method": "search_with_year",
                "matched_title": "Forrest Gump",
                "matched_year": 1994,
                "matched_at": "2024-01-01T00:00:00Z",
            },
        ],
        [
            "letterboxd_uri",
            "name",
            "year",
            "tmdb_id",
            "match_score",
            "match_method",
            "matched_title",
            "matched_year",
            "matched_at",
        ],
    )
    write_csv(
        processed / "tmdb_movies.csv",
        [
            {"tmdb_id": 999, "title": "Raw", "year": 2016, "genres": "Horror|Drama"},
            {"tmdb_id": 1000, "title": "The Wolf House", "year": 2018, "genres": "Animation"},
            {"tmdb_id": 1001, "title": "Unrated Film", "year": 2021, "genres": "Drama"},
            {"tmdb_id": 13, "title": "Forrest Gump", "year": 1994, "genres": "Drama"},
        ],
        ["tmdb_id", "title", "year", "genres"],
    )
    write_csv(
        processed / "movies_id_map.csv",
        [
            {"tmdb_id": 999, "movie_id": 10},
            {"tmdb_id": 1000, "movie_id": 20},
            {"tmdb_id": 1001, "movie_id": 30},
            {"tmdb_id": 13, "movie_id": 40},
        ],
        ["tmdb_id", "movie_id"],
    )
    return processed


def test_build_dataset_combina_ratings_watched_likes(tmp_path: Path) -> None:
    processed = _prepare_processed(tmp_path)
    dataset = build_dataset(processed, user_id="lothriik")

    assert len(dataset.movies) == 4
    assert len(dataset.ratings) == 3
    assert len(dataset.watchlist) == 1

    raw = dataset.ratings[dataset.ratings["tmdb_id"] == 999].iloc[0]
    assert raw["rating"] == 4.5
    assert bool(raw["liked"]) is True
    assert int(raw["movie_id"]) == 10

    unrated = dataset.ratings[dataset.ratings["tmdb_id"] == 1001].iloc[0]
    assert unrated["rating"] == 0.0
    assert unrated["source"] == "letterboxd_watched"

    assert dataset.meta["counts"]["ratings"] == 3
    assert dataset.meta["counts"]["ratings_matched"] == 3
    assert dataset.meta["rating_scale"]["max"] == 5.0
    assert dataset.meta["id_map_used"] is True


def test_load_dataset_apos_build(tmp_path: Path) -> None:
    processed = _prepare_processed(tmp_path)
    build_dataset(processed, user_id="lothriik")

    loaded = load_dataset(processed)

    assert loaded.loaded is True
    assert len(loaded.movies) == 4
    assert len(loaded.ratings) == 3
    assert loaded.user_ids == ["lothriik"]
    assert loaded.meta["counts"]["movies"] == 4
