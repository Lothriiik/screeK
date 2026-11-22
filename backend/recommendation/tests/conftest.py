"""Fixtures compartilhadas dos testes."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pandas as pd
import pytest


def write_csv(path: Path, rows: list[dict[str, object]], columns: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows, columns=columns).to_csv(path, index=False)


@pytest.fixture
def letterboxd_dir(tmp_path: Path) -> Path:
    export = tmp_path / "letterboxd-export"
    export.mkdir()

    write_csv(
        export / "ratings.csv",
        [
            {
                "Date": "2024-01-01",
                "Name": "Raw",
                "Year": 2016,
                "Letterboxd URI": "https://boxd.it/raw",
                "Rating": 4.5,
            },
            {
                "Date": "2024-01-02",
                "Name": "The Wolf House",
                "Year": 2018,
                "Letterboxd URI": "https://boxd.it/wolf",
                "Rating": 5,
            },
            {
                "Date": "2024-01-03",
                "Name": "Bad Rating",
                "Year": 2020,
                "Letterboxd URI": "https://boxd.it/bad",
                "Rating": 9,
            },
        ],
        ["Date", "Name", "Year", "Letterboxd URI", "Rating"],
    )
    write_csv(
        export / "watched.csv",
        [
            {
                "Date": "2024-01-01",
                "Name": "Raw",
                "Year": 2016,
                "Letterboxd URI": "https://boxd.it/raw",
            },
            {
                "Date": "2024-01-04",
                "Name": "Unrated Film",
                "Year": 2021,
                "Letterboxd URI": "https://boxd.it/unrated",
            },
        ],
        ["Date", "Name", "Year", "Letterboxd URI"],
    )
    write_csv(
        export / "watchlist.csv",
        [
            {
                "Date": "2024-02-01",
                "Name": "Forrest Gump",
                "Year": 1994,
                "Letterboxd URI": "https://boxd.it/gump",
            }
        ],
        ["Date", "Name", "Year", "Letterboxd URI"],
    )
    write_csv(
        export / "diary.csv",
        [
            {
                "Date": "2024-01-01",
                "Name": "Raw",
                "Year": 2016,
                "Letterboxd URI": "https://boxd.it/raw",
                "Rating": 4.5,
                "Rewatch": "No",
                "Tags": "",
                "Watched Date": "2024-01-01",
            }
        ],
        ["Date", "Name", "Year", "Letterboxd URI", "Rating", "Rewatch", "Tags", "Watched Date"],
    )
    write_csv(
        export / "reviews.csv",
        [
            {
                "Date": "2024-01-01",
                "Name": "Raw",
                "Year": 2016,
                "Letterboxd URI": "https://boxd.it/raw",
                "Rating": 4.5,
                "Rewatch": "No",
                "Review": "Intenso.",
                "Tags": "",
                "Watched Date": "2024-01-01",
            }
        ],
        [
            "Date",
            "Name",
            "Year",
            "Letterboxd URI",
            "Rating",
            "Rewatch",
            "Review",
            "Tags",
            "Watched Date",
        ],
    )
    write_csv(
        export / "likes" / "films.csv",
        [
            {
                "Date": "2024-01-01",
                "Name": "Raw",
                "Year": 2016,
                "Letterboxd URI": "https://boxd.it/raw",
            }
        ],
        ["Date", "Name", "Year", "Letterboxd URI"],
    )
    write_csv(
        export / "profile.csv",
        [
            {
                "Date Joined": "2022-01-01",
                "Username": "lothriik",
                "Given Name": "Jose",
            }
        ],
        ["Date Joined", "Username", "Given Name"],
    )
    return export


@pytest.fixture
def letterboxd_zip(letterboxd_dir: Path, tmp_path: Path) -> Path:
    zip_path = tmp_path / "letterboxd.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        for path in letterboxd_dir.rglob("*"):
            if path.is_file():
                archive.write(path, arcname=f"letterboxd-export/{path.relative_to(letterboxd_dir)}")
    return zip_path


@pytest.fixture
def zip_bytes(letterboxd_dir: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for path in letterboxd_dir.rglob("*"):
            if path.is_file():
                archive.write(path, arcname=f"letterboxd-export/{path.relative_to(letterboxd_dir)}")
    return buffer.getvalue()
