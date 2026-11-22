"""Mini Protótipo Educativo: Sistema de Recomendação de Filmes (Estilo ScreeK).

Este arquivo é um exemplo autocontido e funcional.
Ele demonstra toda a mecânica matemática e as regras de negócio:
1. Vetorização de catálogo com TF-IDF ponderado por metadados.
2. Similaridade entre filmes (Item-to-Item).
3. Construção do vetor de perfil do usuário (notas ponderadas positivas e negativas).
4. Ranqueamento de candidatos (exclusão de vistos + similaridade de cosseno).
5. Aplicação de regras de negócio (Boost de Watchlist + Niche Breaker de cinema estrangeiro).
6. Geração de justificativa amigável (Reason).

Para rodar:
    python example_recommender.py
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ==============================================================================
# 1. DADOS DE EXEMPLO (Simulando o Banco / Dataset)
# ==============================================================================

def get_sample_catalog() -> pd.DataFrame:
    """Simula a tabela de filmes (dataset.movies)."""
    return pd.DataFrame([
        {
            "movie_id": 1,
            "title": "Hereditário",
            "genres": "Terror Drama Mistério",
            "director": "Ari Aster",
            "cast": "Toni Collette Alex Wolff",
            "overview": "Após a morte da avó segredos aterrorizantes sobre a família começam a se desvendar trauma sobrenatural",
            "language": "en",
        },
        {
            "movie_id": 2,
            "title": "Midsommar",
            "genres": "Terror Drama Mistério",
            "director": "Ari Aster",
            "cast": "Florence Pugh Jack Reynor",
            "overview": "Casal viaja para festival na Suécia rural que se transforma em pesadelo bizarro culto pagão",
            "language": "en",
        },
        {
            "movie_id": 3,
            "title": "A Bruxa",
            "genres": "Terror Drama Mistério",
            "director": "Robert Eggers",
            "cast": "Anya Taylor-Joy Ralph Ineson",
            "overview": "Família puritana do século 17 é isolada na floresta e confrontada por forças sobrenaturais e paranoia",
            "language": "en",
        },
        {
            "movie_id": 4,
            "title": "Parasita",
            "genres": "Suspense Drama Comédia",
            "director": "Bong Joon-ho",
            "cast": "Song Kang-ho Choi Woo-shik",
            "overview": "Família desempregada se infiltra na vida de uma família rica gerando conflito de classes inesperado",
            "language": "ko",  # Niche breaker em potencial (Coreia)
        },
        {
            "movie_id": 5,
            "title": "Bacurau",
            "genres": "Ficção Mistério Suspense",
            "director": "Kleber Mendonça Filho Juliano Dornelles",
            "cast": "Sônia Braga Silvero Pereira",
            "overview": "Povoado no sertão brasileiro descobre que sumiu do mapa e enfrenta invasores misteriosos",
            "language": "pt",  # Niche breaker em potencial (Brasil)
        },
        {
            "movie_id": 6,
            "title": "Superbad",
            "genres": "Comédia",
            "director": "Greg Mottola",
            "cast": "Jonah Hill Michael Cera",
            "overview": "Dois amigos do ensino médio tentam comprar bebida para festa de formatura e passar tempo juntos",
            "language": "en",
        },
        {
            "movie_id": 7,
            "title": "Gente Grande",
            "genres": "Comédia",
            "director": "Dennis Dugan",
            "cast": "Adam Sandler Kevin James",
            "overview": "Amigos de infância se reencontram anos depois para passar um feriado juntos em família",
            "language": "en",
        },
        {
            "movie_id": 8,
            "title": "Raw (Grave)",
            "genres": "Terror Drama",
            "director": "Julia Ducournau",
            "cast": "Garance Marillier Ella Rumpf",
            "overview": "Jovem vegetariana entra na faculdade de veterinária e desenvolve um apetite inesperado por carne canibalismo",
            "language": "fr",  # Niche breaker em potencial (França)
        },
    ])


def get_sample_user_history() -> tuple[pd.DataFrame, set[int]]:
    """Simula o histórico de um usuário: notas de 0.5 a 5.0 e a watchlist."""
    # O usuário adora terror psicológico (Ari Aster, Robert Eggers),
    # detesta comédias bobas (Adam Sandler) e salvou Raw na watchlist.
    ratings = pd.DataFrame([
        {"user_id": "user_123", "movie_id": 1, "rating": 5.0},  # Amou Hereditário
        {"user_id": "user_123", "movie_id": 3, "rating": 4.5},  # Curtiu muito A Bruxa
        {"user_id": "user_123", "movie_id": 7, "rating": 1.0},  # Detestou Gente Grande
    ])
    watchlist_ids = {8}  # Salvou "Raw" (movie_id: 8) para assistir depois
    return ratings, watchlist_ids


# ==============================================================================
# 2. VETORIZAÇÃO DO CATÁLOGO (Item-Side: Feito UMA VEZ no startup / reload)
# ==============================================================================

class CatalogFeatures:
    """Guarda a matriz do catálogo e seus mapeamentos em memória."""

    def __init__(self, movies: pd.DataFrame) -> None:
        self.movies = movies.copy().reset_index(drop=True)
        self.vectorizer = TfidfVectorizer(stop_words=None)
        
        # Ponderação de atributos (Metadata Soup):
        # Repetir palavras dá mais peso matemático no TF-IDF!
        # Diretor x3, Gênero x2, Cast x1, Overview x1
        soup = []
        for _, row in self.movies.iterrows():
            genres = f"{row['genres']} " * 2
            director = f"{row['director']} " * 3
            cast = f"{row['cast']} "
            overview = f"{row['overview']}"
            soup.append(f"{director} {genres} {cast} {overview}".strip())

        # Matriz esparsa: [Número de Filmes x Vocabulário de Palavras]
        self.matrix = self.vectorizer.fit_transform(soup)
        
        # Dicionários rápidos O(1) de ID -> Índice da matriz
        self.id_to_idx = {movie_id: idx for idx, movie_id in enumerate(self.movies["movie_id"])}
        self.idx_to_id = {idx: movie_id for idx, movie_id in enumerate(self.movies["movie_id"])}


# ==============================================================================
# 3. LÓGICA DE RECOMENDAÇÃO (User-Side & Item-to-Item)
# ==============================================================================

def get_similar_movies(movie_id: int, features: CatalogFeatures, top_n: int = 3) -> list[dict]:
    """Exemplo Item-to-Item: Filmes parecidos com um filme de referência."""
    if movie_id not in features.id_to_idx:
        return []

    target_idx = features.id_to_idx[movie_id]
    target_vector = features.matrix[target_idx]

    # Similaridade de cosseno do filme alvo contra todo o catálogo
    scores = cosine_similarity(target_vector, features.matrix).ravel()

    # Ordenar pelos maiores scores ignorando o próprio filme
    similar_indices = scores.argsort()[::-1]
    results = []
    for idx in similar_indices:
        current_id = features.idx_to_id[idx]
        if current_id == movie_id:
            continue
        movie_row = features.movies.iloc[idx]
        results.append({
            "movie_id": current_id,
            "title": movie_row["title"],
            "score": round(float(scores[idx]), 3),
        })
        if len(results) >= top_n:
            break

    return results


def build_user_vector(ratings: pd.DataFrame, features: CatalogFeatures) -> np.ndarray:
    """Cria o vetor de preferência do usuário ponderando pelas notas (0.5 a 5.0).
    
    A sacada matemática:
    - Escala centrada na média (3.0):
      Nota 5.0 -> Peso: +2.0 (Atrai muito)
      Nota 4.0 -> Peso: +1.0 (Atrai)
      Nota 3.0 -> Peso:  0.0 (Neutro)
      Nota 2.0 -> Peso: -1.0 (Repele)
      Nota 1.0 -> Peso: -2.0 (Repele muito / vetor negativo)
    """
    user_vector = np.zeros(features.matrix.shape[1])
    total_abs_weight = 0.0

    for _, row in ratings.iterrows():
        mid = row["movie_id"]
        if mid not in features.id_to_idx:
            continue
        
        idx = features.id_to_idx[mid]
        movie_vector = features.matrix[idx].toarray().ravel()
        
        # Ponderação centrada
        rating = float(row["rating"])
        weight = rating - 3.0

        user_vector += movie_vector * weight
        total_abs_weight += abs(weight)

    # Normalização para manter os valores equilibrados
    if total_abs_weight > 0:
        user_vector /= total_abs_weight

    return user_vector.reshape(1, -1)


def recommend_for_user(
    ratings: pd.DataFrame,
    watchlist_ids: set[int],
    features: CatalogFeatures,
    top_n: int = 4,
    niche_breaker_ratio: float = 0.25,
) -> list[dict]:
    """Recomenda filmes para o usuário com regras de negócio completas."""
    # 1. Filmes já assistidos (não devem ser recomendados novamente)
    watched_ids = set(ratings["movie_id"])

    # 2. Constrói o vetor do usuário e calcula similaridade com todo o catálogo
    user_vector = build_user_vector(ratings, features)
    raw_scores = cosine_similarity(user_vector, features.matrix).ravel()

    # 3. Ranqueia os candidatos excluindo os já vistos e aplicando Boosts
    candidates = []
    for idx, score in enumerate(raw_scores):
        mid = features.idx_to_id[idx]
        if mid in watched_ids:
            continue  # Pula já assistidos

        movie_row = features.movies.iloc[idx]
        final_score = float(score)

        # Regra de Negócio A: Boost de Watchlist (+20% se o usuário salvou na watchlist)
        is_in_watchlist = mid in watchlist_ids
        if is_in_watchlist:
            final_score *= 1.20

        # Identifica se é filme estrangeiro/nicho (língua não inglesa)
        is_foreign = movie_row["language"] != "en"

        candidates.append({
            "movie_id": mid,
            "title": movie_row["title"],
            "director": movie_row["director"],
            "genres": movie_row["genres"],
            "language": movie_row["language"],
            "score": final_score,
            "in_watchlist": is_in_watchlist,
            "is_foreign": is_foreign,
        })

    # Ordena candidatos pelo score final decrescente
    candidates.sort(key=lambda x: x["score"], reverse=True)

    # 4. Regra de Negócio B: Injeção de Niche Breakers (garante filmes de outras línguas)
    niche_count = max(1, int(top_n * niche_breaker_ratio))
    standard_count = top_n - niche_count

    standard_picks = [c for c in candidates if not c["is_foreign"]]
    niche_picks = [c for c in candidates if c["is_foreign"]]

    selected = standard_picks[:standard_count] + niche_picks[:niche_count]
    # Se faltar de algum lado, preenche com os restantes de maior score
    if len(selected) < top_n:
        remaining = [c for c in candidates if c not in selected]
        selected.extend(remaining[: top_n - len(selected)])

    # Ordena a lista final para exibição
    selected.sort(key=lambda x: x["score"], reverse=True)

    # 5. Regra de Negócio C: Geração de Motivos (Reason)
    for item in selected:
        reasons = []
        if item["in_watchlist"]:
            reasons.append("está na sua Watchlist")
        if "Ari Aster" in item["director"]:
            reasons.append("mesmo diretor de Hereditário (Ari Aster)")
        elif "Terror" in item["genres"]:
            reasons.append("combina com sua preferência por Terror psicológico")
        elif item["is_foreign"]:
            reasons.append(f"descoberta de cinema em língua '{item['language']}'")

        item["reason"] = f"Porque {', e '.join(reasons)}" if reasons else "Baseado no seu perfil"

    return selected


# ==============================================================================
# 4. DEMONSTRACAO PRATICA
# ==============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("SCREEK INTELLIGENCE - PROTOTIPO DIDATICO DE RECOMENDACAO")
    print("=" * 70)

    # Carrega dados
    movies_df = get_sample_catalog()
    ratings_df, watchlist = get_sample_user_history()

    # 1. Monta matriz (acontece no startup)
    print("\n[1] Indexando catalogo com TF-IDF Ponderado...")
    features = CatalogFeatures(movies_df)
    print(f"    -> {len(movies_df)} filmes indexados. Vocabulario: {features.matrix.shape[1]} termos.")

    # 2. Teste de Filmes Similares
    ref_movie = "Hereditário"
    ref_id = 1
    print(f"\n[2] Buscando filmes similares a: '{ref_movie}' (Item-to-Item)...")
    similars = get_similar_movies(ref_id, features, top_n=2)
    for m in similars:
        print(f"    * {m['title']} | Score de Similaridade: {m['score']}")

    # 3. Teste de Recomendacao Personalizada
    print("\n[3] Perfil do Usuario:")
    print("    * Amou (5.0): Hereditário")
    print("    * Curtiu (4.5): A Bruxa")
    print("    * Odiou (1.0): Gente Grande")
    print("    * Watchlist: Raw (Grave)")

    recommendations = recommend_for_user(ratings_df, watchlist, features, top_n=3)

    print("\n[4] Recomendacoes Finais Geradas para o Usuario:")
    print("-" * 70)
    for idx, rec in enumerate(recommendations, 1):
        niche_tag = " [Niche Breaker]" if rec["is_foreign"] else ""
        watchlist_tag = " [Na Watchlist]" if rec["in_watchlist"] else ""
        print(f"{idx}. {rec['title']}{niche_tag}{watchlist_tag}")
        print(f"   Score Final: {rec['score']:.3f}")
        print(f"   Justificativa: {rec['reason']}")
        print("-" * 70)
