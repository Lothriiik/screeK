import { FilmStrip, Heart } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { MOCK_MOVIES } from '../../mocks/movies';
import type { MovieList } from '../../types/social';
import { TagChip } from './tag-chip';

interface MovieListCardProps {
  list: MovieList;
  showAuthor?: boolean;
}

export function MovieListCard({ list, showAuthor = true }: MovieListCardProps) {
  const listMovies = list.movie_ids
    .map((id) => MOCK_MOVIES.find((movie) => movie.id === id))
    .filter(Boolean);

  return (
    <Link
      to={`/lists/${list.id}`}
      className="group flex flex-col justify-between overflow-hidden border-4 border-foreground/40 bg-background shadow-[4px_4px_0px_0px_var(--border)] transition-all hover:-translate-y-1 hover:border-primary"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-foreground/40 bg-foreground/10">
        {list.backdrop_url ? (
          <img
            src={list.backdrop_url}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FilmStrip size={28} className="text-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {listMovies.length > 0 && (
          <div className="absolute bottom-2 left-2.5 flex -space-x-2 items-center">
            {listMovies.slice(0, 3).map((movie) => (
              <div
                key={movie!.id}
                className="aspect-[2/3] w-7 shrink-0 overflow-hidden border border-background bg-muted shadow-sm"
              >
                <img src={movie!.poster_url} alt={movie!.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <span className="absolute right-2 top-2 bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-sm">
          {list.movie_ids.length} Filmes
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-2 bg-background p-3">
        <h3 className="line-clamp-2 h-8 min-h-[2rem] text-xs font-extrabold uppercase leading-tight text-foreground transition-colors group-hover:text-primary">
          {list.title}
        </h3>

        {!!list.tags?.length && (
          <div className="flex flex-wrap gap-1">
            {list.tags.slice(0, 2).map((tag) => <TagChip key={tag} tag={tag} size="sm" />)}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-foreground/20 pt-1.5 text-[10px] font-bold text-foreground/60">
          {showAuthor ? <span className="max-w-[110px] truncate">@{list.author_username}</span> : <span />}
          <span className="flex items-center gap-1 text-xs font-black text-primary">
            <Heart size={13} weight="fill" className="text-primary" />
            <span>{list.likes_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
