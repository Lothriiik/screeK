import { useState } from 'react';
import { ArrowClockwise, ChatCircle, Heart, Info, Star } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Movie } from '../../types/movie';

interface ProfileReviewCardProps {
  movie: Movie;
  rating: number;
  reviewText: string;
  dateLabel: string;
  likesCount: number;
  commentsCount: number;
  rewatch?: boolean;
  hasSpoiler?: boolean;
}

export function ProfileReviewCard({
  movie,
  rating,
  reviewText,
  dateLabel,
  likesCount,
  commentsCount,
  rewatch = false,
  hasSpoiler = false,
}: ProfileReviewCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likesCount);
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleLike = () => {
    setIsLiked((liked) => !liked);
    setLikes((count) => count + (isLiked ? -1 : 1));
  };

  return (
    <article className="w-full border-4 border-foreground/30 bg-background p-4 font-sans text-foreground shadow-[4px_4px_0px_0px_var(--border)] sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link to={`/movies/${movie.id}`} className="shrink-0 transition-opacity hover:opacity-80">
          <img
            src={movie.poster_url}
            alt={`Pôster de ${movie.title}`}
            className="h-28 w-[4.5rem] border-2 border-foreground/30 object-cover sm:h-32 sm:w-[5.25rem]"
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link to={`/movies/${movie.id}`} className="block truncate font-display text-base font-black text-foreground hover:text-primary sm:text-lg">
              {movie.title}
            </Link>
            <p className="truncate font-sans text-xs font-bold text-foreground/60">
              Dir. <span className="text-primary">{movie.directors.join(', ')}</span>
            </p>
            <p className="font-bold text-xs text-foreground/50">
              {movie.genres[0]} · {movie.release_year} · {movie.duration_display}
            </p>
            <Link to={`/movies/${movie.id}`} className="inline-flex items-center gap-1 pt-2 font-sans text-[10px] font-black text-foreground/60 hover:text-primary">
              <Info size={13} weight="bold" /> Ver detalhes
            </Link>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="inline-flex items-center gap-1 text-secondary">
              <Star size={17} weight="fill" />
              <span className="text-base font-black">{rating.toFixed(1)}</span>
            </span>
            <span className="text-[10px] font-bold uppercase text-foreground/40">{dateLabel}</span>
            {rewatch && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-foreground/50"><ArrowClockwise size={13} /> Revi</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 border-b-2 border-foreground/20 pb-4">
        {hasSpoiler ? (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsRevealed((revealed) => !revealed)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsRevealed((revealed) => !revealed);
                }
              }}
              className="group cursor-pointer border border-dashed border-foreground/30 bg-foreground/5 p-3 transition-colors hover:bg-foreground/10"
              aria-label={isRevealed ? 'Ocultar spoiler' : 'Revelar spoiler'}
            >
              <p className={`font-sans text-xs font-bold leading-relaxed text-foreground/85 transition-all sm:text-sm ${isRevealed ? 'blur-none select-text' : 'blur-sm select-none group-hover:blur-none group-hover:select-text'}`}>
                {reviewText}
              </p>
              <span className="mt-1.5 block font-sans text-[10px] font-extrabold italic text-foreground/50">
                Passe o mouse ou clique para revelar o spoiler
              </span>
            </div>
          </>
        ) : (
          <p className="font-sans text-sm font-semibold leading-relaxed text-foreground/75">{reviewText}</p>
        )}
      </div>

      <footer className="flex items-center gap-4 pt-3 text-xs font-bold text-foreground/50">
        <button type="button" onClick={toggleLike} className={`inline-flex items-center gap-1.5 transition-colors ${isLiked ? 'text-secondary' : 'hover:text-secondary'}`} aria-label={isLiked ? 'Descurtir review' : 'Curtir review'}>
          <Heart size={17} weight={isLiked ? 'fill' : 'bold'} /> {likes}
        </button>
        <span className="inline-flex items-center gap-1.5"><ChatCircle size={17} weight="bold" /> {commentsCount}</span>
        {rewatch && <span className="inline-flex items-center gap-1.5"><ArrowClockwise size={17} weight="bold" /> Reassistido</span>}
      </footer>
    </article>
  );
}
