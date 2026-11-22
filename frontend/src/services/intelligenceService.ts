import { api } from './api';

export interface MovieSummary {
  id: number;
  tmdb_id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_url?: string;
  backdrop_url?: string;
  year?: number;
  runtime?: number;
  vote_average?: number;
  genres?: string[];
}

export interface RecommendationItem {
  movie_id: number;
  tmdb_id?: number;
  score: number;
  reason?: string;
  feedback?: 'interested' | 'not_interested' | '';
  is_niche_breaker?: boolean;
  movie?: MovieSummary;
}

export interface SimilarMovieItem {
  movie_id: number;
  tmdb_id?: number;
  similarity_score: number;
  reason?: string;
  movie?: MovieSummary;
}

export interface RecommendationsResponse {
  user_id: string;
  recommendations: RecommendationItem[];
  algorithm: string;
  id_type: 'internal' | 'tmdb';
  generated_at: string;
}

export interface SimilarMoviesResponse {
  movie_id: number;
  tmdb_id?: number;
  movie?: MovieSummary;
  similar_movies: SimilarMovieItem[];
  algorithm: string;
  id_type: 'internal' | 'tmdb';
  generated_at: string;
}

export interface RecommendationFilters {
  limit?: number;
  genre?: string;
  min_year?: number;
  max_year?: number;
  in_theaters?: boolean;
  now_playing_ids?: number[];
}

export interface MovieGraphNode {
  movie_id: number;
  tmdb_id?: number;
  title: string;
  depth: number;
  score: number;
  movie?: MovieSummary;
}

export interface MovieGraphEdge {
  source: number;
  target: number;
  score: number;
  reason: string;
  group?: string;
  terms?: string[];
}

export interface MovieGraphResponse {
  root: number;
  id_type: 'internal' | 'tmdb';
  nodes: MovieGraphNode[];
  edges: MovieGraphEdge[];
}

export interface ImportSummary {
  total: number;
  success: number;
  failed: number;
}

export interface GlobalImportSummary {
  watched?: ImportSummary;
  ratings?: ImportSummary;
  likes?: ImportSummary;
  watchlist?: ImportSummary;
  errors?: string[];
}

export interface ImportFailure {
  source: 'watched' | 'ratings' | 'likes' | 'watchlist';
  name: string;
  year: number;
  reason: string;
}

export interface ZipImportSummary extends GlobalImportSummary {
  failed_items: ImportFailure[];
  failed_items_truncated?: boolean;
}

export interface LetterboxdImportJob {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stage: 'queued' | 'matching' | 'saving' | 'complete' | 'failed';
  processed: number;
  total: number;
  percent: number;
  summary?: ZipImportSummary;
  error?: string;
  created_at: string;
  updated_at: string;
}

export const intelligenceService = {
  // Recomendações do usuário autenticado (o Go resolve o UUID do JWT).
  async getRecommendations(limitOrFilters: number | RecommendationFilters = 20): Promise<RecommendationItem[]> {
    const opts: RecommendationFilters =
      typeof limitOrFilters === 'number' ? { limit: limitOrFilters } : limitOrFilters;
    const params: Record<string, string | number | boolean> = {
      limit: opts.limit ?? 20,
    };
    if (opts.genre) params.genre = opts.genre;
    if (opts.min_year) params.min_year = opts.min_year;
    if (opts.max_year) params.max_year = opts.max_year;
    if (opts.in_theaters) params.in_theaters = true;
    if (opts.now_playing_ids && opts.now_playing_ids.length > 0) {
      params.now_playing_ids = opts.now_playing_ids.join(',');
    }
    const response = await api.get<RecommendationsResponse>('/users/me/recommendations', { params });
    return response.data.recommendations || [];
  },

  async setRecommendationFeedback(movieId: number, feedback: 'interested' | 'not_interested'): Promise<void> {
    await api.post('/recommendations/feedback', { movie_id: movieId, feedback });
  },

  async clearRecommendationFeedback(movieId: number): Promise<void> {
    await api.delete(`/recommendations/feedback/${movieId}`);
  },

  // Recomendações de um usuário explícito (útil em perfis públicos).
  async getUserRecommendations(userId: string, limit = 20): Promise<RecommendationItem[]> {
    try {
      const response = await api.get<RecommendationsResponse>(
        `/recommendations/${encodeURIComponent(userId)}`,
        { params: { limit } }
      );
      return response.data.recommendations || [];
    } catch {
      return [];
    }
  },

  async getSimilarMovies(movieId: number, limit = 20): Promise<SimilarMovieItem[]> {
    try {
      const response = await api.get<SimilarMoviesResponse>(`/similar/${movieId}`, {
        params: { limit },
      });
      return response.data.similar_movies || [];
    } catch {
      return [];
    }
  },

  async getMovieGraph(
    movieId: number,
    options?: { depth?: number; branching?: number; min_score?: number }
  ): Promise<MovieGraphResponse | null> {
    try {
      const response = await api.get<MovieGraphResponse>(`/similar/${movieId}/graph`, {
        params: options,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  async startLetterboxdImport(file: File): Promise<LetterboxdImportJob> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<LetterboxdImportJob>('/import/letterboxd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409 && error.response.data?.job_id) {
        return error.response.data as LetterboxdImportJob;
      }
      throw error;
    }
  },

  async getLetterboxdImportStatus(jobId: string): Promise<LetterboxdImportJob> {
    const response = await api.get<LetterboxdImportJob>(`/import/letterboxd/${encodeURIComponent(jobId)}`);
    return response.data;
  },
};
