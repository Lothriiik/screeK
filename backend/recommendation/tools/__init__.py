"""Ferramentas de bootstrap (fora do caminho de produção).

Este pacote existe apenas para:
- normalizar um export do Letterboxd em CSVs;
- casar títulos com o TMDB e enriquecer metadados;
- montar o dataset offline usado em testes e desenvolvimento.

Em produção, o Go core é o dono do import e do matching, e o serviço de
recomendação lê o Postgres canônico (`movies.id`).
"""

__all__ = ["cli"]
