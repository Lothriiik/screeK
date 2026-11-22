"""Construção do perfil vetorial do usuário (User-Side).

Transfere as notas (0.5 a 5.0) e curtidas do usuário para o espaço vetorial
do catálogo. Notas altas atraem filmes similares; notas baixas repelem
filmes com características parecidas (vetor negativo).
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.preprocessing import normalize

from app.core.constants import RATING_MAX, RATING_MIN
from app.data.features import ContentFeatures


def calculate_rating_weight(rating: float | None, liked: bool | None = False) -> float:
    """Converte a nota canônica (0.5–5.0) e curtida em peso centrado (-2.0 a +2.0).

    A escala é centrada em 3.0:
    - 5.0 -> +2.0 (Afinidade máxima)
    - 4.0 -> +1.0 (Gostou)
    - 3.5 -> +0.5 (Agradou)
    - 3.0 ->  0.0 (Neutro)
    - 2.0 -> -1.0 (Desagradou)
    - 1.0 -> -2.0 (Odiou / vetor negativo forte)

    Se for apenas assistido sem nota:
    - Com liked=True: equivale a 4.0 (+1.0)
    - Sem liked: peso leve neutro-positivo (+0.25)
    """
    if rating is not None and pd.notna(rating) and rating > 0.0:
        numeric = float(rating)
        # Clampa entre 0.5 e 5.0 e centraliza em 3.0
        clamped = max(RATING_MIN, min(RATING_MAX, numeric))
        return clamped - 3.0

    if liked is True:
        return 1.0

    return 0.25


def build_user_vector(
    user_ratings: pd.DataFrame,
    features: ContentFeatures,
    *,
    key_column: str = "tmdb_id",
) -> np.ndarray | None:
    """Gera o vetor de preferência do usuário ponderando os filmes avaliados.

    Retorna um array numpy 2D com formato (1, num_features) ou None se não
    houver avaliações suficientes no catálogo indexado.
    """
    if user_ratings.empty or features.matrix.shape[0] == 0:
        return None

    # Vetor acumulador inicializado com zeros
    n_features = features.matrix.shape[1]
    user_vector = np.zeros(n_features, dtype=np.float64)
    total_abs_weight = 0.0
    matched_count = 0

    col = key_column if key_column in user_ratings.columns else "tmdb_id"
    if col not in user_ratings.columns:
        return None

    for _, row in user_ratings.iterrows():
        raw_key = row.get(col)
        if pd.isna(raw_key):
            continue

        movie_key = int(raw_key)
        if movie_key not in features.key_to_index:
            continue

        idx = features.key_to_index[movie_key]
        weight = calculate_rating_weight(
            rating=row.get("rating"),
            liked=bool(row.get("liked", False)),
        )

        if weight == 0.0:
            continue

        # Vetor esparso da linha do filme
        movie_row = features.matrix[idx].toarray().ravel()

        user_vector += movie_row * weight
        total_abs_weight += abs(weight)
        matched_count += 1

    if matched_count == 0 or total_abs_weight == 0.0:
        return None

    # Normaliza L2 para manter a escala pronta para similaridade de cosseno
    reshaped = user_vector.reshape(1, -1)
    return normalize(reshaped, norm="l2")
