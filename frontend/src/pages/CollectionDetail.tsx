import { movieRouteId } from '../lib/movie-route';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react';
import { MOCK_COLLECTIONS } from '../mocks/collections';
import { MOCK_MOVIES } from '../mocks/movies';
import { MovieCard } from '../components/custom/movie-card';
import { MoviePosterFan } from '../components/custom/movie-poster-fan';

export function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const collection = MOCK_COLLECTIONS.find((item) => item.slug === slug);

  if (!collection) return <div className="p-12 text-center font-display"><h1 className="text-2xl font-black uppercase">Coleção não encontrada</h1><Link to="/collections" className="mt-4 inline-block text-sm font-black uppercase text-primary">Voltar às coleções</Link></div>;

  const movies = collection.movie_ids.map((id) => MOCK_MOVIES.find((movie) => movie.id === id)).filter(Boolean);
  const originLabel = collection.is_algorithmic ? 'Gerada por dados' : 'Curadoria screeK';

  return (
    <div className="bg-background font-display text-foreground">
      <section className="relative overflow-hidden bg-[#17090e] px-4 py-8 text-[#f0dfce] sm:px-0">
        <img src={collection.backdrop_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17090e]/95 via-[#17090e]/90 to-[#17090e]/65" />
        <div className="relative mx-auto grid max-w-4xl items-center gap-6 md:max-w-5xl lg:max-w-6xl lg:grid-cols-[1fr_0.8fr]">
          <div>
            <Link to="/collections" className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase text-[#f0dfce]/65 hover:text-[#f0dfce]"><ArrowLeft size={15} /> Todas as coleções</Link>
            <span className={`mb-2 flex w-fit items-center gap-1.5 text-[10px] font-black uppercase ${collection.is_algorithmic ? 'border border-dashed border-[#f0dfce]/60 px-2 py-1 text-[#f0dfce]' : 'text-secondary'}`}>
              {!collection.is_algorithmic && <Sparkle size={13} weight="fill" />}{originLabel}
            </span>
            <h1 className="text-3xl font-black uppercase leading-none sm:text-5xl">{collection.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#f0dfce]/75">{collection.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{collection.tags.map((tag) => <span key={tag} className="border border-[#f0dfce]/45 px-2 py-1 text-[9px] font-black uppercase">{tag}</span>)}</div>
            <div className="mt-5 flex items-center gap-3 text-xs font-bold text-[#f0dfce]/75">
              <img src={collection.curator.avatar_url} alt="" className="h-8 w-8 border border-[#f0dfce]/40 object-cover" />
              Curadoria por {collection.curator.name} · {collection.movies_count} filmes
            </div>
          </div>
          <MoviePosterFan movies={movies.filter(Boolean) as typeof MOCK_MOVIES} totalCount={collection.movies_count} className="hidden h-64 bg-transparent sm:block" />
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-4 py-7 md:max-w-5xl lg:max-w-6xl sm:px-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => movie && <MovieCard key={movie.id} id={movie.id} title={movie.title} posterUrl={movie.poster_url} rating={movie.global_rating} duration={movie.duration_display} genre={movie.genres[0]} ageRating={movie.age_rating} linkTo={`/movies/${movieRouteId(movie)}`} />)}
        </div>
      </main>
    </div>
  );
}
