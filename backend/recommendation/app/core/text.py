"""Normalização de texto usada por dataset, features e ferramentas."""

from __future__ import annotations

import re
import unicodedata


def normalize_title(value: str | None) -> str:
    """Normaliza título para comparação: sem acento, pontuação ou caixa."""
    if not value:
        return ""
    text = unicodedata.normalize("NFKD", str(value))
    # "Godzilla × Kong" e "Godzilla x Kong" devem convergir.
    text = text.replace("×", " x ")
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
