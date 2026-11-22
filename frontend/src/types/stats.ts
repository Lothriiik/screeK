import type { Movie } from './movie';

export interface UserMovieLog {
  id: string;
  movie_id: string;
  movie: Movie;
  watched_at: string; // YYYY-MM-DD
  user_rating: number; // 0.5 to 5.0
  cinema_name?: string;
  review_snippet?: string;
}

export interface PeriodStats {
  period_label: string; // e.g. "Esta Semana (15-21 Set)", "Setembro 2026", "Todo o Período"
  total_movies: number;
  total_hours: number;
  average_rating: number;
  logs: UserMovieLog[];
  top_genres: { genre: string; count: number; percentage: number }[];
  top_directors: { name: string; count: number }[];
  top_cinemas: { name: string; count: number }[];
}

export type GridDimensions = '3x3' | '4x2' | '4x4' | '5x5' | 'custom';
