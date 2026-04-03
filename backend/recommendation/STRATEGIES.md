# 🧠 Estratégias de Recomendação — ScreeK Intelligence

Este documento mapeia as possibilidades de evolução para o motor de recomendações em Python, baseando-se nas ideias de metadados ricos e portabilidade de dados.

---

## 1. Expansão do Content-Based (Baseado em Conteúdo)

Para transformar filmes em vetores, utilizaremos pesos diferentes para cada metadado:

### Pesos Sugeridos (Feature Weighting)
| Atributo | Peso | Técnica sugerida |
| :--- | :--- | :--- |
| **Gênero** | Alto (0.4) | `CountVectorizer` ou One-Hot Encoding |
| **Diretor** | Alto (0.3) | `CountVectorizer` (fidelidade ao autor) |
| **Sinopse** | Médio (0.2) | `TF-IDF` ou `Sentence-Embeddings` (BERT) |
| **Elenco (Atores)** | Baixo (0.1) | Atores principais têm mais relevância |

### Fator Geográfico e Linguístico ("Niche Breaker")
- **Preferência Base**: Usuários com histórico em inglês recebem um *boost* em produções estadunidenses/britânicas.
- **Exploração vs. Exploitation**: 20% das recomendações devem ser de "Línguas Estrangeiras" (não-nativas) para incentivar a descoberta (ex: Cinema Coreano, Brasileiro, Francês), baseando-se em temas semelhantes aos que o usuário gosta.

---

## 2. Lógica de Notas e Equivalência
As recomendações não devem se basear apenas em "assistiu", mas na **intensidade do interesse**:
- **Notas Altas (4-5 ⭐)**: Fortalecem o vetor de interesse naqueles metadados.
- **Notas Baixas (1-2 ⭐)**: Criam um "Vetor Negativo" que subtrai pontos de recomendações similares (evita recomendar filmes de terror se o usuário detesta terror).

---

## 3. Importação Letterboxd (Onboarding Massivo)

O Letterboxd permite exportar um `.zip` contendo diversos CSVs (`ratings.csv`, `watched.csv`, `watchlist.csv`).

### Fluxo de Implementação:
1.  **Frontend**: Interface de upload para o arquivo `ratings.csv`.
2.  **Backend (Go)**: Parser do CSV para identificar:
    *   `Date`: Data que o usuário deu a nota.
    *   `Name`: Nome do filme (precisará de um match com o ID do TMDB).
    *   `Rating`: Nota (0.5 a 5.0).
3.  **Processamento**: O ScreeK sincroniza esses dados com o `movie_logs` do usuário.
4.  **Feedback Instantâneo**: Assim que o CSV é processado, o serviço Python roda o `calculate_similarity` e a Home do usuário já nasce povoada de sugestões reais.

---

## 4. Próximos Desafios Técnicos
- **Matching de Nomes**: O CSV do Letterboxd usa nomes em inglês. Precisaremos usar o endpoint de busca do TMDB para converter `Name + Year` em um `TMDB_ID` único e salvar no banco local.
- **Volume de Dados**: Se um usuário importar 2.000 filmes, o algoritmo de recomendação pode demorar um pouco mais no primeiro processamento.
