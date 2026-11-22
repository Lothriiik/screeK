import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { MOCK_COLLECTIONS } from '../mocks/collections';
import { MOCK_MOVIES } from '../mocks/movies';

export function Collections() {
  return (
    <div className="min-h-screen bg-background pb-24 font-display text-foreground">
      <header className="border-b-4 border-foreground/30 px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl"><span className="font-mono text-[11px] font-black uppercase tracking-widest text-primary">Curadoria screeK</span><h1 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-5xl">Coleções temáticas</h1><p className="mt-2 max-w-2xl font-sans text-sm text-foreground/65">Filmes reunidos por uma ideia, uma estética ou pelo pulso da comunidade.</p></div></header>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        {MOCK_COLLECTIONS.map((collection) => {
          const movies = collection.movie_ids.map((id) => MOCK_MOVIES.find((movie) => movie.id === id)).filter(Boolean);
          return <Link key={collection.id} to={`/collections/${collection.slug}`} className="group block overflow-hidden border-4 border-foreground/35 bg-card shadow-[6px_6px_0px_0px_var(--border)] transition-transform hover:-translate-y-1"><div className="relative min-h-[270px] overflow-hidden p-6 sm:min-h-[340px] sm:p-10"><img src={collection.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/15" /><div className="relative flex min-h-[220px] flex-col justify-between sm:min-h-[260px]"><div className="max-w-xl"><div className="mb-4 flex flex-wrap gap-2">{collection.tags.map((tag) => <span key={tag} className="border border-foreground/30 bg-background/75 px-2 py-1 font-mono text-[10px] font-black uppercase">#{tag}</span>)}</div><span className="font-mono text-[10px] font-black uppercase text-primary">{collection.is_algorithmic ? 'Gerada por dados' : 'Curadoria editorial'}</span><h2 className="mt-1 text-3xl font-black uppercase leading-none sm:text-5xl">{collection.title}</h2><p className="mt-3 max-w-lg font-sans text-sm text-foreground/75">{collection.subtitle}</p></div><div className="flex items-end justify-between gap-4"><div className="flex -space-x-3">{movies.map((movie) => <img key={movie!.id} src={movie!.poster_url} alt={movie!.title} className="h-16 w-11 border-2 border-background object-cover sm:h-20 sm:w-14" />)}</div><span className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 text-xs font-black uppercase">Explorar <ArrowRight size={16} weight="bold" /></span></div></div></div></Link>;
        })}
      </main>
    </div>
  );
}