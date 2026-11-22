import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  NavigationArrow,
  Receipt,
  Info
} from '@phosphor-icons/react';
import { SessionChip } from '../components/custom/session-card';
import { getCinemaById, MOCK_CINEMAS, getSessionsByCinema, getMovieById } from '../mocks';

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

export function CinemaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const cinema = (id ? getCinemaById(id) : undefined) || MOCK_CINEMAS[0];

  useEffect(() => {
    if (cinema) {
      document.title = `${cinema.name} | screeK`;
    }
  }, [cinema]);

  const [selectedDate, setSelectedDate] = useState('20');
  const [selectedFormat, setSelectedFormat] = useState('ALL');

  // Query sessions for this cinema from central store
  const cinemaSessions = getSessionsByCinema(cinema.id);

  // Group sessions by movie
  const movieMap = new Map<
    string,
    {
      id: string;
      title: string;
      genres: string[];
      duration: string;
      rating: string;
      synopsis: string;
      poster: string;
      sessions: { id: string; time: string; room: string; audio: string; format: string }[];
    }
  >();

  cinemaSessions.forEach((s) => {
    const movie = getMovieById(s.movie_id);
    if (!movie) return;

    if (!movieMap.has(s.movie_id)) {
      movieMap.set(s.movie_id, {
        id: movie.id,
        title: movie.title,
        genres: movie.genres,
        duration: movie.duration_display,
        rating: movie.age_rating,
        synopsis: movie.overview,
        poster: movie.poster_url,
        sessions: [],
      });
    }

    movieMap.get(s.movie_id)!.sessions.push({
      id: s.id,
      time: s.start_time,
      room: s.room_name,
      audio: s.audio,
      format: s.format,
    });
  });

  const cinemaMovies = Array.from(movieMap.values());

  // Filter movies by format
  const filteredMovies = cinemaMovies
    .map((movie) => {
      const filteredSessions = movie.sessions.filter((sess) => {
        if (selectedFormat === 'ALL') return true;
        if (selectedFormat === 'VIP') return sess.format.toUpperCase().includes('VIP');
        if (selectedFormat === 'IMAX') return sess.format.toUpperCase().includes('IMAX');
        if (selectedFormat === '4DX') return sess.format.toUpperCase().includes('4DX');
        if (selectedFormat === '2D') return sess.format.toUpperCase() === '2D';
        return true;
      });
      return { ...movie, sessions: filteredSessions };
    })
    .filter((movie) => movie.sessions.length > 0);

  const availableFormats = ['ALL', '2D', 'IMAX', 'VIP', '4DX'];

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. HERO WITH CINEMA PICTURE & AMBIENT BACKDROP ─── */}
      <section className="relative w-full bg-background overflow-hidden">
        {/* Ambient Cinema Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src={cinema.backdrop_url}
            alt={cinema.name}
            className="w-full h-full object-cover filter brightness-[0.25] blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 py-8 sm:py-12 space-y-6">
          
          {/* Back Navigation Button */}
          <Link
            to="/cinemas"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/90 hover:bg-background border-2 border-foreground/40 text-foreground font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para Cinemas</span>
          </Link>

          {/* Hero Content: Photo on Left + Clean Info on Right */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
            
            {/* Cinema Facade Photo Frame */}
            <div className="relative w-36 sm:w-48 aspect-[4/3] shrink-0 border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden">
              <img
                src={cinema.image_url}
                alt={cinema.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-black uppercase px-1.5 py-0.5 border border-foreground/40">
                {cinema.chain}
              </div>
            </div>

            {/* Cinema Titles & Details */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5 uppercase tracking-wider border border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)]">
                  COMPLEXO PARCEIRO
                </span>
                <span className="font-sans text-xs font-bold text-foreground/70">
                  • {cinema.rooms_count} Salas de Exibição
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
                {cinema.name}
              </h1>

              {/* Single clean Address Line */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-sans text-foreground/80">
                <MapPin size={18} weight="bold" className="text-primary shrink-0" />
                <span>{cinema.address}</span>
              </div>

              {/* Status and Phone */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-foreground/70">
                <div className="flex items-center gap-1.5">
                  <Clock size={15} weight="bold" className="text-foreground/60" />
                  <span>{cinema.hours}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={15} weight="bold" className="text-foreground/60" />
                  <span>{cinema.phone}</span>
                </div>
              </div>

              {/* Minimal Keyword Tags for Amenities */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cinema.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-[10px] font-black uppercase border border-foreground/30 px-2 py-0.5 text-foreground/80 bg-background shadow-[1px_1px_0px_0px_var(--border)]"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* GPS Route Icon Button */}
            <div className="self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://maps.google.com/?q=${encodeURIComponent(
                      cinema.name + ' ' + cinema.address
                    )}`,
                    '_blank'
                  )
                }
                className="w-12 h-12 border-2 border-foreground/40 bg-background hover:bg-muted text-foreground flex items-center justify-center cursor-pointer transition-all shadow-[4px_4px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                title="Abrir Rota no Google Maps"
              >
                <NavigationArrow size={22} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. STICKY DATE & FORMAT STRIP (Aligned to Bottom) ─── */}
      <section className="sticky top-0 z-20 bg-background  px-4 sm:px-0 py-3">
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
                  className={`w-14 h-16 sm:w-16 sm:h-18 flex flex-col items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)] -translate-y-0.5'
                      : 'bg-background text-foreground border-foreground/30 hover:border-foreground/60 hover:bg-muted shadow-[2px_2px_0px_0px_var(--border)]'
                  }`}
                >
                  <span className="text-[10px] font-black tracking-wider uppercase">
                    {date.isToday ? 'HOJE' : date.dayOfWeek}
                  </span>
                  <span className="text-base sm:text-lg font-black leading-none my-0.5">
                    {date.dayOfMonth}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-80">
                    {date.month}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Format Chips aligned to bottom */}
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1 shrink-0">
            {availableFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`h-9 px-3 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center justify-center ${
                  selectedFormat === fmt
                    ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                    : 'bg-background text-foreground/80 border-foreground/30 hover:border-foreground/60 hover:bg-muted'
                }`}
              >
                {fmt === 'ALL' ? 'Todos Formatos' : fmt}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 3. PROGRAMAÇÃO DE FILMES & SESSÕES ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            Filmes em Cartaz neste Cinema
          </h2>
          <span className="text-xs font-bold text-foreground/60 font-sans">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'filme disponível' : 'filmes disponíveis'}
          </span>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)]">
            <Clock size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhuma sessão encontrada</h3>
            <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
              Não há sessões com o formato selecionado para esta data. Experimente selecionar outro dia ou &quot;Todos Formatos&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMovies.map((movie) => (
              <article
                key={movie.id}
                className="bg-background border-4 border-foreground/40 p-4 sm:p-6 flex flex-col md:items-start md:flex-row gap-6 transition-all"
              >
                <div className='gap-6 flex flex-col'>
                  <div className="w-28 sm:w-36 aspect-[2/3] shrink-0 border-4 border-foreground/40 bg-foreground/10 overflow-hidden group shadow-[3px_3px_0px_0px_var(--border)]">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform"
                    />
                  </div>
                  <Link
                      to={`/movies/${movie.id}/sessions`}
                      onClick={(e) => e.stopPropagation()}
                      className=" inline-flex items-center gap-1 text-[11px] font-extrabold text-foreground/70 hover:text-primary cursor-pointer w-fit"
                    >
                      <Info size={14} />
                      <span>Ver Detalhes do Filme</span>
                  </Link>
                  </div>
          
                {/* Movie Info + Session Chips */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-[#FF9900] text-white font-black text-[10px] px-1.5 py-0.5">
                        {movie.rating}
                      </span>
                      <span className="font-sans text-xs font-bold text-foreground/60">
                        {movie.duration} • {movie.genres.join(', ')}
                      </span>
                    </div>

                    <Link
                      to={`/movies/${movie.id}/sessions`}
                      className="text-xl sm:text-2xl font-black uppercase text-foreground hover:text-primary transition-colors block"
                    >
                      {movie.title}
                    </Link>

                    <p className="font-sans text-xs text-foreground/75 mt-1.5 line-clamp-2 leading-relaxed max-w-3xl">
                      {movie.synopsis}
                    </p>
                  </div>

                  {/* Sessions grid */}
                  <div className="space-y-2 pt-2 border-t border-foreground/20">
                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground/60 block">
                      Horários Disponíveis:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {movie.sessions.map((sess) => (
                        <SessionChip
                          key={sess.id}
                          time={sess.time}
                          roomName={sess.room}
                          audioFormat={sess.audio}
                          screenFormat={sess.format}
                          onClick={() => navigate(`/checkout/seats?session=${sess.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ─── 4. TABELA DE PREÇOS DO COMPLEXO ─── */}
        <section className="bg-background border-4 border-foreground/40 p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Receipt size={22} weight="bold" />
            <h3 className="text-lg font-black uppercase text-foreground">
              Tabela de Preços e Ingressos
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
            {cinema.pricing.map((item) => (
              <div
                key={item.type}
                className="p-3 bg-background border-2 border-foreground/30 space-y-1"
              >
                <span className="font-display font-black text-foreground uppercase block">
                  {item.type}
                </span>
                <div className="flex justify-between text-foreground/70">
                  <span>Inteira:</span>
                  <span className="font-bold text-foreground">R$ {item.inteira.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Meia-Entrada:</span>
                  <span className="font-bold text-primary">R$ {item.meia.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
