import { MOCK_MOVIES } from './movies';
import { MOCK_USER_TICKETS } from './tickets';
import type { CinemaPassportPalette } from '../components/custom/cinema-passport-card';

const PASSPORT_PALETTES: CinemaPassportPalette[] = [
  'navy-pink',
  'plum',
  'rose',
  'wine-amber',
  'petroleum',
  'yellow',
];

const MONTHS: Record<string, string> = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
  JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
};

function formatSessionDate(dateLabel: string, createdAt: string, time: string) {
  const [day, monthLabel] = dateLabel.toUpperCase().split(/\s+/);
  const month = MONTHS[monthLabel] || '01';
  const year = createdAt.slice(0, 4);
  return `${day.padStart(2, '0')}/${month}/${year} · ${time}`;
}

const PASSPORT_NOTES: Record<string, { rating: number }> = {
  'speed-racer': {
    rating: 5,
  },
  'chainsaw-man': {
    rating: 5,
  },
  'dune-part-two': {
    rating: 4.9,
  },
  raw: {
    rating: 4.6,
  },
};

export const MOCK_CINEMA_PASSPORT = MOCK_USER_TICKETS
  .filter((ticket) => ticket.status === 'PAID')
  .flatMap((ticket, index) => {
    const movie = MOCK_MOVIES.find((item) => item.id === ticket.movie_id);
    const notes = PASSPORT_NOTES[ticket.movie_id];
    if (!movie || !notes) return [];

    return [{
      id: ticket.id,
      ticketNumber: String(42 + index).padStart(3, '0'),
      ticketCode: ticket.id.replace('TXN-', 'SKR-'),
      movieTitle: movie.title,
      posterUrl: movie.poster_url,
      rating: notes.rating,
      cinemaName: ticket.cinema_name,
      roomName: ticket.room_name,
      seats: ticket.tickets.map((seat) => seat.seatId),
      date: formatSessionDate(ticket.session_date, ticket.created_at, ticket.session_time),
      palette: PASSPORT_PALETTES[index % PASSPORT_PALETTES.length],
    }];
  });
