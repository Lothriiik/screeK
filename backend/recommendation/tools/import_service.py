"""Importação do export do Letterboxd (zip ou CSV) para `data/processed`."""

from __future__ import annotations

import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from app.config import Settings, get_settings
from tools.letterboxd import infer_user_id, load_export, save_normalized

logger = logging.getLogger(__name__)

KNOWN_CSV_NAMES = {
    "ratings.csv",
    "watched.csv",
    "watchlist.csv",
    "diary.csv",
    "reviews.csv",
    "profile.csv",
    "films.csv",
}


def _safe_name(filename: str) -> str:
    name = Path(filename).name
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", name) or "letterboxd_export"


def save_uploaded_export(filename: str, content: bytes, settings: Settings | None = None) -> Path:
    """Persiste o upload em `data/raw/uploads` e devolve o caminho."""
    settings = settings or get_settings()
    settings.ensure_directories()

    upload_dir = settings.raw_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    target = upload_dir / f"{stamp}_{_safe_name(filename)}"
    target.write_bytes(content)
    return target


def _prepare_csv_source(path: Path) -> Path:
    """Transforma um CSV solto em uma pasta compatível com `load_export`."""
    directory = path.parent / f"{path.stem}_as_export"
    directory.mkdir(parents=True, exist_ok=True)

    filename = path.name.lower()
    if filename not in KNOWN_CSV_NAMES:
        filename = "ratings.csv"

    destination = directory / filename
    if destination != path:
        destination.write_bytes(path.read_bytes())
    return directory


def import_letterboxd(
    source: str | Path,
    *,
    settings: Settings | None = None,
    user_id: str | None = None,
) -> dict[str, object]:
    """Normaliza um export e grava os CSVs em `data/processed`."""
    settings = settings or get_settings()
    settings.ensure_directories()

    source_path = Path(source)
    if source_path.suffix.lower() == ".csv":
        source_path = _prepare_csv_source(source_path)

    extract_to = None
    if source_path.is_file() and source_path.suffix.lower() == ".zip":
        stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        extract_to = settings.raw_dir / f"letterboxd_{stamp}"

    export = load_export(source_path, extract_to=extract_to)
    outputs = save_normalized(export, settings.processed_dir)
    resolved_user_id = user_id or infer_user_id(export, settings.default_user_id)

    summary = export.summary
    logger.info("Export importado: %s", summary)

    return {
        "imported_count": summary["ratings"],
        "ratings_count": summary["ratings"],
        "watched_count": summary["watched"],
        "watchlist_count": summary["watchlist"],
        "diary_count": summary["diary"],
        "reviews_count": summary["reviews"],
        "export_path": str(outputs["ratings"].parent),
        "warnings": export.warnings,
        "user_id": resolved_user_id,
    }
