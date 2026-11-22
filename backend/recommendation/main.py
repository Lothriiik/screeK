"""Shim de compatibilidade: mantém `python main.py` funcionando.

A implementação real vive em `app/`.
"""

from __future__ import annotations

from app.main import app

__all__ = ["app"]


if __name__ == "__main__":
    import uvicorn

    from app.config import get_settings

    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
