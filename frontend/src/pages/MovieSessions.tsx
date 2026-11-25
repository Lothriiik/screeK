import { movieRouteId } from '../lib/movie-route';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Info,
  CaretRight,
  Heart,
  BookmarkSimple,
  Play,
  UsersThree,
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

import { SessionChip } from '../components/custom/session-card';
import { getMovieById, getCinemas, getSessionsByMovie, MOCK_MOVIES, MOCK_USERS } from '../mocks';
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

  const [movie, setMovie] = useState<Movie>((id ? getMovieById(id) : undefined) || MOCK_MOVIES[0]);
  const [movieUnavailable, setMovieUnavailable] = useState(false);
  const [movieResolved, setMovieResolved] = useState(false);

  useEffect(() => {
    if (id) {
      movieService.getMovieById(id).then((data) => {
        if (data) {
          setMovie(data);
          if (data.tmdb_id && id !== String(data.tmdb_id)) navigate(`/movies/${data.tmdb_id}/sessions`, { replace: true });
          setMovieUnavailable(false);
          document.title = `Sessões: ${data.title} | screeK`;
        } else {
          setMovieUnavailable(true);
        }
        setMovieResolved(true);
      }).catch(() => { setMovieUnavailable(true); setMovieResolved(true); });
    }
  }, [id, navigate]);

  const [selectedDate, setSelectedDate] = useState('20');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedAudio, setSelectedAudio] = useState('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Query sessions for this movie from central store or generate for TMDB movie
  const rawSessions = getSessionsByMovie(movie.id);
  const allCinemas = getCinemas();

  const allSessions: Session[] =
    rawSessions.length > 0
      ? rawSessions
      : [
          {
            id: `${movieRouteId(movie)}-sess-1`,
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
            id: `${movieRouteId(movie)}-sess-2`,
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
            id: `${movieRouteId(movie)}-sess-3`,
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
            id: `${movieRouteId(movie)}-sess-4`,
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
            id: `${movieRouteId(movie)}-sess-5`,
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
            id: `${movieRouteId(movie)}-sess-6`,
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
            id: `${movieRouteId(movie)}-sess-7`,
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
            id: `${movieRouteId(movie)}-sess-8`,
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
            id: `${movieRouteId(movie)}-sess-9`,
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

  const friendsAtSessions = MOCK_USERS
    .filter((friend) => friend.favorite_movie_ids?.includes(movie.id))
    .slice(0, Math.min(3, allSessions.length))
    .map((friend, index) => ({
      ...friend,
      session: allSessions[index],
    }));

  // Group sessions by cinema
  const cinemaSchedules = allCinemas
    .map((cinema) => {
      const sessions = allSessions.filter((s) => s.cinema_id === cinema.id && s.date === selectedDate);
      return {
        ...cinema,
        sessions,
      };
    })
    .filter((c) => c.sessions.length > 0)
    .sort((a, b) => (a.city === 'Arapiraca' ? -1 : 0) - (b.city === 'Arapiraca' ? -1 : 0));

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

  if (!movieResolved) return <main className="mx-auto flex min-h-[50vh] items-center justify-center px-6"><p className="animate-pulse text-xs font-black uppercase tracking-widest text-foreground/60">Carregando sessões...</p></main>;
  if (movieUnavailable) return <main className="mx-auto flex min-h-[50vh] max-w-4xl flex-col items-center justify-center gap-3 px-6 text-center"><h1 className="font-display text-2xl font-black uppercase">Filme não encontrado</h1><p className="text-sm text-foreground/65">Não há sessões associadas a esse identificador.</p><Link to="/movies" className="bg-primary px-5 py-3 text-xs font-black uppercase text-primary-foreground">Voltar ao catálogo</Link></main>;

  return (
    <div className="bg-background text-foreground font-display">
      <section className="relative w-full overflow-hidden border-b-4 border-foreground/40 bg-tertiary">
        <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-65" style={{ backgroundImage: `url(${movie.backdrop_url})` }} />
        <div className="absolute inset-0 bg-foreground/80 backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto w-full max-w-4xl space-y-5 px-4 py-8 md:max-w-5xl lg:max-w-6xl sm:px-0">
          <Link to={`/movies/${movieRouteId(movie)}`} className="inline-flex items-center gap-2 text-xs font-black uppercase text-background/70 transition-colors hover:text-background">
            <ArrowLeft size={16} weight="bold" /> Detalhes do filme
          </Link>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_345px] lg:gap-8">
            <div className="flex flex-col gap-5 text-background sm:flex-row sm:gap-7">
              <img src={movie.poster_url} alt={movie.title} className="mx-auto aspect-[2/3] w-36 shrink-0 border-4 border-background/80 object-cover sm:mx-0 sm:w-40" />
              <div className="flex min-w-0 flex-col items-start gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-background/75">
                  <span>{movie.duration_display}</span>
                  {movie.genres.map((genre) => <span key={genre} className="border border-background/50 px-2 py-1">{genre}</span>)}
                  <span className="bg-[#FF9900] px-2 py-1 text-white">{movie.age_rating}</span>
                </div>
                <h1 className="text-2xl font-black uppercase leading-none tracking-tight sm:text-4xl">{movie.title}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-background/80">{movie.overview}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button asChild variant="ghost" size="sm" className="border-2 border-background/80 text-background hover:bg-background hover:text-foreground shadow-none">
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} trailer`)}`} target="_blank" rel="noreferrer"><Play size={14} weight="fill" /> Trailer</a>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsFavorite((value) => !value)} className={`border-2 border-background/80 text-background hover:bg-background hover:text-foreground shadow-none ${isFavorite ? 'bg-primary text-primary-foreground' : ''}`}>
                    <Heart size={14} weight={isFavorite ? 'fill' : 'bold'} /> {isFavorite ? 'Favoritado' : 'Favoritar'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsInWatchlist((value) => !value)} className={`border-2 border-background/80 text-background hover:bg-background hover:text-foreground shadow-none ${isInWatchlist ? 'bg-primary text-primary-foreground' : ''}`}>
                    <BookmarkSimple size={14} weight={isInWatchlist ? 'fill' : 'bold'} /> Watchlist
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="border-2 border-background/80 text-background hover:bg-background hover:text-foreground shadow-none">
                    <Link to={`/movies/${movieRouteId(movie)}`}>Ver detalhes <CaretRight size={14} weight="bold" /></Link>
                  </Button>
                </div>
              </div>
            </div>

            <aside className="border-2 border-background/40 bg-foreground/50 p-4 text-background backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between border-b border-background/25 pb-2">
                <h2 className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider"><UsersThree size={15} /> Amigos nas sessões</h2>
                <Link to="/feed" className="text-[10px] font-black uppercase text-secondary hover:underline">Ver todos ·</Link>
              </div>
              <div className="divide-y divide-background/20">
                {friendsAtSessions.map((friend) => {
                  const cinema = allCinemas.find((item) => item.id === friend.session.cinema_id);
                  const date = DATES.find((item) => item.dayOfMonth === friend.session.date);
                  const dateLabel = date?.isToday ? 'Hoje' : `${date?.dayOfWeek ?? ''} ${date?.dayOfMonth ?? ''}`.trim();
                  const timeLabel = `${dateLabel} · ${friend.session.start_time}`;
                  const cinemaLabel = cinema?.name || 'Cinema';
                  return (
                    <div key={friend.id} className="flex items-center gap-2 py-2.5">
                      <div className="relative h-8 w-8 shrink-0" title={`${friend.name}: ${timeLabel} · ${cinemaLabel}`}>
                        <img src={friend.avatar_url} alt="" className="h-8 w-8 rounded-full border-2 border-background/70 object-cover" />
                        <span aria-label="Tem sessão marcada" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-foreground bg-secondary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black">{friend.name} <span className="font-normal text-background/60">@{friend.username}</span></p>
                        <p className="truncate text-[10px] text-background/70">{timeLabel} · {cinemaLabel}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/checkout/seats?session=${friend.session.id}`)} className="h-7 shrink-0 border-2 border-secondary px-2 text-[9px] text-secondary shadow-none hover:bg-secondary hover:text-secondary-foreground">
                        Ir junto
                      </Button>
                    </div>
                  );
                })}
                {friendsAtSessions.length === 0 && <p className="py-3 text-xs text-background/70">Nenhum amigo marcou sessão deste filme ainda.</p>}
              </div>
              <p className="mt-2 text-[10px] text-background/65">{friendsAtSessions.length} amigos já assistiram · confira quem vai nos horários abaixo.</p>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── 2. DATE SELECTOR STRIP ─── */}
      <section className="bg-background px-4 py-6 sm:px-0">
        <div className="mx-auto flex w-full max-w-4xl flex-col justify-between gap-4 md:max-w-5xl md:flex-row md:items-end lg:max-w-6xl">
          
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
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 pb-8 pt-2 md:max-w-5xl lg:max-w-6xl sm:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">Sessões</h2>
          </div>
          <span className="text-[10px] font-bold uppercase text-foreground/60">{filteredCinemas.length} complexos</span>
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
          filteredCinemas.map((cinema) => {
            return (
            <article key={cinema.id} className={`space-y-3 border-2 bg-background p-4 sm:p-5 ${cinema.city === 'Arapiraca' ? 'border-primary' : 'border-foreground/35'}`}>
              {/* Cinema Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-foreground/20 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-2 py-0.5">
                      {cinema.chain}
                    </span>
                  <Link
                      to={`/cinemas/${cinema.id}`}
                    className="text-base font-black uppercase transition-colors hover:text-primary sm:text-lg"
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
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:underline"
                  >
                    <span>Ver Complexo</span>
                    <CaretRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Sessions Chips Grid */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] font-black uppercase tracking-wider text-foreground/55">
                  Horários:
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {cinema.sessions.map((sess) => (
                    <SessionChip
                      key={sess.id}
                      time={sess.start_time}
                      roomName={sess.room_name}
                      audioFormat={sess.audio}
                      screenFormat={sess.format}
                      compact
                      onClick={() => navigate(`/checkout/seats?session=${sess.id}`)}
                    />
                  ))}
                </div>
              </div>
            </article>
          ); })
        )}
      </main>
    </div>
  );
}
