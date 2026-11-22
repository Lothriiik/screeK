import type { PeriodStats, UserMovieLog } from '../types/stats';
import { MOCK_MOVIES } from './movies';

const getMovie = (id: string) => MOCK_MOVIES.find((m) => m.id === id) || MOCK_MOVIES[0];

export const MOCK_USER_LOGS: UserMovieLog[] = [
  {
    id: 'log-1',
    movie_id: 'speed-racer',
    movie: getMovie('speed-racer'),
    watched_at: '2026-09-18',
    user_rating: 5.0,
    cinema_name: 'Reserva Cultural',
    review_snippet: 'Incomparável na tela grande, uma explosão caleidoscópica de puro cinema.',
  },
  {
    id: 'log-2',
    movie_id: 'dune-part-two',
    movie: getMovie('dune-part-two'),
    watched_at: '2026-09-17',
    user_rating: 5.0,
    cinema_name: 'Cinépolis JK Iguatemi IMAX',
    review_snippet: 'O som da percussão Fremen faz o chão tremer fisicamente.',
  },
  {
    id: 'log-3',
    movie_id: 'chainsaw-man',
    movie: getMovie('chainsaw-man'),
    watched_at: '2026-09-16',
    user_rating: 4.5,
    cinema_name: 'Cinemark Bourbon Ipiranga',
    review_snippet: 'Animação fluida e melancólica, o arco da Reze no cinema é devastador.',
  },
  {
    id: 'log-4',
    movie_id: 'raw',
    movie: getMovie('raw'),
    watched_at: '2026-09-15',
    user_rating: 4.5,
    cinema_name: 'Reserva Cultural',
    review_snippet: 'Atmosfera suja e hipnótica, Ducournau entende o horror corporal como ninguém.',
  },
  {
    id: 'log-5',
    movie_id: 'shin-godzilla',
    movie: getMovie('shin-godzilla'),
    watched_at: '2026-09-12',
    user_rating: 4.5,
    cinema_name: 'Cine Belas Artes',
    review_snippet: 'Burocracia e destruição atômica em harmonia perfeita.',
  },
  {
    id: 'log-6',
    movie_id: 'phantom-of-the-paradise',
    movie: getMovie('phantom-of-the-paradise'),
    watched_at: '2026-09-08',
    user_rating: 4.0,
    cinema_name: 'Cinusp',
    review_snippet: 'Ópera rock glam e espalhafatosa dos anos 70.',
  },
  {
    id: 'log-7',
    movie_id: 'memories-of-matsuko',
    movie: getMovie('memories-of-matsuko'),
    watched_at: '2026-09-04',
    user_rating: 4.5,
    cinema_name: 'CineSesc',
  },
  {
    id: 'log-8',
    movie_id: 'the-wolf-house',
    movie: getMovie('the-wolf-house'),
    watched_at: '2026-09-01',
    user_rating: 4.0,
    cinema_name: 'Reserva Cultural',
  },
  {
    id: 'log-9',
    movie_id: 'opera',
    movie: getMovie('opera'),
    watched_at: '2026-08-28',
    user_rating: 4.0,
    cinema_name: 'Cine Belas Artes',
  },
];

export const MOCK_STATS_WEEK: PeriodStats = {
  period_label: 'Esta Semana · 15 a 21 de Setembro 2026',
  total_movies: 4,
  total_hours: 9.1,
  average_rating: 4.8,
  logs: MOCK_USER_LOGS.slice(0, 4),
  top_genres: [
    { genre: 'Sci-Fi', count: 2, percentage: 50 },
    { genre: 'Ação', count: 2, percentage: 50 },
    { genre: 'Terror', count: 2, percentage: 50 },
    { genre: 'Animação', count: 1, percentage: 25 },
  ],
  top_directors: [
    { name: 'Denis Villeneuve', count: 1 },
    { name: 'Lana & Lilly Wachowski', count: 1 },
    { name: 'Julia Ducournau', count: 1 },
  ],
  top_cinemas: [
    { name: 'Reserva Cultural', count: 2 },
    { name: 'Cinépolis JK Iguatemi', count: 1 },
    { name: 'Cinemark Bourbon', count: 1 },
  ],
};

export const MOCK_STATS_MONTH: PeriodStats = {
  period_label: 'Setembro 2026',
  total_movies: 8,
  total_hours: 17.6,
  average_rating: 4.6,
  logs: MOCK_USER_LOGS.slice(0, 8),
  top_genres: [
    { genre: 'Sci-Fi', count: 4, percentage: 50 },
    { genre: 'Terror', count: 3, percentage: 38 },
    { genre: 'Drama', count: 3, percentage: 38 },
    { genre: 'Ação', count: 3, percentage: 38 },
  ],
  top_directors: [
    { name: 'Denis Villeneuve', count: 1 },
    { name: 'Lana & Lilly Wachowski', count: 1 },
    { name: 'Julia Ducournau', count: 1 },
    { name: 'Hideaki Anno', count: 1 },
  ],
  top_cinemas: [
    { name: 'Reserva Cultural', count: 3 },
    { name: 'Cinépolis JK Iguatemi', count: 2 },
    { name: 'Cine Belas Artes', count: 1 },
  ],
};

export const MOCK_STATS_ALL_TIME: PeriodStats = {
  period_label: 'Histórico Geral (2025-2026)',
  total_movies: 142,
  total_hours: 312.4,
  average_rating: 4.3,
  logs: MOCK_USER_LOGS,
  top_genres: [
    { genre: 'Sci-Fi', count: 39, percentage: 28 },
    { genre: 'Drama', count: 31, percentage: 22 },
    { genre: 'Terror', count: 26, percentage: 18 },
    { genre: 'Animação', count: 20, percentage: 14 },
    { genre: 'Ação', count: 18, percentage: 13 },
  ],
  top_directors: [
    { name: 'Denis Villeneuve', count: 8 },
    { name: 'Lana & Lilly Wachowski', count: 6 },
    { name: 'David Lynch', count: 5 },
    { name: 'Julia Ducournau', count: 4 },
    { name: 'Stanley Kubrick', count: 4 },
  ],
  top_cinemas: [
    { name: 'Reserva Cultural', count: 38 },
    { name: 'Cinemark Bourbon', count: 29 },
    { name: 'Cinépolis JK Iguatemi', count: 22 },
    { name: 'Cine Belas Artes', count: 18 },
  ],
};
