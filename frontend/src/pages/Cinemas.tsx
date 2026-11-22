import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  MapPin,
  Clock,
  CaretRight,
  SlidersHorizontal,
  NavigationArrow,
  Armchair
} from '@phosphor-icons/react';
import { MOCK_CINEMAS, MOCK_SESSIONS, getMovieById } from '../mocks';

const AMENITY_FILTERS = [
  'IMAX',
  'VIP',
  '4DX',
  'DOLBY',
  'D-BOX',
  'CINÉPIC',
  'ESTACIONAMENTO',
];

export function Cinemas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Build cinema list with their current sessions from mock store
  const cinemasWithSessions = MOCK_CINEMAS.map((cinema) => {
    const sessions = MOCK_SESSIONS.filter((s) => s.cinema_id === cinema.id);
    
    // Group sessions by movie
    const movieMap = new Map<
      string,
      {
        id: string;
        title: string;
        poster: string;
        rating: string;
        sessions: { id: string; time: string; format: string; audio: string }[];
      }
    >();

    sessions.forEach((s) => {
      const movie = getMovieById(s.movie_id);
      if (!movie) return;

      if (!movieMap.has(s.movie_id)) {
        movieMap.set(s.movie_id, {
          id: movie.id,
          title: movie.title,
          poster: movie.poster_url,
          rating: movie.age_rating,
          sessions: [],
        });
      }

      movieMap.get(s.movie_id)!.sessions.push({
        id: s.id,
        time: s.start_time,
        format: s.format,
        audio: s.audio,
      });
    });

    return {
      ...cinema,
      moviesToday: Array.from(movieMap.values()),
    };
  });

  // Filter cinemas
  const filteredCinemas = cinemasWithSessions.filter((cinema) => {
    const matchesSearch =
      cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.chain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((a) =>
        cinema.amenities.some((ca) => ca.toUpperCase().includes(a.toUpperCase()))
      );

    return matchesSearch && matchesAmenities;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. TOP HEADER & SEARCH ─── */}
      <section className="bg-background py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-primary tracking-tight">
                Cinemas
              </h1>
            </div>
          </div>

          {/* Search Bar + Icon-only Filter Toggle Button */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/50"
                weight="bold"
              />
              <input
                type="text"
                placeholder="Buscar por cinema, shopping, rede ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-foreground/40 text-xs sm:text-sm font-sans text-foreground placeholder:text-foreground/50 outline-none focus:border-primary shadow-[3px_3px_0px_0px_var(--border)]"
              />
            </div>

            {/* Filter Toggle Button (Icon Only) */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              title="Filtros de Comodidades"
              className={`w-11 h-11 border-2 flex items-center justify-center cursor-pointer transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 shrink-0 ${
                showFilters || selectedAmenities.length > 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-foreground/40 hover:bg-muted'
              }`}
            >
              <SlidersHorizontal size={18} weight="bold" />
            </button>
          </div>

          {/* Expandable Filter Chips Drawer */}
          {showFilters && (
            <div className="bg-background space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="block text-[11px] font-black uppercase text-foreground/60">
                Filtrar por Comodidades &amp; Recursos:
              </span>
              <div className="flex flex-wrap gap-2">
                {AMENITY_FILTERS.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 text-xs font-black uppercase transition-all cursor-pointer border ${
                        isChecked
                          ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                          : 'bg-background text-foreground/80 border-foreground/30 hover:bg-muted'
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}

                {selectedAmenities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAmenities([])}
                    className="px-2.5 py-1 text-xs font-black uppercase text-foreground/60 hover:text-foreground border border-transparent underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Summary line */}
          <div className="flex items-center justify-between text-xs font-bold text-foreground/60 pt-1">
            <span>
              {filteredCinemas.length} {filteredCinemas.length === 1 ? 'complexo encontrado' : 'complexos encontrados'}
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. CINEMA LISTINGS ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {filteredCinemas.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)]">
            <MapPin size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhum cinema encontrado</h3>
            <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
              Tente alterar os termos de busca ou remover alguns filtros de recursos.
            </p>
          </div>
        ) : (
          filteredCinemas.map((cinema) => (
            <article
              key={cinema.id}
              className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden transition-all duration-200"
            >
              {/* Cinema Header Banner */}
              <div className="p-4 sm:p-6 border-b-2 border-foreground/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Info: Name, Address, Hours */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary text-primary-foreground font-black text-[10px] px-2 py-0.5 uppercase tracking-wider">
                      {cinema.chain}
                    </span>
                    <span className="font-sans text-xs font-black text-foreground/60">
                      • {cinema.rooms_count} Salas
                    </span>
                  </div>

                  <Link
                    to={`/cinemas/${cinema.id}`}
                    className="text-xl sm:text-2xl font-black uppercase text-foreground hover:text-primary transition-colors block"
                  >
                    {cinema.name}
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-sans text-foreground/70">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} weight="bold" className="text-foreground/60 shrink-0" />
                      <span>{cinema.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock size={15} weight="bold" className="text-foreground/60 shrink-0" />
                      <span>{cinema.hours}</span>
                    </div>
                  </div>

                  {/* Amenity tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cinema.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="text-[10px] font-black uppercase border border-foreground/30 px-2 py-0.5 text-foreground/80 bg-background"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Actions: View details & GPS navigation icon */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {/* GPS Icon-only Button */}
                  <button
                    type="button"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(cinema.name + ' ' + cinema.address)}`, '_blank')}
                    title="Abrir no Google Maps"
                    className="w-10 h-10 border-2 border-foreground/40 bg-background hover:bg-muted text-foreground flex items-center justify-center cursor-pointer transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <NavigationArrow size={18} weight="bold" />
                  </button>

                  {/* See full schedule */}
                  <Link
                    to={`/cinemas/${cinema.id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
                  >
                    <span>Ver Programação</span>
                    <CaretRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Cinema Movies In Exhibition Today */}
              <div className="p-4 sm:p-6 bg-background space-y-4">
                <span className="block text-xs font-black uppercase tracking-wider text-foreground/60">
                  Em Exibição Hoje:
                </span>

                {cinema.moviesToday.length === 0 ? (
                  <p className="font-sans text-xs text-foreground/60 italic">
                    Nenhuma sessão disponível para hoje neste complexo.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cinema.moviesToday.map((movie) => (
                      <div
                        key={movie.id}
                        className="bg-background border-2 border-foreground/30 p-3 flex gap-3 hover:border-foreground/60 transition-colors"
                      >
                        {/* Poster */}
                        <Link to={`/movies/${movie.id}/sessions`} className="shrink-0 group">
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-16 h-24 object-cover border border-foreground/30 group-hover:border-primary transition-colors"
                          />
                        </Link>

                        {/* Info & Session Pills */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <Link
                              to={`/movies/${movie.id}/sessions`}
                              className="text-xs font-extrabold uppercase text-foreground hover:text-primary line-clamp-1 block transition-colors"
                            >
                              {movie.title}
                            </Link>
                            <span className="font-sans text-[10px] font-bold text-foreground/60">
                              Classificação: {movie.rating} anos
                            </span>
                          </div>

                          {/* Sessions Time Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {movie.sessions.map((sess) => (
                              <button
                                key={sess.id}
                                type="button"
                                onClick={() => navigate(`/checkout/seats?session=${sess.id}`)}
                                className="px-2 py-1 bg-background hover:bg-primary hover:text-primary-foreground border border-foreground/40 text-[10px] font-black uppercase transition-all shadow-[1px_1px_0px_0px_var(--border)] cursor-pointer flex items-center gap-1 group/btn"
                              >
                                <span>{sess.time}</span>
                                <span className="text-[9px] font-bold text-foreground/60 group-hover/btn:text-primary-foreground">
                                  {sess.format}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer info strip */}
              <div className="px-4 sm:px-6 py-2.5 bg-background border-t-2 border-foreground/20 flex flex-wrap items-center justify-between text-[11px] font-sans text-foreground/70">
                <span className="flex items-center gap-1.5 font-bold">
                  <Armchair size={14} weight="bold" />
                  Assentos numerados com reserva em tempo real
                </span>
                <span className="font-bold">
                  Tel: {cinema.phone}
                </span>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
