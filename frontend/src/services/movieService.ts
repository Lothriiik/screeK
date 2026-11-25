import axios from 'axios';
import { api } from './api';
import { MOCK_MOVIES } from '../mocks/movies';
import { MOCK_PEOPLE } from '../mocks/people';
import { MOCK_USERS } from '../mocks/users';
import type { Movie, Person } from '../types/movie';

const TMDB_DIRECT_BASE = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhM2I5MjhlNmJiODRjMDliMTBlOTcwYjJhNjI2M2MzYiIsIm5iZiI6MTY5NDI4NTk2Mi42OTQwMDAyLCJzdWIiOiI2NGZjYzA4YWVmZWE3YTAwYzM5NGRiOTkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.HFnkQCBE3Mhz1KoTiObkAGkuPPLQvkzDZMgvt7HG2TY';
const TMDB_BEARER_TOKEN = import.meta.env.VITE_TMDB_TOKEN || DEFAULT_TMDB_TOKEN;

export interface TMDBPersonMovie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  character?: string;
  job?: string;
  department?: string;
}

export interface PersonDetailResponse extends Person {
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
  known_for?: Array<{ id: number; title: string; poster_path: string }>;
}

export const TMDB_GENRES_MAP: Record<number, string> = {
  28: 'AÇÃO',
  12: 'AVENTURA',
  16: 'ANIMAÇÃO',
  35: 'COMÉDIA',
  80: 'CRIME',
  99: 'DOCUMENTÁRIO',
  18: 'DRAMA',
  10751: 'FAMÍLIA',
  14: 'FANTASIA',
  36: 'HISTÓRIA',
  27: 'TERROR',
  10402: 'MÚSICA',
  9648: 'SUSPENSE',
  10749: 'ROMANCE',
  878: 'SCI-FI',
  10770: 'TELEFILME',
  53: 'SUSPENSE',
  10752: 'GUERRA',
  37: 'WESTERN',
};

