"""Shim de compatibilidade: o motor real vive em app/recommender/engine.py."""

from __future__ import annotations

from app.recommender.engine import EngineNotImplementedError, RecommendationEngine

engine = RecommendationEngine()

__all__ = ["EngineNotImplementedError", "RecommendationEngine", "engine"]
