"""Shim de compatibilidade para `python -m app.cli`.

O CLI real (ingest, match, details, dataset, all, serve, doctor) vive em
`tools/cli.py`, porque essas operações são de bootstrap e não do runtime do
serviço de recomendação.
"""

from __future__ import annotations

from tools.cli import build_parser, main

__all__ = ["build_parser", "main"]


if __name__ == "__main__":
    raise SystemExit(main())
