import { movieRouteId } from '../../lib/movie-route';
import { Armchair, CaretRight, Clock, MapPin, NavigationArrow } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_CINEMAS, MOCK_SESSIONS, getMovieById } from '../../mocks';
import type { Cinema } from '../../types/cinema';
import { SessionChip } from './session-card';

export interface CinemaListing extends Cinema {
  moviesToday: {
    id: string;
    title: string;
    poster: string;
    rating: string;
    sessions: { id: string; time: string; format: string; audio: string }[];
  }[];
}

export function getCinemaListings(): CinemaListing[] {
  return MOCK_CINEMAS.map((cinema) => {
    const movies = new Map<string, CinemaListing['moviesToday'][number]>();
    MOCK_SESSIONS.filter((session) => session.cinema_id === cinema.id).forEach((session) => {
      const movie = getMovieById(session.movie_id);
      if (!movie) return;
      if (!movies.has(movie.id)) {
        movies.set(movie.id, { id: movie.id, title: movie.title, poster: movie.poster_url, rating: movie.age_rating, sessions: [] });
      }
      movies.get(movie.id)!.sessions.push({ id: session.id, time: session.start_time, format: session.format, audio: session.audio });
    });
    return { ...cinema, moviesToday: Array.from(movies.values()) };
  });
}

export function CinemaListingCard({ cinema }: { cinema: CinemaListing }) {
  const navigate = useNavigate();
  return (
    <article className="overflow-hidden border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] transition-all duration-200">
      <div className="flex flex-col justify-between gap-4 border-b-2 border-foreground/30 p-4 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">{cinema.chain}</span>
            <span className="font-sans text-xs font-black text-foreground/60">· {cinema.rooms_count} Salas</span>
          </div>
          <Link to={`/cinemas/${cinema.id}`} className="block text-xl font-black uppercase text-foreground transition-colors hover:text-primary sm:text-2xl">{cinema.name}</Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="shrink-0 text-foreground/60" />{cinema.address}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={15} className="shrink-0 text-foreground/60" />{cinema.hours}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">{cinema.amenities.map((amenity) => <span key={amenity} className="border border-foreground/30 bg-background px-2 py-0.5 text-[10px] font-black uppercase text-foreground/80">{amenity}</span>)}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start md:self-center">
          <button type="button" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${cinema.name} ${cinema.address}`)}`, '_blank')} title="Abrir no Google Maps" className="flex h-10 w-10 items-center justify-center border-2 border-foreground/40 bg-background text-foreground shadow-[2px_2px_0px_0px_var(--border)] hover:bg-muted"><NavigationArrow size={18} weight="bold" /></button>
          <Link to={`/cinemas/${cinema.id}`} className="flex items-center gap-1.5 border-2 border-primary bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)] hover:bg-primary/90">Ver Programação <CaretRight size={14} weight="bold" /></Link>
        </div>
      </div>
      <div className="space-y-4 bg-background p-4 sm:p-6">
        <span className="block text-xs font-black uppercase tracking-wider text-foreground/60">Em Exibição Hoje:</span>
        {cinema.moviesToday.length === 0 ? <p className="font-sans text-xs italic text-foreground/60">Nenhuma sessão disponível para hoje neste complexo.</p> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cinema.moviesToday.map((movie) => <div key={movie.id} className="flex gap-3 border-2 border-foreground/30 bg-background p-3 transition-colors hover:border-foreground/60">
              <Link to={`/movies/${movieRouteId(movie)}/sessions`} className="group shrink-0"><img src={movie.poster} alt={movie.title} className="h-24 w-16 border border-foreground/30 object-cover transition-colors group-hover:border-primary" /></Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between space-y-2">
                <div><Link to={`/movies/${movieRouteId(movie)}/sessions`} className="block line-clamp-1 text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary">{movie.title}</Link><span className="font-sans text-[10px] font-bold text-foreground/60">Classificação: {movie.rating} anos</span></div>
                <div className="flex flex-wrap gap-1.5">{movie.sessions.map((session) => <SessionChip key={session.id} time={session.time} roomName="" screenFormat={session.format} audioFormat={session.audio} inline compact onClick={() => navigate(`/checkout/seats?session=${session.id}`)} />)}</div>
              </div>
            </div>)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-foreground/20 bg-background px-4 py-2.5 font-sans text-[11px] text-foreground/70 sm:px-6">
        <span className="flex items-center gap-1.5 font-bold"><Armchair size={14} weight="bold" />Assentos numerados com reserva em tempo real</span>
        <span className="font-bold">Tel: {cinema.phone}</span>
      </div>
    </article>
  );
}