export function normalizeTMDBMovie(raw: any): Movie {
  const posterPath = raw.poster_path || raw.poster_url;
  const backdropPath = raw.backdrop_path || raw.backdrop_url;
  const releaseDate = raw.release_date || '2024-01-01';
  const releaseYear = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) || 2024 : 2024;

  let genresList: string[] = [];
  if (Array.isArray(raw.genres) && raw.genres.length > 0) {
    genresList = raw.genres.map((g: any) => (typeof g === 'string' ? g : g.name).toUpperCase());
  } else if (Array.isArray(raw.genre_ids) && raw.genre_ids.length > 0) {
    genresList = raw.genre_ids
      .map((id: number) => TMDB_GENRES_MAP[id])
      .filter(Boolean);
  }

  if (genresList.length === 0) {
    genresList = ['CINEMA'];
  }

  const directors: string[] = [];
  const writers: string[] = [];
  const crew = raw.credits?.crew || raw.crew || [];
  if (Array.isArray(crew) && crew.length > 0) {
    crew.forEach((c: any) => {
      if (c.job === 'Director' && !directors.includes(c.name)) directors.push(c.name);
      if ((c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story' || c.job === 'Author') && !writers.includes(c.name)) {
        writers.push(c.name);
      }
    });
  }

  // The backend already returns normalized credits as an array; recover crew names from that shape too.
  if (Array.isArray(raw.credits)) {
    raw.credits.forEach((credit: any) => {
      const role = String(credit.role || credit.job || '').toLowerCase();
      const name = credit.person?.name || credit.name;
      if (!name) return;
      if (role.includes('director') && !directors.includes(name)) directors.push(name);
      if (/(writer|screenplay|story|author)/.test(role) && !writers.includes(name)) writers.push(name);
    });
  }

  // Fallback se veio em formato direto
  if (directors.length === 0 && Array.isArray(raw.directors) && raw.directors.length > 0) {
    directors.push(...raw.directors);
  }
  if (writers.length === 0 && Array.isArray(raw.writers) && raw.writers.length > 0) {
    writers.push(...raw.writers);
  }

  // Cast normalization
  const castList: any[] = [];
  const rawCast = raw.credits?.cast || raw.cast || [];
  if (Array.isArray(rawCast)) {
    rawCast.slice(0, 12).forEach((actor: any, idx: number) => {
      castList.push({
        id: actor.id || idx + 1,
        movie_id: Number(raw.id || 0),
        person_id: actor.id || idx + 1,
        role: 'ACTOR',
        character: actor.character || '',
        person: {
          id: actor.id || idx + 1,
          name: actor.name || 'Ator',
          profile_url: actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : undefined,
          initials: actor.name
            ? actor.name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
            : 'AT',
        },
      });
    });
  }

  // Country extraction
  let country = raw.origin_country || '';
  if (Array.isArray(raw.origin_country) && raw.origin_country.length > 0) {
    country = raw.origin_country[0];
  } else if (Array.isArray(raw.production_countries) && raw.production_countries.length > 0) {
    country = raw.production_countries[0].name || raw.production_countries[0].iso_3166_1;
  }
  if (country === 'US' || country === 'USA' || country === 'United States of America') country = '🇺🇸 EUA';
  else if (country === 'BR' || country === 'Brazil') country = '🇧🇷 Brasil';
  else if (country === 'JP' || country === 'Japan') country = '🇯🇵 Japão';
  else if (country === 'FR' || country === 'France') country = '🇫🇷 França';
  else if (country === 'GB' || country === 'United Kingdom') country = '🇬🇧 Reino Unido';
  else if (country === 'IT' || country === 'Italy') country = '🇮🇹 Itália';
  else if (country === 'KR' || country === 'South Korea') country = '🇰🇷 Coreia do Sul';
  else if (country === 'CA' || country === 'Canada') country = '🇨🇦 Canadá';

  // Studio / Production Company
  let productionCompany = raw.production_company || '';
  if (!productionCompany && Array.isArray(raw.production_companies) && raw.production_companies.length > 0) {
    productionCompany = raw.production_companies.slice(0, 2).map((c: any) => c.name).join(' / ');
  }

  let normalizedPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
  if (posterPath) {
    if (posterPath.startsWith('http') || posterPath.startsWith('data:') || posterPath.startsWith('/assets') || posterPath.startsWith('./')) {
      normalizedPoster = posterPath;
    } else {
      normalizedPoster = `https://image.tmdb.org/t/p/w500${posterPath.startsWith('/') ? '' : '/'}${posterPath}`;
    }
  }

  let normalizedBackdrop = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80';
  if (backdropPath) {
    if (backdropPath.startsWith('http') || backdropPath.startsWith('data:') || backdropPath.startsWith('/assets') || backdropPath.startsWith('./')) {
      normalizedBackdrop = backdropPath;
    } else {
      normalizedBackdrop = `https://image.tmdb.org/t/p/original${backdropPath.startsWith('/') ? '' : '/'}${backdropPath}`;
    }
  }

  return {
    id: String(raw.id || raw.numeric_id || 'movie'),
    numeric_id: Number(raw.id || raw.numeric_id || 0),
    tmdb_id: Number(raw.id || raw.tmdb_id || 0),
    title: raw.title || raw.name || 'Sem título',
    original_title: raw.original_title || raw.title || '',
    overview: raw.overview || 'Sinopse indisponível.',
    poster_url: normalizedPoster,
    backdrop_url: normalizedBackdrop,
    release_date: releaseDate,
    release_year: releaseYear,
    status: raw.status || 'released',
    runtime_minutes: raw.runtime_minutes || raw.runtime || 120,
    duration_display: raw.duration_display || (raw.runtime
      ? `${Math.floor(raw.runtime / 60)}h${raw.runtime % 60 ? (raw.runtime % 60 < 10 ? '0' : '') + (raw.runtime % 60) : '00'}`
      : '2h00'),
    original_language: raw.original_language?.toUpperCase() || 'EN',
    origin_country: country || undefined,
    production_company: productionCompany || undefined,
    genres: genresList.length > 0 ? genresList : ['FILME'],
    age_rating: raw.age_rating || '14',
    global_rating: raw.global_rating || (raw.vote_average ? Number((raw.vote_average / 2).toFixed(1)) : 4.5),
    global_votes: raw.global_votes || (raw.vote_count ? `${raw.vote_count}` : '1.2k'),
    popularity_score: raw.popularity_score || (raw.popularity ? Math.round(raw.popularity) : 80),
    is_in_theaters: raw.is_in_theaters || false,
    directors: directors.length > 0 ? directors : ['Direção não informada'],
    writers: writers.length > 0 ? writers : ['Roteiro não informado'],
    credits: castList.length > 0 ? castList : (Array.isArray(raw.credits) ? raw.credits : []),
  };
}

