"""Engenharia de features de conteúdo por grupos ponderados e explicabilidade.

Implementa features por grupos ponderados:
- Gênero: 0.30
- Diretor: 0.20
- Keywords: 0.20
- Elenco: 0.10
- Países: 0.05
- Sinopse (Overview): 0.15

Permite:
1. Similaridade precisa ponderada por importância artística.
2. Explicação semântica das arestas ("por que esses dois filmes estão ligados?").
3. Construção de grafos kNN com BFS navegável para o frontend.
"""

from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

# Pesos canônicos por grupo de metadado
FEATURE_WEIGHTS: dict[str, float] = {
    "genres": 0.30,
    "director": 0.20,
    "keywords": 0.20,
    "cast": 0.10,
    "countries": 0.05,
    "overview": 0.05,
}

_PORTUGUESE_STOP_WORDS = {
    "a", "à", "ao", "aos", "as", "com", "como", "da", "das", "de", "dela", "dele",
    "deles", "do", "dos", "e", "é", "ela", "ele", "em", "entre", "era", "essa", "esse",
    "esta", "este", "eu", "foi", "for", "há", "isso", "isto", "já", "mais", "mas", "na",
    "nas", "no", "nos", "o", "os", "ou", "para", "pela", "pelas", "pelo", "pelos", "por",
    "que", "quem", "se", "sem", "ser", "sua", "suas", "também", "um", "uma", "você",
}


@dataclass
class FeatureGroup:
    """Representa a matriz TF-IDF e o vocabulário de um atributo específico."""

    name: str
    weight: float
    matrix: csr_matrix
    vectorizer: TfidfVectorizer


@dataclass
class ContentFeatures:
    """Matriz global combinada e grupos individuais para explicabilidade."""

    matrix: csr_matrix
    vectorizer: TfidfVectorizer  # Para compatibilidade retroativa
    movie_keys: list[int]
    key_column: str = "tmdb_id"
    groups: dict[str, FeatureGroup] = field(default_factory=dict)
    key_to_index: dict[int, int] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.key_to_index and self.movie_keys:
            self.key_to_index = {key: idx for idx, key in enumerate(self.movie_keys)}

    @property
    def tmdb_ids(self) -> list[int]:
        """Compatibilidade: só use quando `key_column == "tmdb_id"`."""
        return self.movie_keys

    def similarity(self, index: int) -> list[float]:
        return cosine_similarity(self.matrix[index], self.matrix).ravel().tolist()


