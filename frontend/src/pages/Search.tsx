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
  Heart
} from '@phosphor-icons/react';
import { MovieCard } from '../components/custom/movie-card';
import { UserCard } from '../components/custom/user-card';
import { TagChip } from '../components/custom/tag-chip';
import { MOCK_MOVIES, MOCK_PEOPLE, MOCK_USERS } from '../mocks';
import { MOCK_MOVIE_LISTS } from '../mocks/lists';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import { movieService } from '../services/movieService';
import type { Movie } from '../types/movie';

type SearchTab = 'movies' | 'people' | 'users' | 'lists' | 'cinemas';

const VIBE_SUGGESTIONS = [
  'Batman',
  'Spider-Man',
  'Oppenheimer',
  'Duna',
  'Chainsaw Man',
  'Speed Racer',
  'Wachowski',
  'Denis Villeneuve',
  'Christopher Nolan',
  'Terror',
  'Sci-Fi',
  'Anime',
  'Cult',
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
  const filteredCinemas = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return MOCK_CINEMAS;
    return MOCK_CINEMAS.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQ) ||
        c.chain.toLowerCase().includes(cleanQ) ||
        c.neighborhood.toLowerCase().includes(cleanQ) ||
        c.city.toLowerCase().includes(cleanQ) ||
        c.amenities.some((a) => a.toLowerCase().includes(cleanQ))
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. BIG SEARCH HERO BAR ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-8">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkle size={20} weight="fill" className="text-secondary" />
              <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                Explorar Acervo &amp; Comunidade
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
              Busca Global
            </h1>
          </div>

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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase text-foreground/40 shrink-0">
              Sugestões:
            </span>
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
          <div className="flex items-center gap-2 border-b-2 border-foreground/20 pt-2 pb-1 overflow-x-auto scrollbar-none">
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
                        ? 'bg-foreground text-background border-foreground shadow-[2px_2px_0px_0px_var(--border)]'
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
              <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-lg mx-auto">
                <FilmStrip size={44} className="text-foreground/40 mx-auto" weight="bold" />
                <h3 className="text-xl font-black uppercase text-foreground">Nenhum filme encontrado</h3>
                <p className="font-sans text-xs text-foreground/70">
                  Não encontramos filmes correspondentes à sua pesquisa. Tente buscar por outros termos ou gêneros.
                </p>
              </div>
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
                    linkTo={`/movies/${movie.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PESSOAS (ATORES & DIRETORES) ─── */}
        {activeTab === 'people' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
              <span className="text-xs font-bold text-foreground/60">
                {filteredPeople.length} {filteredPeople.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
              </span>
            </div>

            {filteredPeople.length === 0 ? (
              <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-lg mx-auto">
                <User size={44} className="text-foreground/40 mx-auto" weight="bold" />
                <h3 className="text-xl font-black uppercase text-foreground">Nenhuma pessoa encontrada</h3>
                <p className="font-sans text-xs text-foreground/70">
                  Tente buscar pelo nome completo ou sobrenome do diretor ou ator.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
              <span className="text-xs font-bold text-foreground/60">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-lg mx-auto">
                <Users size={44} className="text-foreground/40 mx-auto" weight="bold" />
                <h3 className="text-xl font-black uppercase text-foreground">Nenhum usuário encontrado</h3>
                <p className="font-sans text-xs text-foreground/70">
                  Não encontramos nenhum perfil com esse nome de usuário ou bio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center sm:justify-items-start">
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
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
              <span className="text-xs font-bold text-foreground/60">
                {filteredLists.length} {filteredLists.length === 1 ? 'lista encontrada' : 'listas encontradas'}
              </span>
            </div>

            {filteredLists.length === 0 ? (
              <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-lg mx-auto">
                <BookmarksSimple size={44} className="text-foreground/40 mx-auto" weight="bold" />
                <h3 className="text-xl font-black uppercase text-foreground">Nenhuma lista encontrada</h3>
                <p className="font-sans text-xs text-foreground/70">
                  Tente buscar por outro termo ou por tags como #sci-fi, #horror, #cult.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLists.map((list) => (
                  <Link
                    key={list.id}
                    to={`/lists/${list.id}`}
                    className="bg-card border-4 border-foreground/40 p-4 shadow-[4px_4px_0px_0px_var(--border)] hover:-translate-y-1 hover:border-primary transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="aspect-[16/9] w-full overflow-hidden border-2 border-border bg-muted relative">
                        {list.backdrop_url && (
                          <img
                            src={list.backdrop_url}
                            alt={list.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                          {list.movie_ids.length} filmes
                        </span>
                      </div>

                      <h3 className="font-black text-base uppercase text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {list.title}
                      </h3>
                      <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                        {list.description}
                      </p>

                      {list.tags && list.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {list.tags.slice(0, 3).map((t) => (
                            <TagChip key={t} tag={t} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 mt-3 text-xs font-mono text-muted-foreground">
                      <span>@{list.author_username}</span>
                      <span className="flex items-center gap-1 text-rose-500 font-bold">
                        <Heart size={12} weight="fill" /> {list.likes_count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: CINEMAS ─── */}
        {activeTab === 'cinemas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
              <span className="text-xs font-bold text-foreground/60">
                {filteredCinemas.length} {filteredCinemas.length === 1 ? 'cinema encontrado' : 'cinemas encontrados'}
              </span>
            </div>

            {filteredCinemas.length === 0 ? (
              <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-lg mx-auto">
                <MapPin size={44} className="text-foreground/40 mx-auto" weight="bold" />
                <h3 className="text-xl font-black uppercase text-foreground">Nenhum cinema encontrado</h3>
                <p className="font-sans text-xs text-foreground/70">
                  Tente buscar pelo nome da rede (Cinemark, Cinépolis), bairro ou cidade.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCinemas.map((cinema) => (
                  <Link
                    key={cinema.id}
                    to={`/cinemas/${cinema.id}`}
                    className="bg-card border-4 border-foreground/40 p-4 shadow-[4px_4px_0px_0px_var(--border)] hover:-translate-y-1 hover:border-primary transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="aspect-[16/9] w-full overflow-hidden border-2 border-border bg-muted relative">
                        {cinema.image_url && (
                          <img
                            src={cinema.image_url}
                            alt={cinema.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                          {cinema.chain}
                        </span>
                      </div>

                      <h3 className="font-black text-base uppercase text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {cinema.name}
                      </h3>
                      <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                        {cinema.address}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {cinema.amenities.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 text-[10px] font-mono font-bold bg-muted border border-border"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 mt-3 text-xs font-mono">
                      <span className="text-muted-foreground">{cinema.distance} de você</span>
                      <span className="font-bold text-primary group-hover:underline">Ver Sessões →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
