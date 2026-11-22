"""Leitura e normalização do export do Letterboxd.

O export oficial é um `.zip` com vários CSVs. Este módulo aceita tanto o zip
quanto uma pasta já extraída, normaliza nomes de colunas e grava artefatos
prontos para o matcher e para o dataset.
"""

from __future__ import annotations

import logging
import shutil
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from app.core.constants import (
    DIARY_COLUMNS,
    LETTERBOXD_LIKES_COLUMNS,
    LETTERBOXD_RATING_COLUMNS,
    LETTERBOXD_WATCHED_COLUMNS,
    LETTERBOXD_WATCHLIST_COLUMNS,
    REVIEW_COLUMNS,
    is_valid_rating,
)

logger = logging.getLogger(__name__)

COLUMN_ALIASES = {
    "Letterboxd URI": "letterboxd_uri",
    "Watched Date": "watched_date",
    "Date": "date",
    "Name": "name",
    "Year": "year",
    "Rating": "rating",
    "Rewatch": "rewatch",
    "Tags": "tags",
    "Review": "review",
}

EMPTY_FRAMES = {
    "ratings.csv": LETTERBOXD_RATING_COLUMNS,
    "watched.csv": LETTERBOXD_WATCHED_COLUMNS,
    "watchlist.csv": LETTERBOXD_WATCHLIST_COLUMNS,
    "diary.csv": DIARY_COLUMNS,
    "reviews.csv": REVIEW_COLUMNS,
    "likes.csv": LETTERBOXD_LIKES_COLUMNS,
}


@dataclass
class LetterboxdExport:
    """Representa um export já normalizado."""

    ratings: pd.DataFrame
    watched: pd.DataFrame
    watchlist: pd.DataFrame
    likes: pd.DataFrame
    diary: pd.DataFrame
    reviews: pd.DataFrame
    profile: pd.DataFrame
    source: Path | None = None
    warnings: list[str] = field(default_factory=list)

    @property
    def summary(self) -> dict[str, int]:
        return {
            "ratings": len(self.ratings),
            "watched": len(self.watched),
            "watchlist": len(self.watchlist),
            "likes": len(self.likes),
            "diary": len(self.diary),
            "reviews": len(self.reviews),
        }


def _read_csv(path: Path) -> pd.DataFrame:
    """Lê CSV tolerando BOM e mantendo valores vazios como string vazia."""
    return pd.read_csv(
        path,
        dtype=str,
        keep_default_na=False,
        encoding="utf-8-sig",
    )


def _normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    renamed = frame.rename(columns={k: v for k, v in COLUMN_ALIASES.items() if k in frame.columns})
    renamed.columns = [str(column).strip().lower().replace(" ", "_") for column in renamed.columns]
    return renamed


def _to_int(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series.replace("", pd.NA), errors="coerce")
    return numeric.astype("Int64")


def _to_float(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series.replace("", pd.NA), errors="coerce").astype(float)


