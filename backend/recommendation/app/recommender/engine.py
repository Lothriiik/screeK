"""Motor de recomendação do ScreeK.

Implementação completa:
- Features por grupos ponderados (gênero, diretor, keywords, elenco, etc.).
- Armazenamento em memória (cache) da matriz de features.
- Busca de filmes similares (item-to-item) com explicação de motivos.
- Construção de grafo de filmes com arestas semânticas (BFS kNN).
- Perfil do usuário com notas centradas (-2.0 a +2.0).
- Ranqueamento personalizado com boost de Watchlist e Niche Breakers.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from app.data.dataset import Dataset
from app.data.features import (
    ContentFeatures,
    build_content_features,
    build_movie_graph,
    explain_connection,
    similar_by_content,
)
from app.recommender.base import Recommendation
from app.recommender.profile import build_user_vector

logger = logging.getLogger(__name__)


class EngineNotImplementedError(RuntimeError):
    """Levantado quando um método específico ainda não foi implementado."""


class RecommendationEngine:
    """Motor de recomendação baseado em conteúdo e regras de negócio."""

    name = "screek-content-engine"

    def __init__(self) -> None:
        # Cache em memória da matriz TF-IDF do catálogo.
        self._features: ContentFeatures | None = None
        self._features_key_col: str | None = None
        self._features_movie_count: int = 0

    def invalidate_cache(self) -> None:
        """Limpa o cache em memória para forçar reconstrução na próxima requisição."""
        logger.info("Invalidando cache da matriz de features TF-IDF.")
        self._features = None
        self._features_key_col = None
        self._features_movie_count = 0

    @property
    def is_ready(self) -> bool:
        """Indica se o motor está ativo e apto a receber requisições."""
        return True

    def _ensure_features(self, dataset: Dataset) -> ContentFeatures:
        """Garante que a matriz de features está em memória.

        Se o catálogo mudou (número de filmes diferente ou coluna de ID diferente)
        ou se é a primeira execução, reconstrói o TF-IDF uma única vez.
        """
        current_count = len(dataset.movies)
        current_key = dataset.key_column

        # Se já estiver em memória e o dataset não mudou, reutiliza o cache!
        if (
            self._features is not None
            and self._features_key_col == current_key
            and self._features_movie_count == current_count
        ):
            return self._features

        logger.info(
            "Construindo matriz de features TF-IDF ponderada para %d filmes (chave: %s)...",
            current_count,
            current_key,
        )
        self._features = build_content_features(dataset.movies, key_column=current_key)
        self._features_key_col = current_key
        self._features_movie_count = current_count
        return self._features

    def warm_up(self, dataset: Dataset) -> None:
        self._ensure_features(dataset)

    def similar_movies(
        self,
        movie_id: int,
        dataset: Dataset,
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        """Recomenda filmes parecidos com `movie_id` com justificativa dinâmica."""
        if dataset.movies.empty:
            return []

        features = self._ensure_features(dataset)
        # Busca candidatos extras porque aplicamos regras de duração e diversidade
        # depois do ranking de conteúdo.
        candidate_limit = min(len(features.movie_keys), max(limit * 10, limit))
        similar_items = similar_by_content(features, movie_id, limit=candidate_limit)

        recommendations: list[Recommendation] = []
        key_col = dataset.key_column
        source = dataset.find_movie(movie_id, id_type=dataset.id_type)
        source_directors = _director_names(source.get("director", "") if source is not None else "")
        max_same_director = max(1, (limit + 4) // 5)
        same_director_count = 0

        for candidate_key, score in similar_items:
            row = dataset.find_movie(candidate_key, id_type=dataset.id_type)
            if row is None:
                continue

            # Descarta curtas-metragens conhecidos (< 60 min), preservando filmes sem duração cadastrada.
            if not _is_feature_length(row):
                continue

            candidate_directors = _director_names(row.get("director", ""))
            shares_director = bool(source_directors & candidate_directors)
            if shares_director and same_director_count >= max_same_director:
                continue

            tmdb_id: int | None = None

            if row is not None and "tmdb_id" in row and pd.notna(row["tmdb_id"]):
                tmdb_id = int(row["tmdb_id"])
            elif key_col == "tmdb_id":
                tmdb_id = candidate_key

            # Identifica o motivo específico da conexão
            explanation = explain_connection(features, movie_id, candidate_key)
            reason = explanation.get("reason", "Similar em temática, gênero e direção")

            recommendations.append(
                Recommendation(
                    movie_id=candidate_key,
                    score=round(float(score), 4),
                    tmdb_id=tmdb_id,
                    reason=reason,
                    is_niche_breaker=False,
                )
            )
            if shares_director:
                same_director_count += 1
            if len(recommendations) >= limit:
                break

        return recommendations


    def movie_graph(
        self,
        movie_id: int,
        dataset: Dataset,
        *,
        depth: int = 2,
        branching: int = 4,
        min_score: float = 0.15,
    ) -> dict[str, Any]:
        """Gera o grafo kNN explicável de vizinhança para o filme."""
        features = self._ensure_features(dataset)
        return build_movie_graph(
            features,
            dataset,
            movie_id,
            depth=depth,
            branching=branching,
            min_score=min_score,
        )

    def recommend_for_user(
        self,
        user_id: str,
        dataset: Dataset,
        *,
        limit: int = 20,
        genre: str | None = None,
        min_year: int | None = None,
        max_year: int | None = None,
        in_theaters: bool = False,
        now_playing_ids: set[int] | None = None,
        feedback: dict[int, str] | None = None,
    ) -> list[Recommendation]:
        """Gera recomendações personalizadas para o usuário.

        1. Filtra histórico de notas e watchlist do usuário.
        2. Constrói o vetor do usuário com notas ponderadas.
        3. Calcula score de afinidade com todo o catálogo (cosine similarity).
        4. Exclui filmes já vistos.
        5. Aplica filtros opcionais (gênero, ano, em cartaz nos cinemas).
        6. Aplica boost de Watchlist (+25%).
        7. Injeta Niche Breakers de cinema não-anglófono (~20%).
        8. Preenche a justificativa ('reason') de cada recomendação.
        """
        if dataset.movies.empty:
            return []

        features = self._ensure_features(dataset)
        key_col = dataset.key_column

        # 1. Filtra avaliações do usuário
        user_ratings = pd.DataFrame()
        if not dataset.ratings.empty and "user_id" in dataset.ratings.columns:
            mask = dataset.ratings["user_id"].astype(str).str.lower() == user_id.lower()
            user_ratings = dataset.ratings[mask]

        feedback = feedback or {}
        if feedback:
            feedback_rows = pd.DataFrame([
                {key_col: movie_id, "user_id": user_id,
                 "rating": 4.5 if value == "interested" else 1.0,
                 "liked": value == "interested", "watched": False}
                for movie_id, value in feedback.items()
            ])
            user_ratings = pd.concat([user_ratings, feedback_rows], ignore_index=True)

        # 2. Guarda IDs já assistidos/avaliados para não recomendar novamente
        watched_keys: set[int] = set()
        if not user_ratings.empty and key_col in user_ratings.columns:
            watched_keys = set(
                pd.to_numeric(user_ratings[key_col], errors="coerce").dropna().astype(int)
            )

        # 3. Guarda IDs que estão na Watchlist
        watchlist_keys: set[int] = set()
        if not dataset.watchlist.empty and "user_id" in dataset.watchlist.columns:
            wl_mask = dataset.watchlist["user_id"].astype(str).str.lower() == user_id.lower()
            user_wl = dataset.watchlist[wl_mask]
            if not user_wl.empty and key_col in user_wl.columns:
                watchlist_keys = set(
                    pd.to_numeric(user_wl[key_col], errors="coerce").dropna().astype(int)
                )

        # 4. Constrói o perfil do usuário
        user_vector = build_user_vector(user_ratings, features, key_column=key_col)

        # 5. Cold-Start: Se o usuário não tem histórico suficiente, recomenda os melhores do catálogo
        if user_vector is None:
            return self._fallback_popular_recommendations(dataset, watched_keys, limit=limit)

        # 6. Calcula a similaridade contra o catálogo completo
        raw_scores = cosine_similarity(user_vector, features.matrix).ravel()

        # Evita procurar cada ID filtrando o DataFrame inteiro dentro do loop
        # (13 mil candidatos faziam isso virar uma busca quadrática).
        movie_rows: dict[int, dict[str, Any]] = {}
        for row in dataset.movies.to_dict(orient="records"):
            raw_key = pd.to_numeric(row.get(key_col), errors="coerce")
            if pd.notna(raw_key):
                movie_rows[int(raw_key)] = row

        positive_history: list[tuple[int, float]] = []
        if not user_ratings.empty and key_col in user_ratings.columns:
            for _, history_row in user_ratings.iterrows():
                raw_id = pd.to_numeric(history_row.get(key_col), errors="coerce")
                if pd.isna(raw_id):
                    continue
                rating = pd.to_numeric(history_row.get("rating"), errors="coerce")
                weight = float(rating) if pd.notna(rating) else (4.0 if bool(history_row.get("liked", False)) else 3.25)
                if weight >= 3.5:
                    positive_history.append((int(raw_id), weight))
        positive_history.sort(key=lambda pair: pair[1], reverse=True)
        positive_history = positive_history[:8]

        candidates: list[dict[str, Any]] = []
        for idx, score in enumerate(raw_scores):
            candidate_key = features.movie_keys[idx]
            if candidate_key in watched_keys:
                continue
            if feedback.get(candidate_key) == "not_interested":
                continue

            movie_row = movie_rows.get(candidate_key)
            if not _is_feature_length(movie_row):
                continue

            # Filtro opcional Ingresso.com: apenas em cartaz nos cinemas
            is_now_playing = False
            if now_playing_ids is not None:
                is_now_playing = candidate_key in now_playing_ids
            elif movie_row is not None and "in_theaters" in movie_row:
                is_now_playing = bool(movie_row.get("in_theaters"))

            if in_theaters and not is_now_playing:
                continue

            # Filtro opcional por gênero
            if genre and movie_row is not None:
                movie_genres = str(movie_row.get("genres", "")).lower()
                if genre.lower() not in movie_genres:
                    continue

            # Filtro opcional por ano de lançamento
            if (min_year or max_year) and movie_row is not None:
                year_val = movie_row.get("year")
                if pd.notna(year_val):
                    try:
                        yr = int(year_val)
                        if min_year and yr < min_year:
                            continue
                        if max_year and yr > max_year:
                            continue
                    except (ValueError, TypeError):
                        pass

            final_score = float(score)

            # Boost de Watchlist (+25%)
            in_watchlist = candidate_key in watchlist_keys
            if in_watchlist:
                final_score *= 1.25

            # Detecção de Niche Breaker (Língua diferente de inglês)
            lang = ""
            if movie_row is not None and "original_language" in movie_row and pd.notna(movie_row["original_language"]):
                lang = str(movie_row["original_language"]).lower()
            is_niche = bool(lang and lang not in ("en", "eng"))

            candidates.append({
                "movie_id": candidate_key,
                "score": final_score,
                "in_watchlist": in_watchlist,
                "is_niche": is_niche,
                "is_now_playing": is_now_playing,
                "language": lang,
                "movie_row": movie_row,
            })

        # Ordena candidatos por score decrescente
        candidates.sort(key=lambda x: x["score"], reverse=True)

        # Reserva metade das vagas para a Watchlist e metade para descobertas.
        # A cota de cinema não anglófono é aplicada separadamente em cada metade.
        watchlist_quota = limit // 2
        discovery_quota = limit - watchlist_quota
        watchlist_candidates = [c for c in candidates if c["in_watchlist"]]
        discovery_candidates = [c for c in candidates if not c["in_watchlist"]]

        max_per_director = max(1, (limit + 4) // 5)

        def pick_group(group: list[dict[str, Any]], quota: int, seen_directors: dict[str, int]) -> list[dict[str, Any]]:
            if quota <= 0:
                return []
            niche_quota = int(quota * 0.20)
            standard_quota = quota - niche_quota
            standard = [c for c in group if not c["is_niche"]]
            niche = [c for c in group if c["is_niche"] and c["score"] > 0.0]
            ordered = standard[:standard_quota] + niche[:niche_quota]
            selected: list[dict[str, Any]] = []
            for candidate in ordered + [c for c in group if c not in ordered]:
                directors = _director_names(candidate["movie_row"].get("director", "") if candidate["movie_row"] else "")
                if directors and any(seen_directors.get(name, 0) >= max_per_director for name in directors):
                    continue
                selected.append(candidate)
                for name in directors:
                    seen_directors[name] = seen_directors.get(name, 0) + 1
                if len(selected) >= quota:
                    break
            return selected

        director_counts: dict[str, int] = {}
        selected = pick_group(watchlist_candidates, watchlist_quota, director_counts)
        selected.extend(pick_group(discovery_candidates, discovery_quota, director_counts))
        if len(selected) < limit:
            selected_ids = {c["movie_id"] for c in selected}
            remaining = [c for c in candidates if c["movie_id"] not in selected_ids]
            for candidate in remaining:
                directors = _director_names(candidate["movie_row"].get("director", "") if candidate["movie_row"] else "")
                if directors and any(director_counts.get(name, 0) >= max_per_director for name in directors):
                    continue
                selected.append(candidate)
                for name in directors:
                    director_counts[name] = director_counts.get(name, 0) + 1
                if len(selected) >= limit:
                    break
            if len(selected) < limit:
                selected_ids = {c["movie_id"] for c in selected}
                selected.extend([c for c in candidates if c["movie_id"] not in selected_ids][:limit - len(selected)])

        selected.sort(key=lambda x: x["score"], reverse=True)

        # 8. Monta a lista final de Recommendation com os motivos explicados
        recommendations: list[Recommendation] = []
        for item in selected:
            mid = item["movie_id"]
            row = item["movie_row"]
            tmdb_id: int | None = None

            if row is not None and "tmdb_id" in row and pd.notna(row["tmdb_id"]):
                tmdb_id = int(row["tmdb_id"])
            elif key_col == "tmdb_id":
                tmdb_id = mid

            # Justificativa humanizada
            reasons = []
            if item["is_now_playing"]:
                reasons.append("está em cartaz nos cinemas")
            if item["in_watchlist"]:
                reasons.append("está na sua Watchlist")
            if item["is_niche"]:
                reasons.append(f"descoberta de cinema em língua '{item['language']}'")
            if not reasons:
                reasons.append("alta afinidade com seu histórico")

            # Mostra uma ligação concreta com um filme bem avaliado pelo usuário.
            best_connection: tuple[float, str, str] | None = None
            for source_id, _ in positive_history:
                source = movie_rows.get(source_id)
                if source is None or source_id == mid:
                    continue
                connection = explain_connection(features, source_id, mid)
                contribution = float(connection.get("contribution", 0.0))
                if contribution > 0 and (best_connection is None or contribution > best_connection[0]):
                    best_connection = (contribution, str(source.get("title", "um filme que você curtiu")), str(connection.get("reason", "temas compartilhados")))
            if best_connection:
                _, source_title, connection_reason = best_connection
                reasons.append(f"parecido com {source_title}: {connection_reason.lower()}")

            reason_text = f"Porque {', e '.join(reasons)}"
            if len(reason_text) > 120:
                reason_text = reason_text[:117].rstrip() + "..."

            recommendations.append(
                Recommendation(
                    movie_id=mid,
                    score=round(max(0.0, min(1.0, item["score"])), 4),
                    tmdb_id=tmdb_id,
                    reason=reason_text,
                    is_niche_breaker=item["is_niche"],
                    feedback=feedback.get(mid, ""),
                )
            )

        return recommendations

    def _fallback_popular_recommendations(
        self,
        dataset: Dataset,
        watched_keys: set[int],
        *,
        limit: int = 20,
    ) -> list[Recommendation]:
        """Fallback para Cold-Start: recomenda os títulos mais populares do catálogo."""
        movies_df = dataset.movies.copy()
        if "popularity" in movies_df.columns:
            movies_df["popularity"] = pd.to_numeric(movies_df["popularity"], errors="coerce").fillna(0)
            movies_df = movies_df.sort_values(by="popularity", ascending=False)

        key_col = dataset.key_column
        results: list[Recommendation] = []

        for _, row in movies_df.iterrows():
            raw_key = row.get(key_col)
            if pd.isna(raw_key):
                continue
            mid = int(raw_key)
            if mid in watched_keys:
                continue
            if not _is_feature_length(row):
                continue

            raw_tmdb = row.get("tmdb_id")
            tmdb_id = int(raw_tmdb) if pd.notna(raw_tmdb) else (mid if key_col == "tmdb_id" else None)

            results.append(
                Recommendation(
                    movie_id=mid,
                    score=0.5,
                    tmdb_id=tmdb_id,
                    reason="Destaque popular do catálogo para começar seu perfil",
                    is_niche_breaker=False,
                )
            )
            if len(results) >= limit:
                break

        return results


def _director_names(value: object) -> set[str]:
    """Retorna nomes de diretores normalizados para aplicar diversidade."""
    if value is None or pd.isna(value):
        return set()
    return {name.strip().casefold() for name in str(value).split("|") if name.strip()}


def _is_feature_length(movie: Any) -> bool:
    """Descarta curtas-metragens conhecidos (< 60 min), mantendo filmes sem duração cadastrada (NaN ou 0)."""
    if movie is None:
        return False
    runtime = pd.to_numeric(movie.get("runtime"), errors="coerce")
    if pd.isna(runtime) or float(runtime) <= 0:
        return True
    return float(runtime) >= 60
