import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { MOCK_COLLECTIONS } from '../mocks/collections';
import { MOCK_MOVIES } from '../mocks/movies';
import { MoviePosterFan } from '../components/custom/movie-poster-fan';

export function Collections() {
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  const featured = MOCK_COLLECTIONS.find((collection) => collection.featured) || MOCK_COLLECTIONS[0];
  const regularCollections = MOCK_COLLECTIONS.filter((collection) => collection.id !== featured?.id).sort((a, b) => {
    if (sortBy === 'alphabetical') return a.title.localeCompare(b.title, 'pt-BR');
    if (sortBy === 'popular') return b.movies_count - a.movies_count;
    return b.created_at.localeCompare(a.created_at);
  });

  const getMovies = (movieIds: string[]) => movieIds
    .map((id) => MOCK_MOVIES.find((movie) => movie.id === id))
    .filter(Boolean) as typeof MOCK_MOVIES;

  return (
    <div className="bg-background font-display text-foreground">
      <main className="mx-auto max-w-4xl space-y-7 px-4 py-8 md:max-w-5xl lg:max-w-6xl sm:px-0">
        <header>
          <h1 className="text-3xl font-black uppercase tracking-tight text-primary sm:text-5xl">Coleções temáticas</h1>
          <p className="mt-1 max-w-2xl font-sans text-sm text-foreground/65">Filmes reunidos por uma ideia, uma estética ou pelo pulso da comunidade. Quer montar a sua? Veja Listas.</p>
        </header>

        {featured && (
          <Link to={`/collections/${featured.slug}`} className="group relative block min-h-[330px] overflow-hidden border-4 border-foreground/35 bg-[#170a10] sm:min-h-[380px]">
            <img src={featured.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#16080d] via-[#16080d]/95 to-[#16080d]/35" />
            <div className="relative grid min-h-[330px] items-center gap-5 p-5 sm:min-h-[380px] sm:grid-cols-[1fr_0.9fr] sm:p-9">
              <div className="max-w-xl">
                <span className="mb-3 inline-flex items-center gap-1.5 bg-secondary px-2.5 py-1 text-[10px] font-black uppercase text-secondary-foreground">
                  <Sparkle size={13} weight="fill" /> Em destaque · Curadoria screeK
                </span>
                <h2 className="text-3xl font-black uppercase leading-[0.98] text-[#f0dfce] sm:text-5xl">{featured.title}</h2>
                <p className="mt-3 max-w-lg text-sm text-[#f0dfce]/75">{featured.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {featured.tags.slice(0, 5).map((tag) => <span key={tag} className="border border-[#f0dfce]/50 px-2 py-1 text-[10px] font-black uppercase text-[#f0dfce]">{tag}</span>)}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 bg-secondary px-4 py-3 text-[10px] font-black uppercase text-secondary-foreground">
                  Explorar coleção <ArrowRight size={15} weight="bold" />
                </span>
              </div>
              <MoviePosterFan movies={getMovies(featured.movie_ids)} totalCount={featured.movies_count} className="hidden h-64 bg-transparent sm:block" />
            </div>
          </Link>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2">
            <h2 className="text-lg font-black uppercase text-primary">Todas as coleções</h2>
            <label className="relative">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="h-8 appearance-none border-2 border-foreground/30 bg-background pl-3 pr-7 text-[10px] font-black uppercase">
                <option value="recent">Recentes</option><option value="popular">Populares</option><option value="alphabetical">A–Z</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">⌄</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {regularCollections.map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.slug}`} className="group overflow-hidden border-2 border-foreground/40 bg-background transition-transform hover:-translate-y-0.5">
                <div className="relative">
                  <MoviePosterFan movies={getMovies(collection.movie_ids)} totalCount={collection.movies_count} compact className="h-40 border-b-2 border-foreground/35" />
                  <span className={`absolute left-3 top-3 z-20 px-2 py-1 text-[9px] font-black uppercase ${collection.is_algorithmic ? 'border border-dashed border-[#ead9c8] bg-[#170a10]/80 text-[#ead9c8]' : 'bg-primary text-primary-foreground'}`}>
                    {collection.is_algorithmic ? 'Gerada por dados' : 'Curadoria screeK'}
                  </span>
                </div>
                <div className="space-y-2.5 p-3.5">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black uppercase leading-tight transition-colors group-hover:text-primary">{collection.title}</h3>
                  <p className="line-clamp-2 min-h-8 font-sans text-xs leading-relaxed text-foreground/65">{collection.subtitle}</p>
                  <div className="flex items-center justify-between border-t border-foreground/15 pt-2 text-[9px] font-mono font-black uppercase text-foreground/55">
                    <span>{collection.movies_count} filmes</span>
                    <span className="text-primary">Explorar ›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
