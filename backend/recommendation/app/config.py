"""Configuração central do serviço (12-factor via variáveis de ambiente)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Raiz do pacote recommendation/ (dois níveis acima de app/config.py).
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Configurações carregadas de `.env` ou do ambiente do processo."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "screeK Intelligence Service"
    app_version: str = "0.1.0"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8081
    api_prefix: str = "/api/v1"

    # Origens permitidas no CORS (frontend Vite e app web).
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    # ------------------------------------------------------------------
    # Fonte de dados do recomendador
    # ------------------------------------------------------------------
    # "postgres" = produção (tabelas canônicas do Go core, read-only).
    # "csv"      = desenvolvimento/testes com o export normalizado offline.
    data_source: str = "csv"
    database_url: str = ""
    db_connect_timeout_seconds: int = 10

    # ------------------------------------------------------------------
    # Ferramentas de bootstrap (tools/). Não são usadas pelo runtime.
    # ------------------------------------------------------------------
    # TMDB
    tmdb_token: str = ""
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    tmdb_language: str = "en-US"
    tmdb_request_delay: float = 0.12
    tmdb_cache_ttl_days: int = 30
    tmdb_timeout_seconds: float = 20.0

    # Dados
    data_dir: Path = Field(default=BASE_DIR / "data")
    raw_dirname: str = "raw"
    cache_dirname: str = "cache"
    processed_dirname: str = "processed"

    # Escala canônica de notas (Letterboxd). 0 = assistido sem nota.
    rating_min: float = 0.5
    rating_max: float = 5.0
    rating_unrated: float = 0.0

    # Matching Letterboxd -> TMDB (apenas tools/)
    match_min_score: int = 70
    match_language: str = "en-US"
    match_year_tolerance: int = 2

    # Recomendação (placeholders; o motor é implementado pelo usuário).
    default_recommendation_limit: int = 20
    default_user_id: str = "local"

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / self.raw_dirname

    @property
    def cache_dir(self) -> Path:
        return self.data_dir / self.cache_dirname

    @property
    def processed_dir(self) -> Path:
        return self.data_dir / self.processed_dirname

    @property
    def tmdb_cache_dir(self) -> Path:
        return self.cache_dir / "tmdb"

    def ensure_directories(self) -> None:
        """Cria os diretórios de dados usados pelos scripts e pela API."""
        for directory in (
            self.data_dir,
            self.raw_dir,
            self.cache_dir,
            self.tmdb_cache_dir,
            self.processed_dir,
        ):
            directory.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Retorna a configuração singleton (cacheada)."""
    return Settings()


settings = get_settings()
