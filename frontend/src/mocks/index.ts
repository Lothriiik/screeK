import { MOCK_MOVIES } from './movies';
import { MOCK_CINEMAS } from './cinemas';
import { MOCK_SESSIONS } from './sessions';
import type { Movie, MovieStatus } from '../types/movie';
import type { Cinema } from '../types/cinema';
import type { Session } from '../types/session';
import type { SnackItem } from '../types/booking';

export * from './movies';
export * from './cinemas';
export * from './sessions';
export * from './tickets';
export * from './people';
export * from './users';
export * from './feed';
export * from './notifications';
export * from './lists';
export * from './stats';
export * from './collections';

// Snack Menu mock data
export const MOCK_SNACKS: SnackItem[] = [
  {
    id: 'p-grande',
    name: 'Pipoca Salgada Grande',
    category: 'Pipocas',
    price: 32.0,
    image: '🍿',
    description: 'Balde de pipoca crocante com manteiga temperada especial screeK.',
  },
  {
    id: 'p-doce',
    name: 'Pipoca Doce Caramelo',
    category: 'Pipocas',
    price: 35.0,
    image: '🍿',
    description: 'Pipoca estourada na hora caramelizada com flor de sal.',
  },
  {
    id: 'refri-g',
    name: 'Refrigerante 700ml',
    category: 'Bebidas',
    price: 18.0,
    image: '🥤',
    description: 'Coca-Cola, Guaraná Antarctica, Fanta ou Sprite gelado.',
  },
  {
    id: 'agua',
    name: 'Água Mineral 500ml',
    category: 'Bebidas',
    price: 9.0,
    image: '💧',
    description: 'Com ou sem gás gelada.',
  },
  {
    id: 'mms',
    name: "M&M's Chocolate 120g",
    category: 'Doces',
    price: 16.0,
    image: '🍫',
    description: 'Confeitos de chocolate ao leite crocantes.',
  },
  {
    id: 'combo-duplo',
    name: 'Combo Casal screeK',
    category: 'Combos',
    price: 68.0,
    image: '🎟️',
    description: '1 Pipoca Mega + 2 Refrigerantes 700ml + 1 M&M Especial.',
  },
];

// Typed Mock Query Methods
export const getMovies = (filter?: { status?: MovieStatus; genre?: string }): Movie[] => {
  let list = [...MOCK_MOVIES];
  if (filter?.status) {
    list = list.filter((m) => m.status === filter.status);
  }
  if (filter?.genre) {
    list = list.filter((m) => m.genres.some((g) => g.toUpperCase() === filter.genre?.toUpperCase()));
  }
  return list;
};

export const getMovieById = (id: string | number): Movie | undefined => {
  return MOCK_MOVIES.find((m) => m.id === String(id) || m.numeric_id === Number(id) || m.tmdb_id === Number(id));
};

export const getCinemas = (filter?: { city?: string; chain?: string }): Cinema[] => {
  let list = [...MOCK_CINEMAS];
  if (filter?.city) {
    list = list.filter((c) => c.city.toLowerCase() === filter.city?.toLowerCase());
  }
  if (filter?.chain) {
    list = list.filter((c) => c.chain.toLowerCase() === filter.chain?.toLowerCase());
  }
  return list;
};

export const getCinemaById = (id: string | number): Cinema | undefined => {
  return MOCK_CINEMAS.find((c) => c.id === id || c.numeric_id === Number(id));
};

export const getSessionsByMovie = (movieId: string, cinemaId?: string): Session[] => {
  const movie = getMovieById(movieId);
  const canonicalId = movie?.id ?? movieId;
  return MOCK_SESSIONS.filter(
    (s) => s.movie_id === canonicalId && (!cinemaId || s.cinema_id === cinemaId)
  );
};

export const getSessionsByCinema = (cinemaId: string): Session[] => {
  return MOCK_SESSIONS.filter((s) => s.cinema_id === cinemaId);
};
