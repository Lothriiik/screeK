import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Info,
  CaretRight
} from '@phosphor-icons/react';

import { SessionChip } from '../components/custom/session-card';
import { getMovieById, getCinemas, getSessionsByMovie, MOCK_MOVIES } from '../mocks';
import { movieService } from '../services/movieService';
import type { Movie } from '../types/movie';
import type { Session } from '../types/session';

interface DateOption {
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
  isToday?: boolean;
}

const DATES: DateOption[] = [
  { dayOfWeek: 'QUI', dayOfMonth: '20', month: 'AGO', isToday: true },
  { dayOfWeek: 'SEX', dayOfMonth: '21', month: 'AGO' },
  { dayOfWeek: 'SÁB', dayOfMonth: '22', month: 'AGO' },
  { dayOfWeek: 'DOM', dayOfMonth: '23', month: 'AGO' },
  { dayOfWeek: 'SEG', dayOfMonth: '24', month: 'AGO' },
  { dayOfWeek: 'TER', dayOfMonth: '25', month: 'AGO' },
  { dayOfWeek: 'QUA', dayOfMonth: '26', month: 'AGO' },
];

export function MovieSessions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie>(
    (id ? getMovieById(id) : undefined) || MOCK_MOVIES[0]
  );

  useEffect(() => {
    if (id) {
      movieService.getMovieById(id).then((data) => {
        if (data) {
          setMovie(data);
          document.title = `Sessões: ${data.title} | screeK`;
        }
      });
    }
  }, [id]);

  const [selectedDate, setSelectedDate] = useState('20');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedAudio, setSelectedAudio] = useState('ALL');

  // Query sessions for this movie from central store or generate for TMDB movie
  const rawSessions = getSessionsByMovie(movie.id);
  const allCinemas = getCinemas();

  const allSessions: Session[] =
    rawSessions.length > 0
      ? rawSessions
      : [
          {
            id: `${movie.id}-sess-1`,
            numeric_id: 101,
            movie_id: movie.id,
            cinema_id: 'cinemark-bourbon',
            room_id: 104,
            room_name: 'Sala IMAX Laser',
            room_type: 'IMAX',
            start_time: '14:30',
            date: '20',
            price: 68.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: 'IMAX',
          },
          {
            id: `${movie.id}-sess-2`,
            numeric_id: 102,
            movie_id: movie.id,
            cinema_id: 'cinemark-bourbon',
            room_id: 101,
            room_name: 'Sala 1 VIP Prime',
            room_type: 'VIP',
            start_time: '18:00',
            date: '20',
            price: 78.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: 'VIP',
          },
          {
            id: `${movie.id}-sess-3`,
            numeric_id: 103,
            movie_id: movie.id,
            cinema_id: 'cinemark-bourbon',
            room_id: 102,
            room_name: 'Sala 2 Standard',
            room_type: 'STANDARD',
            start_time: '21:15',
            date: '20',
            price: 52.0,
            session_type: 'REGULAR',
            audio: 'DUB',
            format: '2D',
          },
          {
            id: `${movie.id}-sess-4`,
            numeric_id: 201,
            movie_id: movie.id,
            cinema_id: 'itau-augusta',
            room_id: 201,
            room_name: 'Sala 1 Autor',
            room_type: 'STANDARD',
            start_time: '16:00',
            date: '20',
            price: 44.0,
            session_type: 'FESTIVAL',
            audio: 'LEG',
            format: '2D',
          },
          {
            id: `${movie.id}-sess-5`,
            numeric_id: 202,
            movie_id: movie.id,
            cinema_id: 'itau-augusta',
            room_id: 202,
            room_name: 'Sala 2 Cult',
            room_type: 'STANDARD',
            start_time: '19:30',
            date: '20',
            price: 44.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: '2D',
          },
          {
            id: `${movie.id}-sess-6`,
            numeric_id: 301,
            movie_id: movie.id,
            cinema_id: 'cinesystem-freicaneca',
            room_id: 301,
            room_name: 'Sala 1 Dolby Atmos',
            room_type: 'STANDARD',
            start_time: '15:00',
            date: '20',
            price: 48.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: '2D',
          },
          {
            id: `${movie.id}-sess-7`,
            numeric_id: 302,
            movie_id: movie.id,
            cinema_id: 'cinesystem-freicaneca',
            room_id: 303,
            room_name: 'Sala 3 Premium',
            room_type: 'VIP',
            start_time: '20:45',
            date: '20',
            price: 62.0,
            session_type: 'REGULAR',
            audio: 'DUB',
            format: 'VIP',
          },
          {
            id: `${movie.id}-sess-8`,
            numeric_id: 401,
            movie_id: movie.id,
            cinema_id: 'uci-nycc',
            room_id: 401,
            room_name: 'Sala IMAX Gigante',
            room_type: 'IMAX',
            start_time: '17:15',
            date: '20',
            price: 64.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: 'IMAX',
          },
          {
            id: `${movie.id}-sess-9`,
            numeric_id: 402,
            movie_id: movie.id,
            cinema_id: 'uci-nycc',
            room_id: 402,
            room_name: 'Sala 4DX Motion',
            room_type: '4DX',
            start_time: '21:30',
            date: '20',
            price: 72.0,
            session_type: 'REGULAR',
            audio: 'LEG',
            format: '4DX',
          },
        ];

  // Group sessions by cinema
  const cinemaSchedules = allCinemas
    .map((cinema) => {
      const sessions = allSessions.filter((s) => s.cinema_id === cinema.id);
      return {
        ...cinema,
        sessions,
      };
    })
    .filter((c) => c.sessions.length > 0);

  // Filter schedules
  const filteredCinemas = cinemaSchedules
    .map((cinema) => {
      const filtered = cinema.sessions.filter((s) => {
        if (selectedFormat !== 'ALL') {
          if (selectedFormat === 'IMAX' && !s.format.toUpperCase().includes('IMAX')) return false;
          if (selectedFormat === '4DX' && !s.format.toUpperCase().includes('4DX')) return false;
          if (selectedFormat === 'VIP' && !s.format.toUpperCase().includes('VIP')) return false;
          if (selectedFormat === '2D' && s.format.toUpperCase() !== '2D') return false;
        }
        if (selectedAudio !== 'ALL' && s.audio !== selectedAudio) {
          return false;
        }
        return true;
      });
      return { ...cinema, sessions: filtered };
    })
    .filter((c) => c.sessions.length > 0);

  const availableFormats = ['ALL', '2D', 'IMAX', 'VIP', '4DX'];
  const availableAudios = [
    { key: 'ALL', label: 'Todos os Áudios' },
    { key: 'LEG', label: 'Legendado' },
    { key: 'DUB', label: 'Dublado' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-display">
      {/* ─── 1. MOVIE HEADER BANNER ─── */}
      <section className="relative w-full overflow-hidden border-b-4 border-foreground/40 bg-tertiary">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 scale-105"
          style={{ backgroundImage: `url(${movie.backdrop_url})` }}
        />
        <div className="absolute inset-0 bg-foreground/80 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto w-full py-8 space-y-6">
          <Link
            to={`/movies/${movie.id}`}
            className="inline-flex items-center px-1.5 py-1.5 bg-card hover:bg-card/90 border-2 border-foreground/40 text-foreground text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <ArrowLeft size={16} weight="bold" />
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-start">
            <div className='flex flex-col'>
              <div className="w-32 sm:w-40 border-4 border-background/40 overflow-hidden shrink-0">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <Link
                  to={`/movies/${movie.id}/sessions`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 inline-flex items-center gap-1 text-[11px] font-extrabold text-background/70 hover:text-primary cursor-pointer w-fit"
                >
                  <Info size={14} />
                  <span>Ver Detalhes do Filme</span>
              </Link>
            </div>
    
            <div className="space-y-2 text-white">
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-white/80">
                <span>{movie.duration_display}</span>
                <span>•</span>
                <span>{movie.genres.join(', ')}</span>
                <span className="bg-[#FF9900] text-white px-1.5 py-0.5 text-[10px]">
                  {movie.age_rating}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                {movie.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. DATE SELECTOR STRIP ─── */}
      <section className="sticky top-0 z-20 bg-background pt-6 px-4 sm:px-0 py-3">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          
          {/* Dates Bar */}
          <div className="flex items-end gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DATES.map((date) => {
              const isSelected = selectedDate === date.dayOfMonth;
              return (
                <button
                  key={date.dayOfMonth}
                  type="button"
                  onClick={() => setSelectedDate(date.dayOfMonth)}
                  className={`w-14 h-16 sm:w-16 sm:h-18 flex flex-col items-center justify-center border-4 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary -translate-y-0.5'
                      : 'bg-background text-foreground border-foreground/30 hover:border-foreground/60 hover:bg-muted'
                  }`}
                >
                  <span className="text-[10px] font-black tracking-wider uppercase">
                    {date.isToday ? 'HOJE' : date.dayOfWeek}
                  </span>
                  <span className="text-base sm:text-lg font-black leading-none">
                    {date.dayOfMonth}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-80">
                    {date.month}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col items-start gap-2">
            {/* Format Filter */}
            <div className="flex items-center gap-1">
              {availableFormats.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`h-9 px-3 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                    selectedFormat === fmt
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/80 border-foreground/30 hover:bg-muted'
                  }`}
                >
                  {fmt === 'ALL' ? 'Formatos' : fmt}
                </button>
              ))}
            </div>

            {/* Audio Filter */}
            <div className="flex items-center gap-1">
              {availableAudios.map((aud) => (
                <button
                  key={aud.key}
                  type="button"
                  onClick={() => setSelectedAudio(aud.key)}
                  className={`h-9 px-3 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                    selectedAudio === aud.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/80 border-foreground/30 hover:bg-muted'
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. CINEMAS & SESSIONS LIST ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between  pb-2">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            Sessões
          </h2>
          <span className="text-xs font-bold text-foreground/60 font-sans">
            {filteredCinemas.length} {filteredCinemas.length === 1 ? 'complexo' : 'complexos'}
          </span>
        </div>

        {filteredCinemas.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)]">
            <Info size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhuma sessão encontrada</h3>
            <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
              Tente alterar os filtros de formato ou áudio para visualizar os horários disponíveis.
            </p>
          </div>
        ) : (
          filteredCinemas.map((cinema) => (
            <article
              key={cinema.id}
              className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-4"
            >
              {/* Cinema Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-foreground/20 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-2 py-0.5">
                      {cinema.chain}
                    </span>
                    <Link
                      to={`/cinemas/${cinema.id}`}
                      className="text-lg sm:text-xl font-black uppercase hover:text-primary transition-colors"
                    >
                      {cinema.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-sans mt-1">
                    <MapPin size={15} weight="bold" className="text-primary" />
                    <span>{cinema.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <Link
                    to={`/cinemas/${cinema.id}`}
                    className="text-xs font-black uppercase text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver Complexo</span>
                    <CaretRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Sessions Chips Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-foreground/60 block tracking-wider">
                  Horários:
                </span>
                <div className="flex flex-wrap gap-3">
                  {cinema.sessions.map((sess) => (
                    <SessionChip
                      key={sess.id}
                      time={sess.start_time}
                      roomName={sess.room_name}
                      audioFormat={sess.audio}
                      screenFormat={sess.format}
                      onClick={() => navigate(`/checkout/seats?session=${sess.id}`)}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
