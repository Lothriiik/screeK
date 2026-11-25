import { Heart } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { MOCK_MOVIES } from '../../mocks/movies';
import type { MovieList } from '../../types/social';
import { MoviePosterFan } from './movie-poster-fan';

interface MovieListCardProps {
  list: MovieList;
  showAuthor?: boolean;
}

export function MovieListCard({ list, showAuthor = true }: MovieListCardProps) {
  const listMovies = list.movie_ids
    .map((id) => MOCK_MOVIES.find((movie) => movie.id === id))
    .filter(Boolean);

  return (
    <Link to={`/lists/${list.id}`} className="group flex h-full flex-col overflow-hidden border-2 border-foreground/40 bg-background transition-transform hover:-translate-y-0.5">
      <MoviePosterFan movies={listMovies as NonNullable<typeof listMovies[number]>[]} totalCount={list.movie_ids.length} showTotalBadge compact className="h-36 border-b-2 border-foreground/35" />
      <div className="flex flex-1 flex-col gap-2 bg-background p-3">
        <h3 className="line-clamp-2 min-h-9 text-xs font-black uppercase leading-tight transition-colors group-hover:text-primary">{list.title}</h3>
        <p className="line-clamp-2 min-h-8 font-sans text-[10px] leading-relaxed text-foreground/65">{list.description}</p>
        {!!list.tags?.length && <div className="flex flex-wrap gap-1">{list.tags.slice(0, 3).map((tag) => <span key={tag} className="border border-foreground/35 px-1.5 py-0.5 text-[8px] font-black uppercase">{tag}</span>)}</div>}
        <div className="mt-auto flex items-center justify-between border-t border-foreground/15 pt-2 text-[10px] font-bold text-foreground/60">
          {showAuthor ? <span className="max-w-[110px] truncate">@{list.author_username}</span> : <span />}
          <span className="flex items-center gap-1 font-black text-primary"><Heart size={13} weight="fill" /> {list.likes_count}</span>
        </div>
      </div>
    </Link>
  );
}