def _to_bool(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip().str.lower().isin({"yes", "true", "1"})


def _normalize_common(frame: pd.DataFrame) -> pd.DataFrame:
    frame = _normalize_columns(frame).copy()

    for column in ("date", "watched_date"):
        if column in frame.columns:
            frame[column] = frame[column].astype(str).str.strip().replace({"nan": ""})

    if "name" in frame.columns:
        frame["name"] = frame["name"].astype(str).str.strip()
    if "year" in frame.columns:
        frame["year"] = _to_int(frame["year"])
    if "rating" in frame.columns:
        frame["rating"] = _to_float(frame["rating"])
    if "rewatch" in frame.columns:
        frame["rewatch"] = _to_bool(frame["rewatch"])
    if "letterboxd_uri" in frame.columns:
        frame["letterboxd_uri"] = frame["letterboxd_uri"].astype(str).str.strip()

    return frame


def _dedupe(frame: pd.DataFrame, subset: list[str]) -> pd.DataFrame:
    if frame.empty:
        return frame
    existing = [column for column in subset if column in frame.columns]
    if not existing:
        return frame
    return frame.drop_duplicates(subset=existing, keep="last").reset_index(drop=True)


def parse_ratings(path: Path) -> pd.DataFrame:
    """Lê ratings.csv e mantém apenas notas válidas na escala 0.5–5.0."""
    frame = _normalize_common(_read_csv(path))

    missing = [column for column in ("name", "rating") if column not in frame.columns]
    if missing:
        raise ValueError(f"ratings.csv sem colunas obrigatórias: {missing}")

    before = len(frame)
    frame = frame[frame["rating"].apply(is_valid_rating)].copy()
    dropped = before - len(frame)
    if dropped:
        logger.warning("Descartadas %d linhas de ratings com nota inválida", dropped)

    frame = _dedupe(frame, ["letterboxd_uri"])
    frame = _dedupe(frame, ["name", "year"])

    for column in LETTERBOXD_RATING_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[LETTERBOXD_RATING_COLUMNS].reset_index(drop=True)


def parse_watched(path: Path) -> pd.DataFrame:
    frame = _normalize_common(_read_csv(path))
    frame = _dedupe(frame, ["letterboxd_uri"])
    for column in LETTERBOXD_WATCHED_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[LETTERBOXD_WATCHED_COLUMNS].reset_index(drop=True)


def parse_watchlist(path: Path) -> pd.DataFrame:
    frame = _normalize_common(_read_csv(path))
    frame = _dedupe(frame, ["letterboxd_uri"])
    for column in LETTERBOXD_WATCHLIST_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[LETTERBOXD_WATCHLIST_COLUMNS].reset_index(drop=True)


def parse_likes(path: Path) -> pd.DataFrame:
    frame = _normalize_common(_read_csv(path))
    frame = _dedupe(frame, ["letterboxd_uri"])
    for column in LETTERBOXD_LIKES_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[LETTERBOXD_LIKES_COLUMNS].reset_index(drop=True)


def parse_diary(path: Path) -> pd.DataFrame:
    frame = _normalize_common(_read_csv(path))
    frame = _dedupe(frame, ["letterboxd_uri", "watched_date"])
    for column in DIARY_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[DIARY_COLUMNS].reset_index(drop=True)


def parse_reviews(path: Path) -> pd.DataFrame:
    frame = _normalize_common(_read_csv(path))
    for column in REVIEW_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA
    return frame[REVIEW_COLUMNS].reset_index(drop=True)


def parse_profile(path: Path) -> pd.DataFrame:
    return _normalize_columns(_read_csv(path))


def _empty_frame(name: str) -> pd.DataFrame:
    return pd.DataFrame(columns=EMPTY_FRAMES[name])


def _find_export_dir(root: Path) -> Path:
    """O zip do Letterboxd costuma ter uma pasta raiz; encontra onde estão os CSVs."""
    if any((root / filename).exists() for filename in EMPTY_FRAMES):
        return root
    candidates = [path.parent for path in root.rglob("ratings.csv")]
    if candidates:
        return candidates[0]
    return root


def load_export(source: str | Path, extract_to: Path | None = None) -> LetterboxdExport:
    """Carrega um export do Letterboxd a partir de um `.zip` ou diretório.

    Args:
        source: caminho do zip ou da pasta extraída.
        extract_to: destino opcional para extrair o zip (persistido em disco).
    """
    source = Path(source)
    if not source.exists():
        raise FileNotFoundError(f"Export do Letterboxd não encontrado: {source}")

    warnings: list[str] = []
    temp_dir: tempfile.TemporaryDirectory[str] | None = None
    root = source

    if source.is_file():
        if source.suffix.lower() != ".zip":
            raise ValueError("O export deve ser um .zip ou um diretório com os CSVs")

        if extract_to is not None:
            extract_to.mkdir(parents=True, exist_ok=True)
            root = extract_to
        else:
            temp_dir = tempfile.TemporaryDirectory(prefix="letterboxd_")
            root = Path(temp_dir.name)

        with zipfile.ZipFile(source) as archive:
            archive.extractall(root)
        root = _find_export_dir(root)

    frames: dict[str, pd.DataFrame] = {}
    parsers = {
        "ratings.csv": parse_ratings,
        "watched.csv": parse_watched,
        "watchlist.csv": parse_watchlist,
        "diary.csv": parse_diary,
        "reviews.csv": parse_reviews,
    }

    for filename, parser in parsers.items():
        path = root / filename
        if path.exists():
            frames[filename] = parser(path)
        else:
            warnings.append(f"{filename} não encontrado; usando tabela vazia")
            frames[filename] = _empty_frame(filename)

    # Likes ficam em likes/films.csv no export oficial.
    likes_path = root / "likes" / "films.csv"
    if not likes_path.exists():
        likes_path = root / "likes.csv"
    if likes_path.exists():
        frames["likes.csv"] = parse_likes(likes_path)
    else:
        warnings.append("likes/films.csv não encontrado; usando tabela vazia")
        frames["likes.csv"] = _empty_frame("likes.csv")

    profile_path = root / "profile.csv"
    profile = parse_profile(profile_path) if profile_path.exists() else pd.DataFrame()
    if profile.empty:
        warnings.append("profile.csv não encontrado; user_id padrão será usado")

    export = LetterboxdExport(
        ratings=frames["ratings.csv"],
        watched=frames["watched.csv"],
        watchlist=frames["watchlist.csv"],
        likes=frames["likes.csv"],
        diary=frames["diary.csv"],
        reviews=frames["reviews.csv"],
        profile=profile,
        source=source,
        warnings=warnings,
    )

    # Libera o diretório temporário somente após tudo ser lido em memória.
    if temp_dir is not None:
        shutil.rmtree(temp_dir.name, ignore_errors=True)

    return export


def save_normalized(export: LetterboxdExport, output_dir: str | Path) -> dict[str, Path]:
    """Grava os CSVs normalizados e devolve os caminhos gerados."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    outputs = {
        "ratings": output_dir / "letterboxd_ratings.csv",
        "watched": output_dir / "letterboxd_watched.csv",
        "watchlist": output_dir / "letterboxd_watchlist.csv",
        "likes": output_dir / "letterboxd_likes.csv",
        "diary": output_dir / "letterboxd_diary.csv",
        "reviews": output_dir / "letterboxd_reviews.csv",
        "profile": output_dir / "letterboxd_profile.csv",
    }

    export.ratings.to_csv(outputs["ratings"], index=False)
    export.watched.to_csv(outputs["watched"], index=False)
    export.watchlist.to_csv(outputs["watchlist"], index=False)
    export.likes.to_csv(outputs["likes"], index=False)
    export.diary.to_csv(outputs["diary"], index=False)
    export.reviews.to_csv(outputs["reviews"], index=False)
    export.profile.to_csv(outputs["profile"], index=False)

    return outputs


def infer_user_id(export: LetterboxdExport, fallback: str = "local") -> str:
    """Extrai o username do profile.csv, quando disponível."""
    if export.profile.empty:
        return fallback
    for column in ("username", "Username"):
        if column in export.profile.columns:
            value = str(export.profile.iloc[0][column]).strip()
            if value and value.lower() != "nan":
                return value
    return fallback
