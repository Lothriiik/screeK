/**
 * Movie types mirroring backend/core/internal/movies/model.go
 */

export interface Genre {
  id: number;
  tmdb_id?: number;
  name: string;
}

export interface Person {
  id: number;
  tmdb_id?: number;
  name: string;
  profile_url?: string;
  initials?: string;
  role_display?: string;
  country?: string;
  country_code?: string;
  followers_count?: number;
  favorites_count?: number;
  movies_count?: number;
}

export interface MovieCredit {
  id: number;
  movie_id: number;
  person_id: number;
  role: 'DIRECTOR' | 'WRITER' | 'ACTOR' | 'PRODUCER';
  character?: string;
  person: Person;
}

export type MovieStatus = 'now_playing' | 'upcoming' | 'pre_sale' | 're_release';
export type AgeRating = 'L' | '10' | '12' | '14' | '16' | '18';

export interface RatingDistributionItem {
  stars: number;
  percentage: number;
  count: number;
}

export interface Movie {
  id: string;
  numeric_id: number;
  tmdb_id?: number;
  title: string;
  original_title: string;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  logo_url?: string;
  release_date: string; // ISO or YYYY-MM-DD
  release_year: number;
  release_date_display?: string; // e.g. "03/04"
  status: MovieStatus;
  runtime_minutes: number;
  duration_display: string; // e.g. "2h15", "1h39"
  original_language: string;
  origin_country?: string; // e.g. "🇺🇸 EUA"
  origin_countries?: { code: string; name: string }[];
  production_company?: string; // e.g. "Legendary Pictures"
  genres: string[]; // e.g. ["AÇÃO", "SCI-FI"]
  age_rating: AgeRating;
  global_rating: number; // 0.0 to 5.0
  global_votes?: string;
  friends_rating?: number;
  friends_votes?: number;
  user_rating?: number; // Current logged user rating
  popularity_score: number;
  is_pre_sale?: boolean;
  is_in_theaters?: boolean;
  directors: string[];
  writers: string[];
  credits: MovieCredit[];
  rating_distribution?: RatingDistributionItem[];
}
