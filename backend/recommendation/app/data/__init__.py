"""Camada de dados do recomendador.

`Dataset` é o contrato consumido pelo motor. A origem (Postgres canônico ou
CSV offline) é escolhida em `app.data.source.get_data_source`.
"""

from app.data.dataset import Dataset, build_dataset, load_dataset
from app.data.source import (
    CsvDataSource,
    DataSourceError,
    MovieDataSource,
    PostgresDataSource,
    get_data_source,
)

__all__ = [
    "CsvDataSource",
    "DataSourceError",
    "Dataset",
    "MovieDataSource",
    "PostgresDataSource",
    "build_dataset",
    "get_data_source",
    "load_dataset",
]
