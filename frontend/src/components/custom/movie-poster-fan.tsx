import type { Movie } from '../../types/movie';

interface MoviePosterFanProps {
  movies: Movie[];
  totalCount?: number;
  className?: string;
  compact?: boolean;
  showTotalBadge?: boolean;
}

export function MoviePosterFan({ movies, totalCount = movies.length, className = '', compact = false, showTotalBadge = false }: MoviePosterFanProps) {
  const rotations = [-9, -4, 3, 9];

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br from-[#260c18] via-[#170d18] to-[#0d1823] ${className}`}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #9b315f 0, transparent 45%)' }} />
      {movies.slice(0, 4).map((movie, index) => (
        <img
          key={movie.id}
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          className={`absolute bottom-2 border-2 border-[#ead9c8] object-cover shadow-[0_6px_14px_rgba(0,0,0,.35)] transition-transform duration-300 group-hover:translate-y-[-3px] ${compact ? 'h-28 w-[72px] sm:h-32 sm:w-[82px]' : 'h-36 w-24 sm:h-40 sm:w-[108px]'}`}
          style={{
            left: `${8 + index * (compact ? 15 : 13)}%`,
            zIndex: index + 1,
            transform: `rotate(${rotations[index]}deg)`,
          }}
        />
      ))}
      {showTotalBadge && <span className="absolute right-2 top-2 z-20 bg-[#16080d]/90 px-2 py-1 text-[9px] font-black uppercase text-[#f0dfce]">{totalCount} filmes</span>}
      {totalCount > 4 && (
        <span className="absolute bottom-3 right-3 z-10 bg-background/90 px-2 py-1 text-xs font-black text-foreground">
          +{totalCount - 4}
        </span>
      )}
    </div>
  );
}
