import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class RecommendationEngine:

    
    def __init__(self):
        self.movies_df = None
        self.user_ratings = None

    def calculate_similarity(self, user_id: str):

        return [
            {"movie_id": 550, "score": 0.99, "reason": "Because you liked Fight Club"},
            {"movie_id": 27205, "score": 0.85, "reason": "Consistent with your Sci-Fi history"},
            {"movie_id": 157336, "score": 0.78, "reason": "Recommended based on Interstellar"}
        ]

    def get_similar_movies(self, movie_id: int):

        return [
            {"movie_id": movie_id + 1, "score": 0.92},
            {"movie_id": movie_id + 2, "score": 0.81}
        ]

engine = RecommendationEngine()