def _clean_text(value: object) -> str:
    """Normaliza texto removendo separadores e espaços repetidos."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).replace("|", " ").replace(",", " ")
    return " ".join(text.split())


def _build_single_group(
    movies: pd.DataFrame,
    column: str,
    weight: float,
    *,
    ngram_range: tuple[int, int] = (1, 1),
    max_features: int | None = None,
    stop_words: str | list[str] | None = None,
) -> FeatureGroup:
    """Vetoriza uma única coluna de metadados e normaliza para L2 norm."""
    texts = [_clean_text(val) for val in movies.get(column, pd.Series([""] * len(movies)))]

    # Se todos estiverem vazios, cria vocabulário vazio
    if not any(texts):
        texts = [""] * len(movies)

    vectorizer = TfidfVectorizer(
        stop_words=stop_words,
        ngram_range=ngram_range,
        max_features=max_features,
        sublinear_tf=True,
    )

    try:
        raw_matrix = vectorizer.fit_transform(texts)
    except ValueError:
        # Quando todos os textos são vazios ou stop-words
        vectorizer.fit(["dummy"])
        raw_matrix = csr_matrix((len(movies), len(vectorizer.get_feature_names_out())))

    # Normaliza L2 para que o produto interno corresponda ao cosseno
    norm_matrix = normalize(raw_matrix, norm="l2")
    return FeatureGroup(
        name=column,
        weight=weight,
        matrix=norm_matrix,
        vectorizer=vectorizer,
    )


def build_content_features(
    movies: pd.DataFrame,
    *,
    key_column: str = "tmdb_id",
    max_features: int = 8000,
    ngram_range: tuple[int, int] = (1, 2),
    min_df: int = 1,
) -> ContentFeatures:
    """Constrói a matriz ponderada por grupos de metadados.

    Cada grupo (gênero, diretor, keywords, etc.) é normalizado e ponderado
    pela raiz quadrada do seu peso. A concatenação horizontal garante que:
    cosseno(A, B) = sum(peso_g * cosseno_g(A, B)).
    """
    if key_column not in movies.columns:
        key_column = "tmdb_id" if "tmdb_id" in movies.columns else movies.columns[0]

    n_movies = len(movies)
    if n_movies == 0:
        dummy_vec = TfidfVectorizer()
        dummy_vec.fit([""])
        empty_mat = csr_matrix((0, 1))
        return ContentFeatures(
            matrix=empty_mat,
            vectorizer=dummy_vec,
            movie_keys=[],
            key_column=key_column,
        )

    # Identificadores das linhas
    movie_keys = pd.to_numeric(movies[key_column], errors="coerce").fillna(0).astype(int).tolist()

    groups: dict[str, FeatureGroup] = {}
    weighted_matrices = []

    # Configuração dos grupos de features
    group_configs = [
        ("genres", FEATURE_WEIGHTS["genres"], (1, 1), None, None),
        ("director", FEATURE_WEIGHTS["director"], (1, 2), None, None),
        ("keywords", FEATURE_WEIGHTS["keywords"], (1, 2), 2000, None),
        ("cast", FEATURE_WEIGHTS["cast"], (1, 2), 3000, None),
        ("countries", FEATURE_WEIGHTS["countries"], (1, 1), None, None),
        ("overview", FEATURE_WEIGHTS["overview"], (1, 2), 6000, sorted(set(ENGLISH_STOP_WORDS) | _PORTUGUESE_STOP_WORDS)),
    ]

    for col, weight, ngrams, max_feat, stops in group_configs:
        group = _build_single_group(
            movies,
            col,
            weight,
            ngram_range=ngrams,
            max_features=max_feat,
            stop_words=stops,
        )
        groups[col] = group
        # Multiplica por sqrt(weight) para que o produto escalar resulte no peso total
        scaled_mat = group.matrix.multiply(math.sqrt(weight))
        weighted_matrices.append(scaled_mat)

    # Concatenação horizontal de todos os blocos ponderados
    combined_matrix = hstack(weighted_matrices).tocsr()

    # Vectorizer geral para compatibilidade com código legado
    legacy_vectorizer = groups["overview"].vectorizer

    return ContentFeatures(
        matrix=combined_matrix,
        vectorizer=legacy_vectorizer,
        movie_keys=movie_keys,
        key_column=key_column,
        groups=groups,
    )


def save_features_to_disk(features: ContentFeatures, path: Path) -> None:
    """Serializa a matriz TF-IDF e grupos em disco com joblib."""
    import joblib

    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "matrix": features.matrix,
        "movie_keys": features.movie_keys,
        "key_column": features.key_column,
        "groups": features.groups,
    }
    joblib.dump(payload, path, compress=3)


def load_features_from_disk(path: Path) -> ContentFeatures | None:
    """Carrega a matriz TF-IDF do disco instantaneamente."""
    import joblib

    if not path.exists():
        return None

    try:
        data = joblib.load(path)
        legacy_vectorizer = data["groups"]["overview"].vectorizer if "groups" in data and "overview" in data["groups"] else TfidfVectorizer()
        return ContentFeatures(
            matrix=data["matrix"],
            vectorizer=legacy_vectorizer,
            movie_keys=data["movie_keys"],
            key_column=data.get("key_column", "tmdb_id"),
            groups=data.get("groups", {}),
        )
    except Exception:
        return None



def similar_by_content(
    features: ContentFeatures,
    movie_key: int,
    *,
    limit: int = 20,
) -> list[tuple[int, float]]:
    """Calcula a similaridade de cosseno ponderada para um filme de referência."""
    if movie_key not in features.key_to_index:
        return []

    index = features.key_to_index[movie_key]
    scores = cosine_similarity(features.matrix[index], features.matrix).ravel()
    order = scores.argsort()[::-1]

    results: list[tuple[int, float]] = []
    for position in order:
        candidate_id = features.movie_keys[int(position)]
        if candidate_id == movie_key:
            continue
        score = float(scores[position])
        results.append((candidate_id, score))
        if len(results) >= limit:
            break

    return results


def explain_connection(
    features: ContentFeatures,
    key_a: int,
    key_b: int,
) -> dict[str, Any]:
    """Descobre por que dois filmes estão conectados, analisando os termos compartilhados.

    Calcula a contribuição de cada grupo (diretor, gênero, etc.) e extrai
    os termos que mais pesaram no produto escalar.
    """
    if key_a not in features.key_to_index or key_b not in features.key_to_index:
        return {"reason": "Sem conexão direta", "top_terms": [], "group": "none"}

    idx_a = features.key_to_index[key_a]
    idx_b = features.key_to_index[key_b]

    best_group_name = ""
    best_group_score = -1.0
    best_terms: list[str] = []

    for name, group in features.groups.items():
        # Produto de Hadamard entre os vetores de A e B para este grupo
        row_a = group.matrix[idx_a]
        row_b = group.matrix[idx_b]
        overlap = row_a.multiply(row_b)

        group_score = float(overlap.sum()) * group.weight
        if group_score > best_group_score:
            best_group_score = group_score
            best_group_name = name

            # Pega os termos que deram esse score
            if overlap.nnz > 0:
                feature_names = group.vectorizer.get_feature_names_out()
                shared_indices = overlap.indices
                shared_scores = overlap.data
                sorted_term_indices = shared_scores.argsort()[::-1]
                raw_terms = [feature_names[shared_indices[i]] for i in sorted_term_indices[:6]]

                # Prioriza termos mais completos (ex: 'Ari Aster' em vez de 'Ari' e 'Aster')
                clean_terms: list[str] = []
                for t in raw_terms:
                    if not any(t != other and t in other for other in raw_terms):
                        clean_terms.append(t)
                    if len(clean_terms) >= 3:
                        break
                best_terms = clean_terms or raw_terms[:2]

    # Constrói o texto amigável em português para a aresta do grafo
    terms_str = ", ".join(t.title() for t in best_terms)
    reason = "Estilo e temática parecidos"

    if best_group_name == "director" and best_terms:
        reason = f"Mesma direção de {terms_str}"
    elif best_group_name == "genres" and best_terms:
        reason = f"Gênero {terms_str} em comum"
    elif best_group_name == "keywords" and best_terms:
        reason = f"Temas em comum: {terms_str}"
    elif best_group_name == "cast" and best_terms:
        reason = f"Elenco compartilhado ({terms_str})"
    elif best_group_name == "countries" and best_terms:
        reason = f"Cinema de {terms_str}"
    elif best_group_name == "overview" and best_terms:
        reason = f"Sinopse com temas em comum: {terms_str}"

    return {
        "reason": reason,
        "group": best_group_name,
        "top_terms": best_terms,
        "contribution": round(best_group_score, 4),
    }


def build_movie_graph(
    features: ContentFeatures,
    dataset: Any,
    root_movie_key: int,
    *,
    depth: int = 2,
    branching: int = 4,
    min_score: float = 0.15,
) -> dict[str, Any]:
    """Constrói um subgrafo de vizinhança kNN a partir de um filme raiz.

    Executa busca em largura (BFS) até a profundidade informada (default 2),
    rotulando cada aresta com o motivo semântico de conexão.
    """
    if root_movie_key not in features.key_to_index:
        return {"root": root_movie_key, "nodes": [], "edges": []}

    root_movie = dataset.find_movie(root_movie_key, id_type=dataset.id_type)
    root_title = str(root_movie.get("title", f"Filme {root_movie_key}")) if root_movie is not None else f"Filme {root_movie_key}"

    nodes: dict[int, dict[str, Any]] = {
        root_movie_key: {
            "movie_id": root_movie_key,
            "title": root_title,
            "depth": 0,
            "score": 1.0,
        }
    }
    edges: list[dict[str, Any]] = []
    seen_edges: set[tuple[int, int]] = set()

    queue: deque[tuple[int, int]] = deque([(root_movie_key, 0)])

    while queue:
        current_id, current_depth = queue.popleft()
        if current_depth >= depth:
            continue

        # Busca vizinhos mais próximos
        # Na camada 1 usamos o branching completo; na camada 2 limitamos para evitar explosão
        k = branching if current_depth == 0 else max(2, branching // 2)
        similars = similar_by_content(features, current_id, limit=k + 5)

        added_neighbors = 0
        for neighbor_id, score in similars:
            if score < min_score:
                continue

            edge_key = (min(current_id, neighbor_id), max(current_id, neighbor_id))
            if edge_key in seen_edges:
                continue
            seen_edges.add(edge_key)

            # Explica o motivo da aresta
            explanation = explain_connection(features, current_id, neighbor_id)

            edges.append(
                {
                    "source": current_id,
                    "target": neighbor_id,
                    "score": round(score, 3),
                    "reason": explanation["reason"],
                    "group": explanation["group"],
                    "terms": explanation["top_terms"],
                }
            )

            # Adiciona o nó se ainda não foi visitado
            if neighbor_id not in nodes:
                movie_obj = dataset.find_movie(neighbor_id, id_type=dataset.id_type)
                title = str(movie_obj.get("title", f"Filme {neighbor_id}")) if movie_obj is not None else f"Filme {neighbor_id}"
                nodes[neighbor_id] = {
                    "movie_id": neighbor_id,
                    "title": title,
                    "depth": current_depth + 1,
                    "score": round(score, 3),
                }
                queue.append((neighbor_id, current_depth + 1))
                added_neighbors += 1

            if added_neighbors >= k:
                break

    return {
        "root": root_movie_key,
        "nodes": list(nodes.values()),
        "edges": edges,
    }