export const movieService = {
  // Search movies, people, users or lists
  async search(query: string, searchType: 'MOVIE' | 'PERSON' | 'USER' | 'LIST' = 'MOVIE'): Promise<any[]> {
    const cleanQ = query.trim();
    if (!cleanQ) return [];

    // 1. Try Go backend
    try {
      const response = await api.get<any[]>('/movies/search', {
        params: { q: cleanQ, type: searchType },
      });
      if (response.data && response.data.length > 0) {
        if (searchType === 'MOVIE') {
          return response.data.map(normalizeTMDBMovie);
        }
        return response.data;
      }
    } catch {
      // Continue to direct TMDB fallback
    }

    // 2. Direct TMDB fallback if backend offline
    if (TMDB_BEARER_TOKEN) {
      try {
        if (searchType === 'MOVIE') {
          const res = await axios.get(`${TMDB_DIRECT_BASE}/search/movie`, {
            params: { query: cleanQ, language: 'pt-BR' },
            headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          });
          if (res.data?.results?.length > 0) {
            return res.data.results.map(normalizeTMDBMovie);
          }
        } else if (searchType === 'PERSON') {
          const res = await axios.get(`${TMDB_DIRECT_BASE}/search/person`, {
            params: { query: cleanQ, language: 'pt-BR' },
            headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          });
          if (res.data?.results?.length > 0) {
            return res.data.results.map((p: any) => ({
              id: p.id,
              name: p.name,
              profile_url: p.profile_path ? `https://image.tmdb.org/t/p/w400${p.profile_path}` : undefined,
              role_display: p.known_for_department === 'Directing' ? 'Diretor(a)' : 'Ator/Atriz',
              known_for: p.known_for?.map((k: any) => k.title || k.name).filter(Boolean).join(', ') || 'Cinema',
            }));
          }
        }
      } catch {
        // Continue to mock fallback
      }
    }

    // 3. Mock fallback
    return this.getMockSearchResults(cleanQ, searchType);
  },

  // Search movies specifically
  async searchMovies(query: string, _page = 1): Promise<{ results: Movie[]; total: number }> {
    const cleanQ = query.trim();
    if (!cleanQ) {
      return { results: MOCK_MOVIES, total: MOCK_MOVIES.length };
    }

    const results = await this.search(cleanQ, 'MOVIE');
    return { results, total: results.length };
  },

  // Discover movies with filters (genre, year, page)
  async discover(genreId?: number, year?: number, page: number = 1): Promise<Movie[]> {
    const tmdbPageStart = (page - 1) * 3 + 1;
    const pagesToFetch = [tmdbPageStart, tmdbPageStart + 1, tmdbPageStart + 2];

    // 1. Priorizar busca direta no TMDB (ultrarrápido e consistente com getNowPlaying/getUpcoming)
    if (TMDB_BEARER_TOKEN) {
      try {
        const requests = pagesToFetch.map((p) =>
          axios.get(`${TMDB_DIRECT_BASE}/discover/movie`, {
            params: {
              language: 'pt-BR',
              sort_by: 'popularity.desc',
              with_genres: genreId || undefined,
              primary_release_year: year || undefined,
              page: p,
            },
            headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          })
        );
        const responses = await Promise.all(requests);
        const allResults: Movie[] = [];
        responses.forEach((res) => {
          if (res.data?.results?.length > 0) {
            allResults.push(...res.data.results.map(normalizeTMDBMovie));
          }
        });
        if (allResults.length > 0) {
          return allResults.slice(0, 54);
        }
      } catch {
        // Continue para fallback do backend
      }
    }

    // 2. Fallback: tentar backend Go
    try {
      const backendRequests = pagesToFetch.map((p) =>
        api.get<Movie[]>('/movies/discover', {
          params: {
            genre_id: genreId || undefined,
            year: year || undefined,
            page: p,
          },
          timeout: 2000,
        })
      );
      const responses = await Promise.all(backendRequests);
      const allResults: Movie[] = [];
      responses.forEach((res) => {
        if (res.data && res.data.length > 0) {
          allResults.push(...res.data.map(normalizeTMDBMovie));
        }
      });
      if (allResults.length > 0) {
        return allResults.slice(0, 54);
      }
    } catch {
      // Continue para mocks locais
    }

    return this.getMockDiscover(genreId, year);
  },

  // Get movie details by ID
  async getMovieById(id: string | number): Promise<Movie | null> {
    // 1. Try Go backend
    try {
      const response = await api.get<Movie>(`/movies/${id}`);
      if (response.data && response.data.title) {
        return normalizeTMDBMovie(response.data);
      }
    } catch {
      // Continue
    }

    // 2. Direct TMDB fallback
    if (TMDB_BEARER_TOKEN && !isNaN(Number(id))) {
      try {
        const res = await axios.get(`${TMDB_DIRECT_BASE}/movie/${id}`, {
          params: { language: 'pt-BR', append_to_response: 'credits' },
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        });
        if (res.data && res.data.title) {
          return normalizeTMDBMovie(res.data);
        }
      } catch {
        // Continue
      }
    }

    // 3. Mock fallback
    const found = MOCK_MOVIES.find((m) => m.id === id || m.numeric_id === Number(id));
    return found || MOCK_MOVIES[0] || null;
  },

  // Get TMDB recommendations for a movie
  async getRecommendations(movieId: string | number): Promise<Movie[]> {
    try {
      const response = await api.get<Movie[]>(`/movies/${movieId}/recommendations`);
      if (response.data && response.data.length > 0) {
        return response.data.map(normalizeTMDBMovie);
      }
    } catch {
      // Direct TMDB fallback
    }

    if (TMDB_BEARER_TOKEN && !isNaN(Number(movieId))) {
      try {
        const res = await axios.get(`${TMDB_DIRECT_BASE}/movie/${movieId}/recommendations`, {
          params: { language: 'pt-BR' },
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        });
        if (res.data?.results?.length > 0) {
          return res.data.results.map(normalizeTMDBMovie);
        }
      } catch {
        // Fallback to mock
      }
    }

    return MOCK_MOVIES.filter((m) => m.id !== movieId).slice(0, 5);
  },

  // Get person (actor / director) details
  async getPersonDetails(personId: string | number): Promise<PersonDetailResponse | null> {
    try {
      const response = await api.get<PersonDetailResponse>(`/people/${personId}`);
      if (response.data && response.data.name) {
        return response.data;
      }
    } catch {
      // Direct TMDB fallback
    }

    if (TMDB_BEARER_TOKEN && !isNaN(Number(personId))) {
      try {
        const res = await axios.get(`${TMDB_DIRECT_BASE}/person/${personId}`, {
          params: { language: 'pt-BR' },
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        });
        if (res.data && res.data.name) {
          return {
            id: res.data.id,
            name: res.data.name,
            profile_url: res.data.profile_path ? `https://image.tmdb.org/t/p/w500${res.data.profile_path}` : undefined,
            biography: res.data.biography || 'Biografia não disponível.',
            birthday: res.data.birthday,
            place_of_birth: res.data.place_of_birth,
            known_for_department: res.data.known_for_department,
          };
        }
      } catch {
        // Fallback
      }
    }

    const found = MOCK_PEOPLE.find((p) => p.id === Number(personId));
    if (found) {
      return {
        id: found.id,
        name: found.name,
        profile_url: found.profile_url,
        biography: found.biography,
        birthday: found.birth_date,
        place_of_birth: found.birth_place,
        known_for_department: found.role_display,
      };
    }

    return null;
  },

  // Get person filmography
  async getPersonCredits(personId: string | number): Promise<TMDBPersonMovie[]> {
    try {
      const response = await api.get<TMDBPersonMovie[]>(`/people/${personId}/movies`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Direct TMDB fallback
    }

    if (TMDB_BEARER_TOKEN && !isNaN(Number(personId))) {
      try {
        const res = await axios.get(`${TMDB_DIRECT_BASE}/person/${personId}/movie_credits`, {
          params: { language: 'pt-BR' },
          headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
        });
        const cast = res.data?.cast || [];
        const crew = res.data?.crew || [];
        return [...cast, ...crew].map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w400${m.poster_path}` : '',
          release_date: m.release_date || '',
          character: m.character,
          job: m.job,
          department: m.department,
        }));
      } catch {
        // Fallback
      }
    }

    return [];
  },

  // Get now playing movies (54 per page)
  async getNowPlaying(page: number = 1): Promise<Movie[]> {
    const tmdbPageStart = (page - 1) * 3 + 1;
    const pagesToFetch = [tmdbPageStart, tmdbPageStart + 1, tmdbPageStart + 2];

    if (TMDB_BEARER_TOKEN) {
      try {
        const requests = pagesToFetch.map((p) =>
          axios.get(`${TMDB_DIRECT_BASE}/movie/now_playing`, {
            params: { language: 'pt-BR', page: p },
            headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          })
        );
        const responses = await Promise.all(requests);
        const allResults: Movie[] = [];
        responses.forEach((res) => {
          if (res.data?.results?.length > 0) {
            allResults.push(...res.data.results.map(normalizeTMDBMovie));
          }
        });
        if (allResults.length > 0) {
          return allResults.slice(0, 54);
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_MOVIES;
  },

  // Get upcoming movies (54 per page)
  async getUpcoming(page: number = 1): Promise<Movie[]> {
    const tmdbPageStart = (page - 1) * 3 + 1;
    const pagesToFetch = [tmdbPageStart, tmdbPageStart + 1, tmdbPageStart + 2];

    if (TMDB_BEARER_TOKEN) {
      try {
        const requests = pagesToFetch.map((p) =>
          axios.get(`${TMDB_DIRECT_BASE}/movie/upcoming`, {
            params: { language: 'pt-BR', page: p },
            headers: { Authorization: `Bearer ${TMDB_BEARER_TOKEN}` },
          })
        );
        const responses = await Promise.all(requests);
        const allResults: Movie[] = [];
        responses.forEach((res) => {
          if (res.data?.results?.length > 0) {
            allResults.push(...res.data.results.map(normalizeTMDBMovie));
          }
        });
        if (allResults.length > 0) {
          return allResults.slice(0, 54);
        }
      } catch {
        // Fallback
      }
    }
    return MOCK_MOVIES;
  },

  // Rate a movie (Authenticated)
  async rateMovie(movieId: number, score: number, review?: string): Promise<any> {
    const response = await api.post(`/catalog/movies/${movieId}/ratings`, {
      score,
      review,
    });
    return response.data;
  },

  // Toggle favorite
  async toggleFavorite(tmdbId: number, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await api.delete(`/users/me/favorites/${tmdbId}`);
    } else {
      await api.post(`/users/me/favorites/${tmdbId}`);
    }
  },

  // Mock Helpers
  getMockSearchResults(query: string, type: string) {
    if (type === 'PERSON') {
      return MOCK_PEOPLE.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    }
    if (type === 'USER') {
      return MOCK_USERS.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()));
    }
    return MOCK_MOVIES.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
  },

  getMockDiscover(_genreId?: number, year?: number): Movie[] {
    let list = [...MOCK_MOVIES];
    if (year) {
      list = list.filter((m) => m.release_year === year);
    }
    return list;
  },
};
