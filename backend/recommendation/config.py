"""Shim de compatibilidade para imports antigos de `config`."""

from __future__ import annotations

from app.config import BASE_DIR, Settings, get_settings, settings

__all__ = ["BASE_DIR", "Settings", "get_settings", "settings"]
