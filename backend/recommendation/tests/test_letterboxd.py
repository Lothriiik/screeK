"""Testes do parser e da normalização do Letterboxd."""

from __future__ import annotations

from pathlib import Path

from tools.letterboxd import infer_user_id, load_export, save_normalized


def test_load_export_normaliza_e_filtra_notas(letterboxd_dir: Path) -> None:
    export = load_export(letterboxd_dir)

    assert len(export.ratings) == 2
    assert set(export.ratings["name"]) == {"Raw", "The Wolf House"}
    assert export.ratings["rating"].max() == 5.0
    assert len(export.watched) == 2
    assert len(export.watchlist) == 1
    assert len(export.likes) == 1
    assert infer_user_id(export) == "lothriik"


def test_load_export_de_zip(letterboxd_zip: Path) -> None:
    export = load_export(letterboxd_zip)

    assert len(export.ratings) == 2
    assert export.warnings == []


def test_save_normalized_grava_artefatos(letterboxd_dir: Path, tmp_path: Path) -> None:
    export = load_export(letterboxd_dir)
    outputs = save_normalized(export, tmp_path / "processed")

    assert outputs["ratings"].exists()
    assert outputs["likes"].exists()
    assert outputs["ratings"].name == "letterboxd_ratings.csv"

    saved = outputs["ratings"].read_text(encoding="utf-8")
    assert "Raw" in saved
    assert "Bad Rating" not in saved
