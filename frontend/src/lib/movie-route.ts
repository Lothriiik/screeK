import type { Movie } from '../types/movie';

/** Public movie routes use TMDB IDs; `id` may be a legacy mock slug or DB ID. */
export function movieRouteId(movie: Pick<Movie, 'id' | 'tmdb_id'>): string | number {
  return movie.tmdb_id || movie.id;
}
