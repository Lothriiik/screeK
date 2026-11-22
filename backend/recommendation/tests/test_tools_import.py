"""Testes das ferramentas de bootstrap (fora do runtime da API)."""

from __future__ import annotations

from pathlib import Path

from app.config import Settings
from tools.import_service import import_letterboxd, save_uploaded_export


def test_import_letterboxd_zip(letterboxd_zip: Path, tmp_path: Path) -> None:
    settings = Settings(data_dir=tmp_path / "data", debug=False)

    result = import_letterboxd(letterboxd_zip, settings=settings)

    assert result["ratings_count"] == 2
    assert result["watched_count"] == 2
    assert result["watchlist_count"] == 1
    assert result["user_id"] == "lothriik"
    assert (settings.processed_dir / "letterboxd_ratings.csv").exists()


def test_save_uploaded_export_persiste_bytes(tmp_path: Path) -> None:
    settings = Settings(data_dir=tmp_path / "data", debug=False)

    path = save_uploaded_export("ratings.csv", b"Date,Name\n", settings=settings)

    assert path.exists()
    assert path.read_bytes() == b"Date,Name\n"
    assert path.parent == settings.raw_dir / "uploads"
