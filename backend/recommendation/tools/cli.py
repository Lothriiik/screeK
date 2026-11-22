"""CLI de bootstrap do screeK Intelligence.

Estas operações são de desenvolvimento/onboarding. Em produção, o Go core é
quem importa o Letterboxd e casa com o TMDB; o serviço Python só recomenda.

Uso:
    python -m tools.cli ingest --export data/raw/letterboxd
    python -m tools.cli match --limit 20
    python -m tools.cli details --limit 20
    python -m tools.cli dataset
    python -m tools.cli all --limit 20
    python -m tools.cli serve
    python -m tools.cli doctor
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import pandas as pd

from app.config import Settings, get_settings
from app.data.dataset import build_dataset
from app.data.source import get_data_source
from tools.import_service import import_letterboxd
from tools.matching import (
    fetch_movie_details,
    match_ratings,
    summarize_matches,
)
from tools.tmdb import TMDBClient

logger = logging.getLogger(__name__)


def _settings() -> Settings:
    settings = get_settings()
    settings.ensure_directories()
    return settings


def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} não existe. Rode primeiro: python -m tools.cli ingest --export <caminho>"
        )
    return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")


MATCH_INPUT_FILES = (
    "letterboxd_ratings.csv",
    "letterboxd_watched.csv",
    "letterboxd_watchlist.csv",
    "letterboxd_likes.csv",
)


def _load_match_inputs(settings: Settings) -> pd.DataFrame:
    """Une ratings/watched/watchlist/likes para casar todos os títulos uma vez."""
    frames: list[pd.DataFrame] = []
    for filename in MATCH_INPUT_FILES:
        path = settings.processed_dir / filename
        if not path.exists():
            continue
        frame = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
        if frame.empty:
            continue
        frames.append(frame[["name", "year", "letterboxd_uri"]])

    if not frames:
        raise FileNotFoundError(
            "Nenhum CSV normalizado encontrado. "
            "Rode primeiro: python -m tools.cli ingest --export <caminho>"
        )

    combined = pd.concat(frames, ignore_index=True)
    combined = combined[combined["letterboxd_uri"].astype(str).str.strip() != ""]
    return combined.drop_duplicates(subset=["letterboxd_uri"], keep="last")


def cmd_ingest(args: argparse.Namespace) -> int:
    settings = _settings()
    result = import_letterboxd(args.export, settings=settings, user_id=args.user_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def cmd_match(args: argparse.Namespace) -> int:
    settings = _settings()
    titles = _load_match_inputs(settings)
    matches_path = settings.processed_dir / "matches.csv"

    with TMDBClient.from_settings(settings) as client:
        matches = match_ratings(
            client,
            titles,
            matches_path,
            limit=args.limit,
            force=args.force,
            min_score=args.min_score or settings.match_min_score,
            year_tolerance=settings.match_year_tolerance,
        )

    print(json.dumps(summarize_matches(matches), ensure_ascii=False, indent=2))
    return 0


def cmd_details(args: argparse.Namespace) -> int:
    settings = _settings()
    matches = _read_csv(settings.processed_dir / "matches.csv")

    with TMDBClient.from_settings(settings) as client:
        movies = fetch_movie_details(
            client,
            matches,
            settings.processed_dir / "tmdb_movies.csv",
            limit=args.limit,
            force=args.force,
        )

    print(f"Filmes com metadados: {len(movies)}")
    return 0


def cmd_dataset(args: argparse.Namespace) -> int:
    settings = _settings()
    dataset = build_dataset(
        settings.processed_dir,
        user_id=args.user_id,
        id_map_path=args.id_map,
    )
    print(json.dumps(dataset.meta, ensure_ascii=False, indent=2))
    return 0


def cmd_all(args: argparse.Namespace) -> int:
    settings = _settings()

    if args.export:
        import_letterboxd(args.export, settings=settings, user_id=args.user_id)

    titles = _load_match_inputs(settings)
    matches_path = settings.processed_dir / "matches.csv"

    with TMDBClient.from_settings(settings) as client:
        matches = match_ratings(
            client,
            titles,
            matches_path,
            limit=args.limit,
            force=args.force,
            min_score=args.min_score or settings.match_min_score,
            year_tolerance=settings.match_year_tolerance,
        )
        fetch_movie_details(
            client,
            matches,
            settings.processed_dir / "tmdb_movies.csv",
            limit=args.limit,
            force=args.force,
        )

    dataset = build_dataset(
        settings.processed_dir,
        user_id=args.user_id,
        id_map_path=args.id_map,
    )
    print(json.dumps(dataset.meta, ensure_ascii=False, indent=2))
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    settings = _settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=args.port or settings.port,
        reload=args.reload,
    )
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    settings = _settings()
    dataset = get_data_source(settings).load()

    cache_files = (
        len(list(settings.tmdb_cache_dir.rglob("*.json")))
        if settings.tmdb_cache_dir.exists()
        else 0
    )
    info = {
        "data_source": settings.data_source,
        "database_url_configured": bool(settings.database_url),
        "data_dir": str(settings.data_dir),
        "raw_dir": str(settings.raw_dir),
        "processed_dir": str(settings.processed_dir),
        "tmdb_token_configured": bool(settings.tmdb_token),
        "tmdb_cache_files": cache_files,
        "dataset_loaded": dataset.loaded,
        "dataset_key_column": dataset.key_column,
        "dataset_movies": len(dataset.movies),
        "dataset_ratings": len(dataset.ratings),
        "dataset_meta": dataset.meta,
        "engine_ready": dataset.engine_ready,
        "processed_files": sorted(
            path.name for path in settings.processed_dir.glob("*") if path.is_file()
        ),
    }
    print(json.dumps(info, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m tools.cli", description="screeK Intelligence CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest = subparsers.add_parser("ingest", help="Normaliza um export do Letterboxd")
    ingest.add_argument("--export", required=True, help="Pasta extraída ou arquivo .zip/.csv")
    ingest.add_argument("--user-id", default=None)
    ingest.set_defaults(func=cmd_ingest)

    match = subparsers.add_parser("match", help="Faz matching Letterboxd -> TMDB")
    match.add_argument("--limit", type=int, default=0, help="0 = todos")
    match.add_argument("--force", action="store_true", help="Ignora cache e refaz o matching")
    match.add_argument("--min-score", type=int, default=None)
    match.set_defaults(func=cmd_match)

    details = subparsers.add_parser("details", help="Baixa metadados dos filmes casados")
    details.add_argument("--limit", type=int, default=0, help="0 = todos")
    details.add_argument("--force", action="store_true")
    details.set_defaults(func=cmd_details)

    dataset = subparsers.add_parser("dataset", help="Monta movies.csv/ratings.csv finais")
    dataset.add_argument("--user-id", default=None)
    dataset.add_argument("--id-map", default=None, help="CSV tmdb_id,movie_id exportado do Postgres")
    dataset.set_defaults(func=cmd_dataset)

    all_cmd = subparsers.add_parser("all", help="Ingest + match + details + dataset")
    all_cmd.add_argument("--export", default=None)
    all_cmd.add_argument("--user-id", default=None)
    all_cmd.add_argument("--id-map", default=None)
    all_cmd.add_argument("--limit", type=int, default=0)
    all_cmd.add_argument("--force", action="store_true")
    all_cmd.add_argument("--min-score", type=int, default=None)
    all_cmd.set_defaults(func=cmd_all)

    serve = subparsers.add_parser("serve", help="Sobe a API FastAPI")
    serve.add_argument("--port", type=int, default=None)
    serve.add_argument("--reload", action="store_true")
    serve.set_defaults(func=cmd_serve)

    doctor = subparsers.add_parser("doctor", help="Diagnóstico de ambiente e dataset")
    doctor.set_defaults(func=cmd_doctor)

    return parser


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
