import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookmarksSimple, Plus, Heart, Hash, Lock, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIE_LISTS, MOCK_MOVIES } from '../mocks';
import type { MovieList } from '../types/social';
import { useAuthStore } from '../stores/authStore';
import { MoviePosterFan } from '../components/custom/movie-poster-fan';
import { TagChip } from '../components/custom/tag-chip';

type ListTab = 'community' | 'my_lists';
type ListSort = 'popular' | 'recent';

const FEATURED_TAGS = [
  'sci-fi', 'terror', 'animacao', 'imax', 'cult', 'autoral', 'experiencia', 'maximalismo', 'cyberpunk', 'visuais',
  'epico', 'soundtrack', 'blockbuster', 'horror', 'giallo', 'cinema-frances', 'body-horror', 'psicologico', 'indie', 'stop-motion',
];

const TAG_LABELS: Record<string, string> = {
  'sci-fi': 'Sci-Fi', animacao: 'Animação', 'cinema-frances': 'Cinema francês', 'body-horror': 'Body horror',
  epico: 'Épico', experiencia: 'Experiência', psicologico: 'Psicológico', visuais: 'Visuais',
};

const tagLabel = (tag: string) => TAG_LABELS[tag.toLowerCase()] || tag.replaceAll('-', ' ');
const normalizeTag = (tag: string) => tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '-');

