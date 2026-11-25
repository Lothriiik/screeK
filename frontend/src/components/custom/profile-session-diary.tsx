import { movieRouteId } from '../../lib/movie-route';
import { Fragment } from 'react';
import { ArrowClockwise, ChatText, Heart } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Movie } from '../../types/movie';

export interface ProfileDiaryEntry {
  movie: Movie;
  watchedAt: string;
  rating: number;
  liked: boolean;
  rewatch: boolean;
  hasReview: boolean;
}

interface ProfileSessionDiaryProps {
  entries: ProfileDiaryEntry[];
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

function formatDate(date: string) {
  return date.slice(8, 10);
}

function formatMonth(date: string) {
  return monthFormatter.format(new Date(`${date}T12:00:00`)).replace(/^./, (letter) => letter.toUpperCase());
}

export function ProfileSessionDiary({ entries }: ProfileSessionDiaryProps) {
  const groupedEntries = entries.reduce<Record<string, ProfileDiaryEntry[]>>((groups, entry) => {
    const month = entry.watchedAt.slice(0, 7);
    groups[month] = [...(groups[month] || []), entry];
    return groups;
  }, {});

  return (
    <div className="overflow-x-auto border-2 border-foreground/30 bg-background">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-foreground/30 bg-muted/30 text-[10px] font-black uppercase tracking-wider text-foreground/50">
            <th className="px-3 py-2">Dia</th>
            <th className="px-3 py-2">Filme</th>
            <th className="px-3 py-2 text-center">Ano</th>
            <th className="px-3 py-2 text-center">Nota</th>
            <th className="px-3 py-2 text-center">Gostei</th>
            <th className="px-3 py-2 text-center">Revi</th>
            <th className="px-3 py-2 text-center">Review</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedEntries).map(([month, monthEntries]) => (
            <Fragment key={month}>
              <tr key={`${month}-header`} className="border-b border-foreground/20 bg-muted/20">
                <th colSpan={7} className="px-3 py-2 text-xs font-black uppercase tracking-wider text-primary">
                  {formatMonth(`${month}-01`)} <span className="font-mono text-foreground/40">- {monthEntries.length} sessões</span>
                </th>
              </tr>
              {monthEntries.map((entry) => (
                <tr key={`${entry.watchedAt}-${entry.movie.id}`} className="border-b border-foreground/15 last:border-b-0 hover:bg-muted/20">
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center bg-primary/10 px-1.5 font-mono text-base font-black text-primary">
                      {formatDate(entry.watchedAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/movies/${movieRouteId(entry.movie)}`} className="flex w-fit items-center gap-2 text-sm font-black text-foreground transition-colors hover:text-primary">
                      <img src={entry.movie.poster_url} alt="" className="h-12 w-8 shrink-0 border border-foreground/30 object-cover" />
                      <span>{entry.movie.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-mono text-foreground/60">{entry.movie.release_year}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-center text-sm font-black text-secondary">★ {entry.rating.toFixed(1)}</td>
                  <td className="px-3 py-2 text-center">
                    {entry.liked && <Heart size={16} weight="fill" className="mx-auto text-secondary" aria-label="Filme curtido" />}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {entry.rewatch && <ArrowClockwise size={16} weight="bold" className="mx-auto text-foreground/50" aria-label="Reassistido" />}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {entry.hasReview && <ChatText size={16} weight="bold" className="mx-auto text-foreground/50" aria-label="Tem review" />}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
