import { movieRouteId } from '../lib/movie-route';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MagnifyingGlass,
  X,
  FilmStrip,
  Users,
  User,
  Sparkle,
  Spinner,
  BookmarksSimple,
  MapPin,
} from '@phosphor-icons/react';
import { MovieCard } from '../components/custom/movie-card';
import { UserCard } from '../components/custom/user-card';
import { MovieListCard } from '../components/custom/movie-list-card';
import { CinemaListingCard, getCinemaListings } from '../components/custom/cinema-listing-card';
import { EmptyState } from '../components/custom/empty-state';
import { SearchResultCount } from '../components/custom/search-result-count';
import { MOCK_MOVIES, MOCK_PEOPLE, MOCK_USERS } from '../mocks';
import { MOCK_MOVIE_LISTS } from '../mocks/lists';

import { movieService } from '../services/movieService';
import type { Movie } from '../types/movie';

type SearchTab = 'movies' | 'people' | 'users' | 'lists' | 'cinemas';

const VIBE_SUGGESTIONS = [
  'Terror',
  'Sci-Fi',
  'Anime',
  'Cult',
  'Wachowski',
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') as SearchTab) || 'movies';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [movieFilter, setMovieFilter] = useState<'ALL' | 'now_playing' | 're_release' | 'upcoming'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const [liveMovies, setLiveMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [livePeople, setLivePeople] = useState<any[]>(MOCK_PEOPLE);
  const [liveUsers, setLiveUsers] = useState<any[]>(MOCK_USERS);

  // Live Debounce Search
  useEffect(() => {
    const cleanQ = query.trim();
    if (!cleanQ) {
      setLiveMovies(MOCK_MOVIES);
      setLivePeople(MOCK_PEOPLE);
      setLiveUsers(MOCK_USERS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (activeTab === 'movies') {
          const movies = await movieService.search(cleanQ, 'MOVIE');
          setLiveMovies(movies);
        } else if (activeTab === 'people') {
          const people = await movieService.search(cleanQ, 'PERSON');
          setLivePeople(people);
        } else if (activeTab === 'users') {
          const users = await movieService.search(cleanQ, 'USER');
          setLiveUsers(users);
        }
      } catch {
        // Fallback already handled inside movieService
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val, tab: activeTab });
    } else {
      setSearchParams({ tab: activeTab });
    }
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (query.trim()) {
      setSearchParams({ q: query, tab });
    } else {
      setSearchParams({ tab });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchParams({ tab: activeTab });
  };

  // Filtered Movies by sub-status
  const filteredMovies = useMemo(() => {
    return liveMovies.filter((m) => {
      if (movieFilter !== 'ALL' && m.status !== movieFilter) {
        return false;
      }
      return true;
    });
  }, [liveMovies, movieFilter]);

  // Filtered People
  const filteredPeople = livePeople;

  // Filtered Users
  const filteredUsers = liveUsers;

  // Filtered Lists
  const filteredLists = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return MOCK_MOVIE_LISTS;
    return MOCK_MOVIE_LISTS.filter(
      (l) =>
        l.title.toLowerCase().includes(cleanQ) ||
        l.description.toLowerCase().includes(cleanQ) ||
        l.tags?.some((t) => t.toLowerCase().includes(cleanQ))
    );
  }, [query]);

  // Filtered Cinemas
  const cinemaListings = useMemo(() => getCinemaListings(), []);
  const filteredCinemas = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return [...cinemaListings].sort((a, b) => Number.parseFloat(a.distance || '999') - Number.parseFloat(b.distance || '999'));
    return cinemaListings.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQ) ||
        c.chain.toLowerCase().includes(cleanQ) ||
        c.neighborhood.toLowerCase().includes(cleanQ) ||
        c.city.toLowerCase().includes(cleanQ) ||
        c.amenities.some((a) => a.toLowerCase().includes(cleanQ))
    ).sort((a, b) => Number.parseFloat(a.distance || '999') - Number.parseFloat(b.distance || '999'));
  }, [query]);

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. BIG SEARCH HERO BAR ─── */}
      <section className="bg-background px-4 sm:px-0 py-8">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-primary">
            Busca Global
          </h1>

          {/* Search Input Container */}
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={24}
              weight="bold"
              className="absolute left-4 text-foreground/50 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar filmes, diretores, atores ou cinéfilos..."
              className="w-full h-14 pl-12 pr-12 bg-background border-4 border-foreground/40 text-foreground font-bold text-base sm:text-lg uppercase placeholder:normal-case placeholder:text-foreground/40 placeholder:font-normal shadow-[4px_4px_0px_0px_var(--border)] focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="absolute right-4 flex items-center gap-2">
              {isLoading && (
                <Spinner size={20} weight="bold" className="animate-spin text-primary" />
              )}
              {query && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-foreground/50 hover:text-foreground cursor-pointer"
                  title="Limpar busca"
                >
                  <X size={20} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-foreground/40 shrink-0">
              Em alta:</span>
            {VIBE_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQueryChange(tag)}
                className="px-2.5 py-1 bg-background hover:bg-muted border-2 border-foreground/30 text-[11px] font-bold text-foreground/80 shrink-0 transition-colors shadow-[1px_1px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 3 Main Tabs (Filmes, Pessoas, Usuários) */}
          <div className="flex items-center gap-2 border-b-2 border-foreground/20 pt-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabChange('movies')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'movies'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <FilmStrip size={16} weight="bold" />
              <span>Filmes ({filteredMovies.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('people')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'people'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <User size={16} weight="bold" />
              <span>Pessoas ({filteredPeople.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Users size={16} weight="bold" />
              <span>Usuários ({filteredUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('lists')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'lists'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <BookmarksSimple size={16} weight="bold" />
              <span>Listas ({filteredLists.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('cinemas')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'cinemas'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <MapPin size={16} weight="bold" />
              <span>Cinemas ({filteredCinemas.length})</span>
            </button>
          </div>

        </div>
      </section>

      {/* ─── 2. SEARCH RESULTS ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        {!query.trim() && activeTab === 'movies' ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground/55">Buscas recentes</h2>
              <div className="flex flex-wrap gap-2">{['Duna', 'Villeneuve', 'giallo'].map((term) => <button key={term} type="button" onClick={() => handleQueryChange(term)} className="border-2 border-foreground/30 px-3 py-2 text-xs font-bold hover:border-primary">{term} <span aria-hidden="true">×</span></button>)}</div>
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-foreground/20 pb-2"><h2 className="font-black uppercase">Em alta na comunidade</h2><Link to="/movies" className="text-[10px] font-black uppercase text-primary">Ver catálogo ›</Link></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{MOCK_MOVIES.slice(0, 5).map((movie) => <MovieCard key={movie.id} id={movie.id} title={movie.title} posterUrl={movie.poster_url} rating={movie.global_rating} duration={movie.duration_display} genre={movie.genres[0] || 'DRAMA'} ageRating={movie.age_rating} linkTo={`/movies/${movieRouteId(movie)}`} />)}</div>
            </section>
            <section className="space-y-3">
              <h2 className="border-b border-foreground/20 pb-2 font-black uppercase">Cinéfilos para seguir</h2>
              <div className="flex flex-wrap items-stretch gap-4">{MOCK_USERS.slice(0, 3).map((user) => <UserCard key={user.id} id={user.id} name={user.name} handle={user.username} avatarUrl={user.avatar_url} bio={user.bio} followersCount={user.followers_count} moviesCount={user.watched_count} isFollowingInitial={user.is_following} />)}</div>
            </section>
          </div>
        ) : (
        <>
        
        {/* ─── TAB 1: FILMES ─── */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            {/* Quick Status Sub-Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'Todos os Filmes' },
                  { key: 'now_playing', label: 'Em Cartaz' },
                  { key: 're_release', label: 'Reexibições' },
                  { key: 'upcoming', label: 'Em Breve' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setMovieFilter(f.key as any)}
                    className={`px-3 py-1 text-xs font-bold uppercase transition-all cursor-pointer border-2 ${
                      movieFilter === f.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/70 border-foreground/30 hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-foreground/60">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'filme encontrado' : 'filmes encontrados'}
              </span>
            </div>

            {filteredMovies.length === 0 ? (
              <EmptyState icon={<FilmStrip size={44} weight="bold" />} title="Nenhum filme encontrado" description="Não encontramos filmes correspondentes à sua pesquisa. Tente buscar por outros termos ou gêneros." className="mx-auto max-w-lg space-y-3 border-solid border-foreground/40 bg-background p-12 shadow-[6px_6px_0px_0px_var(--border)]" iconContainerClassName="mb-0 border-0 bg-transparent p-0 text-foreground/40" titleClassName="text-xl" descriptionClassName="mt-0 text-xs font-normal text-foreground/70" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterUrl={movie.poster_url}
                    rating={movie.global_rating}
                    duration={movie.duration_display}
                    genre={movie.genres[0] || 'DRAMA'}
                    ageRating={movie.age_rating}
                    tagType={
                      movie.is_pre_sale
                        ? 'pre_sale'
                        : movie.status === 're_release'
                        ? 're_release'
                        : movie.status === 'now_playing'
                        ? 'release'
                        : 'none'
                    }
                    eventLabel={
                      movie.is_pre_sale
                        ? 'PRÉ-VENDA'
                        : movie.status === 're_release'
                        ? 'REEXIBIÇÃO'
                        : movie.status === 'now_playing'
                        ? 'ESTREIA'
                        : undefined
                    }
                    releaseDate={movie.status === 'upcoming' ? movie.release_date_display : undefined}
                    isPreSale={movie.is_pre_sale}
                    linkTo={`/movies/${movieRouteId(movie)}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PESSOAS (ATORES & DIRETORES) ─── */}
        {activeTab === 'people' && (
          <div className="space-y-6">
            <SearchResultCount count={filteredPeople.length} singular="pessoa encontrada" plural="pessoas encontradas" />

            {filteredPeople.length === 0 ? (
              <EmptyState icon={<User size={44} weight="bold" />} title="Nenhuma pessoa encontrada" description="Tente buscar pelo nome completo ou sobrenome do diretor ou ator." className="mx-auto max-w-lg space-y-3 border-solid border-foreground/40 bg-background p-12 shadow-[6px_6px_0px_0px_var(--border)]" iconContainerClassName="mb-0 border-0 bg-transparent p-0 text-foreground/40" titleClassName="text-xl" descriptionClassName="mt-0 text-xs font-normal text-foreground/70" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPeople.map((person) => (
                  <Link
                    key={person.id}
                    to={`/people/${person.id}`}
                    className="bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] p-4 flex gap-4 items-center hover:-translate-y-1 hover:border-primary transition-all group"
                  >
                    <div className="w-14 aspect-[2/3] object-cover border-2 border-foreground/40 shrink-0 overflow-hidden bg-muted">
                      <img
                        src={person.profile_url}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 inline-block">
                        {person.role_display}
                      </span>
                      <h3 className="text-base font-black uppercase text-foreground truncate group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-[11px] font-sans text-foreground/70 truncate">
                        {person.known_for}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: USUÁRIOS (COMUNIDADE) ─── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <SearchResultCount count={filteredUsers.length} singular="usuário encontrado" plural="usuários encontrados" />

            {filteredUsers.length === 0 ? (
              <EmptyState icon={<Users size={44} weight="bold" />} title="Nenhum usuário encontrado" description="Não encontramos nenhum perfil com esse nome de usuário ou bio." className="mx-auto max-w-lg space-y-3 border-solid border-foreground/40 bg-background p-12 shadow-[6px_6px_0px_0px_var(--border)]" iconContainerClassName="mb-0 border-0 bg-transparent p-0 text-foreground/40" titleClassName="text-xl" descriptionClassName="mt-0 text-xs font-normal text-foreground/70" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    id={user.id}
                    name={user.name}
                    handle={user.username}
                    avatarUrl={user.avatar_url}
                    bio={user.bio}
                    followersCount={user.followers_count}
                    moviesCount={user.watched_count}
                    isFollowingInitial={user.is_following}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: LISTAS ─── */}
        {activeTab === 'lists' && (
          <div className="space-y-6">
            <SearchResultCount count={filteredLists.length} singular="lista encontrada" plural="listas encontradas" />

            {filteredLists.length === 0 ? (
              <EmptyState icon={<BookmarksSimple size={44} weight="bold" />} title="Nenhuma lista encontrada" description="Tente buscar por outro termo ou por tags como #sci-fi, #horror, #cult." className="mx-auto max-w-lg space-y-3 border-solid border-foreground/40 bg-background p-12 shadow-[6px_6px_0px_0px_var(--border)]" iconContainerClassName="mb-0 border-0 bg-transparent p-0 text-foreground/40" titleClassName="text-xl" descriptionClassName="mt-0 text-xs font-normal text-foreground/70" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLists.map((list) => <MovieListCard key={list.id} list={list} />)}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: CINEMAS ─── */}
        {activeTab === 'cinemas' && (
          <div className="space-y-6">
            <SearchResultCount count={filteredCinemas.length} singular="cinema encontrado" plural="cinemas encontrados" />

            {filteredCinemas.length === 0 ? (
              <EmptyState icon={<MapPin size={44} weight="bold" />} title="Nenhum cinema encontrado" description="Tente buscar pelo nome da rede (Cinemark, Cinépolis), bairro ou cidade." className="mx-auto max-w-lg space-y-3 border-solid border-foreground/40 bg-background p-12 shadow-[6px_6px_0px_0px_var(--border)]" iconContainerClassName="mb-0 border-0 bg-transparent p-0 text-foreground/40" titleClassName="text-xl" descriptionClassName="mt-0 text-xs font-normal text-foreground/70" />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredCinemas.map((cinema) => <CinemaListingCard key={cinema.id} cinema={cinema} />)}
              </div>
            )}
          </div>
        )}

        </>
        )}
      </main>
    </div>
  );
}