export function Lists() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTag = searchParams.get('tag');
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [lists, setLists] = useState<MovieList[]>(MOCK_MOVIE_LISTS);
  const [activeTab, setActiveTab] = useState<ListTab>('community');
  const [likedLists, setLikedLists] = useState<Record<string, boolean>>({});
  const [showAllTags, setShowAllTags] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<ListSort>('popular');
  const [visibleCount, setVisibleCount] = useState(6);

  const allTags = useMemo(() => FEATURED_TAGS, []);

  const displayedLists = useMemo(() => {
    const filtered = lists.filter((list) => {
      if (activeTag && !list.tags?.some((tag) => normalizeTag(tag) === normalizeTag(activeTag))) return false;
      if (activeTab === 'my_lists' && list.author_username !== currentUser?.username) return false;
      if (query.trim()) {
        const text = `${list.title} ${list.description} ${list.tags?.join(' ')}`.toLowerCase();
        if (!text.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => sortBy === 'popular'
      ? b.likes_count - a.likes_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [lists, activeTag, activeTab, currentUser?.username, query, sortBy]);

  const handleLikeToggle = (id: string) => {
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para curtir uma lista.');
      navigate('/login');
      return;
    }
    const isLiked = !likedLists[id];
    setLikedLists((previous) => ({ ...previous, [id]: isLiked }));
    setLists((current) => current.map((list) => list.id === id
      ? { ...list, likes_count: list.likes_count + (isLiked ? 1 : -1) }
      : list));
  };

  const handleSelectTag = (tag: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (activeTag && normalizeTag(activeTag) === normalizeTag(tag)) nextParams.delete('tag');
    else nextParams.set('tag', tag);
    setSearchParams(nextParams);
  };

  return (
    <div className="bg-background font-display text-foreground">
      <section className="page-divider px-4 py-8 sm:px-0">
        <div className="mx-auto max-w-4xl space-y-5 md:max-w-5xl lg:max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">Listas de filmes</h1>
              <p className="mt-1 max-w-xl font-sans text-sm text-foreground/65">Seleções feitas por quem ama cinema. As da curadoria screeK ficam em Coleções.</p>
            </div>
            <Link to={isAuthenticated ? '/lists/new' : '/login'} className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2.5 text-xs font-black uppercase text-primary-foreground hover:bg-primary/90">
              <Plus size={16} weight="bold" /> Criar lista
            </Link>
          </div>

          <nav aria-label="Seções de listas" className="flex flex-wrap items-center gap-6 border-b-2 border-foreground/20">
            <button type="button" onClick={() => setActiveTab('community')} className={`border-b-4 px-1 py-3 text-xs font-black uppercase ${activeTab === 'community' ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
              Comunidade
            </button>
            <Link to="/collections" className="border-b-4 border-transparent px-1 py-3 text-xs font-black uppercase text-foreground/60 hover:text-foreground">
              Curadoria screeK <span className="text-primary">›</span>
            </Link>
            <button type="button" onClick={() => isAuthenticated ? setActiveTab('my_lists') : navigate('/login')} className={`flex items-center gap-1.5 border-b-4 px-1 py-3 text-xs font-black uppercase ${activeTab === 'my_lists' ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
              Minhas listas {!isAuthenticated && <Lock size={13} weight="bold" />}
            </button>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-1 font-mono text-[10px] font-black uppercase text-foreground/50"><Hash size={13} /> Tags</span>
            {(showAllTags ? allTags : allTags.slice(0, 7)).map((tag) => (
              <TagChip key={tag} tag={tagLabel(tag)} active={!!activeTag && normalizeTag(activeTag) === normalizeTag(tag)} onClick={() => handleSelectTag(tag)} size="sm" />
            ))}
            <button type="button" onClick={() => setShowAllTags((show) => !show)} className="px-1 text-[10px] font-black uppercase text-primary hover:underline">
              {showAllTags ? 'Ver menos' : `Ver todas (${allTags.length})`}
            </button>
            <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
              <label className="relative min-w-[190px] flex-1 sm:flex-none">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar listas..." className="h-9 w-full border-2 border-foreground/30 bg-background pl-9 pr-3 text-xs outline-none focus:border-primary" />
              </label>
              <label className="relative">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ListSort)} className="h-9 appearance-none border-2 border-foreground/30 bg-background pl-3 pr-8 text-[10px] font-black uppercase outline-none focus:border-primary">
                  <option value="popular">Populares</option>
                  <option value="recent">Recentes</option>
                </select>
                <CaretDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </label>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-7 md:max-w-5xl lg:max-w-6xl sm:px-0">
        {displayedLists.length === 0 ? (
          <div className="border-2 border-foreground/30 p-12 text-center">
            <BookmarksSimple size={40} className="mx-auto text-foreground/35" />
            <h2 className="mt-3 text-lg font-black uppercase">Nenhuma lista encontrada</h2>
            <p className="mt-1 font-sans text-xs text-foreground/60">Tente mudar a busca ou as etiquetas selecionadas.</p>
            {activeTag && <button type="button" onClick={() => handleSelectTag(activeTag)} className="mt-3 text-xs font-black uppercase text-primary">Limpar etiqueta</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedLists.slice(0, visibleCount).map((list) => {
              const movies = list.movie_ids.map((movieId) => MOCK_MOVIES.find((movie) => movie.id === movieId)).filter(Boolean) as typeof MOCK_MOVIES;
              const isLiked = !!likedLists[list.id];
              return (
                <article key={list.id} className="group flex flex-col overflow-hidden border-2 border-foreground/40 bg-background transition-transform hover:-translate-y-0.5">
                  <Link to={`/lists/${list.id}`} aria-label={`Abrir lista ${list.title}`} className="block">
                    <MoviePosterFan movies={movies} totalCount={list.movie_ids.length} showTotalBadge className="h-44 border-b-2 border-foreground/35" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                    <Link to={`/lists/${list.id}`} className="line-clamp-2 min-h-10 text-sm font-black uppercase leading-tight transition-colors group-hover:text-primary">{list.title}</Link>
                    <p className="line-clamp-2 font-sans text-xs leading-relaxed text-foreground/65">{list.description}</p>
                    <div className="flex min-h-6 flex-wrap gap-1.5">
                      {(list.tags || []).slice(0, 3).map((tag) => <TagChip key={tag} tag={tagLabel(tag)} size="sm" />)}
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-foreground/15 pt-2.5">
                      <Link to={`/users/${list.author_username}`} className="flex min-w-0 items-center gap-2 text-[10px] font-bold text-foreground/70 hover:text-primary">
                        <img src={list.author_avatar} alt="" className="h-6 w-6 border border-foreground/35 object-cover" />
                        <span className="truncate">@{list.author_username}</span>
                      </Link>
                      <button type="button" onClick={() => handleLikeToggle(list.id)} aria-label="Curtir lista" className={`flex items-center gap-1 text-xs font-black ${isLiked ? 'text-secondary' : 'text-primary'}`}>
                        <Heart size={14} weight="fill" /> {list.likes_count}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {displayedLists.length > visibleCount && (
          <div className="mt-7 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="border-2 border-foreground/40 px-5 py-2.5 text-xs font-black uppercase hover:bg-muted">
              Carregar mais
            </button>
          </div>
        )}
        {activeTab === 'my_lists' && displayedLists.length === 0 && <Link to="/lists/new" className="mt-5 block text-center text-xs font-black uppercase text-primary">Criar minha primeira lista</Link>}
      </main>
    </div>
  );
}
