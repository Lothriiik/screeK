import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';

export type MovieTagType = 'none' | 'pre_sale' | 'release' | 're_release';

export interface MovieCardProps {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  duration?: string; // e.g. "1h57", "1h39"
  genre?: string;    // e.g. "CRIME", "DRAMA", "ANIMATION", "ACTION", "ROMANCE"
  ageRating?: 'L' | '10' | '12' | '14' | '16' | '18';
  tagType?: MovieTagType; // 'pre_sale' | 'release' | 're_release'
  eventLabel?: string;    // e.g. "ESTREIA 08/04", "REEXIBIÇÃO 08/04", "ESTREIA"
  releaseDate?: string;   // e.g. "03/04", "05/04", "04/04", "08/04"
  isPreSale?: boolean;
  linkTo?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  id,
  title,
  posterUrl,
  rating,
  duration = '1h57',
  genre = 'DRAMA',
  ageRating = 'L',
  tagType = 'none',
  eventLabel,
  releaseDate,
  isPreSale = false,
  linkTo,
}) => {
  const isPreSaleActive = isPreSale || tagType === 'pre_sale';
  const isReRelease = tagType === 're_release' || (eventLabel && eventLabel.includes('REEXIBIÇÃO'));

  const ageRatingBg =
    ageRating === 'L'
      ? 'bg-[#34A853]'
      : ageRating === '18'
      ? 'bg-[#DC3545]'
      : ageRating === '16'
      ? 'bg-[#FF9900]'
      : ageRating === '14'
      ? 'bg-[#D4A338]'
      : 'bg-[#3B82F6]';

  // Release date extraction if eventLabel had date
  const displayReleaseDate =
    releaseDate ||
    (eventLabel && eventLabel.includes('/') ? eventLabel.replace(/ESTREIA\s*|REEXIBIÇÃO\s*/gi, '').trim() : undefined);

  const targetLink = linkTo || `/movies/${id}/sessions`;

  return (
    <Link
      to={targetLink}
      className={`group relative flex flex-col rounded-none border-4 font-display transition-all hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden bg-background ${
        isPreSaleActive
          ? 'border-secondary'
          : 'border-foreground/40 hover:border-primary'
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-foreground/10 overflow-hidden">
        <img
          src={posterUrl}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Top-Left Release Date Badge (when available) */}
        {displayReleaseDate && (
          <div
            className={`absolute top-2 left-2 z-10 font-display font-black text-xs px-2 py-0.5 tracking-wider shadow-sm ${
              isPreSaleActive
                ? 'bg-secondary text-secondary-foreground'
                : isReRelease
                ? 'bg-[#1E2B45] text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {displayReleaseDate}
          </div>
        )}

        {/* Top-Right Age Rating Badge */}
        {ageRating && (
          <div
            className={`absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center text-xs font-black text-white shadow-sm ${ageRatingBg}`}
          >
            {ageRating}
          </div>
        )}

        {/* Bottom Banner inside poster (for Pré-Venda or Reexibição) */}
        {(isPreSaleActive || isReRelease || (!displayReleaseDate && eventLabel)) && (
          <div
            className={`absolute bottom-0 inset-x-0 z-10 text-center py-1 text-[10px] font-black uppercase tracking-widest border-t-2 shadow-sm ${
              isPreSaleActive
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : isReRelease
                ? 'bg-[#1E2B45] text-white border-foreground/40'
                : 'bg-primary text-primary-foreground border-primary'
            }`}
          >
            {isPreSaleActive ? 'PRÉ-VENDA' : isReRelease ? 'REEXIBIÇÃO' : eventLabel || 'ESTREIA'}
          </div>
        )}
      </div>

      <div className="flex flex-col p-3 border-t-2 border-foreground/40 bg-background justify-between flex-1 space-y-2">
        <h3 className="h-8 sm:h-9 min-h-[2rem] sm:min-h-[2.25rem] text-xs sm:text-sm font-extrabold uppercase text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors overflow-hidden">
          {title}
        </h3>

        <div className="flex items-center justify-between text-[10px] font-bold text-foreground/60">
          <div className="flex items-center gap-1.5">
            <span className="border border-foreground/40 bg-foreground/10 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground uppercase">
              {genre}
            </span>
            <span>{duration}</span>
          </div>

          {rating !== undefined && (
            <div className="flex items-center gap-1 text-primary font-black text-xs">
              <Star size={14} weight="bold" className="text-primary" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
