import React from 'react';
import { Link } from 'react-router-dom';
import { FilmStrip, Heart } from '@phosphor-icons/react';
import type { PersonWithRole } from '../../mocks/people';

interface PersonCardProps {
  person: PersonWithRole;
  className?: string;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, className = '' }) => {
  const cleanCountry = person.country
    ? person.country.replace(/^[A-Za-z]{2}\s+/, '').trim()
    : undefined;

  return (
    <Link
      to={`/people/${person.id}`}
      className={`group relative flex flex-col w-[165px] sm:w-[190px] shrink-0 rounded-none border-4 border-foreground/40 hover:border-primary font-display transition-all hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden bg-background text-left ${className}`}
    >
      {/* Photo Container (same 2:3 ratio and bottom banner as MovieCard) */}
      <div className="relative aspect-[2/3] w-full bg-foreground/10 overflow-hidden">
        {person.profile_url ? (
          <img
            src={person.profile_url}
            alt={person.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-black text-foreground/50">
            {person.initials || person.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Bottom Role Banner (matches ESTREIA / REEXIBIÇÃO bar on MovieCard) */}
        <div className="absolute bottom-0 inset-x-0 z-10 text-center py-1 px-2 text-[10px] font-black uppercase tracking-widest border-t-2 bg-primary text-primary-foreground border-primary shadow-sm truncate">
          {person.role_display}
        </div>
      </div>

      {/* Info Footer (same padding, border-t-2, uppercase title, and chip + stat row as MovieCard) */}
      <div className="flex flex-col p-3 border-t-2 border-foreground/40 bg-background justify-between flex-1 space-y-2">
        <h3 className="h-8 sm:h-9 min-h-[2rem] sm:min-h-[2.25rem] text-xs sm:text-sm font-extrabold uppercase text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors overflow-hidden">
          {person.name}
        </h3>

        <div className="flex items-center justify-between text-[10px] font-bold text-foreground/60">
          <div className="flex items-center gap-1.5 min-w-0">
            {cleanCountry && (
              <span className="border border-foreground/40 bg-foreground/10 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground uppercase truncate">
                {cleanCountry}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 shrink-0" title="Filmes no acervo">
              <FilmStrip size={12} weight="bold" />
              {person.movies_count ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-1 text-primary font-black text-xs shrink-0" title="Favoritos">
            <Heart size={13} weight="bold" className="text-primary" />
            <span>{person.favorites_count ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
