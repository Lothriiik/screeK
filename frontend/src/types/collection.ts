import type { Movie } from './movie';

export interface EditorialCollection {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  banner_url: string;
  backdrop_url: string;
  movie_ids: string[];
  tags: string[];
  curator: {
    name: string;
    role: string;
    avatar_url: string;
  };
  is_algorithmic?: boolean;
  algorithm_type?: 'trending' | 'top_rated' | 'genre_highlight' | 'country_spotlight';
  movies_count: number;
  featured?: boolean;
  created_at: string;
  movies?: Movie[];
}
