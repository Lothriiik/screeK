import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookmarksSimple,
  Plus,
  Heart,
  Sparkle,
  User,
  FilmStrip,
  Hash,
  X
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIE_LISTS, MOCK_MOVIES } from '../mocks';
import type { MovieList } from '../types/social';
import { TagChip } from '../components/custom/tag-chip';

type ListTab = 'all' | 'my_lists' | 'popular';

export function Lists() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');

  const [lists, setLists] = useState<MovieList[]>(MOCK_MOVIE_LISTS);
  const [activeTab, setActiveTab] = useState<ListTab>('all');
  const [likedLists, setLikedLists] = useState<Record<string, boolean>>({});

  const handleLikeToggle = (id: string) => {
    setLikedLists((prev) => {
      const isLiked = !prev[id];
      setLists((current) =>
        current.map((l) =>
          l.id === id ? { ...l, likes_count: l.likes_count + (isLiked ? 1 : -1) } : l
        )
      );
      toast.success(isLiked ? 'Lista favoritada!' : 'Lista removida dos favoritos');
      return { ...prev, [id]: isLiked };
    });
  };

  // Coleta todas as tags únicas
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    lists.forEach((l) => {
      l.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [lists]);

  const displayedLists = lists.filter((l) => {
    if (activeTag) {
      const matchesTag = l.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase());
      if (!matchesTag) return false;
    }
    if (activeTab === 'my_lists') return l.author_username === 'lothrik' || l.author_username === 'uander';
    if (activeTab === 'popular') return l.likes_count >= 100;
    return true;
  });

  const handleSelectTag = (tag: string) => {
    if (activeTag === tag) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tag);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. HEADER & ACTION BAR ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-8">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookmarksSimple size={24} weight="bold" className="text-primary" />
                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                  Curadoria &amp; Coleções Cinéfilas
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
                Listas de Filmes
              </h1>
            </div>

            <Link
              to="/lists/new"
              className="px-5 py-2.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Criar Nova Lista</span>
            </Link>
            <Link
              to="/collections"
              className="inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2.5 text-xs font-black uppercase tracking-wider text-foreground shadow-[3px_3px_0px_0px_var(--border)] transition-all hover:bg-muted"
            >
              <Sparkle size={16} weight="fill" />
              <span>Coleções</span>
            </Link>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-2 border-b-2 border-foreground/20 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Sparkle size={16} weight="fill" />
              <span>Explorar Todas ({lists.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'popular'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Heart size={16} weight="fill" />
              <span>Populares</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my_lists')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 ${
                activeTab === 'my_lists'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <User size={16} weight="bold" />
              <span>Minhas Listas</span>
            </button>
          </div>

          {/* Tag Filter Bar */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono font-bold uppercase text-foreground/60 flex items-center gap-1 mr-1">
                <Hash size={13} /> Tags:
              </span>
              {allTags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  active={activeTag?.toLowerCase() === tag.toLowerCase()}
                  onClick={() => handleSelectTag(tag)}
                  size="sm"
                />
              ))}
              {activeTag && (
                <button
                  type="button"
                  onClick={() => {
                    searchParams.delete('tag');
                    setSearchParams(searchParams);
                  }}
                  className="text-xs font-mono font-bold text-destructive hover:underline flex items-center gap-1 ml-2"
                >
                  <X size={12} weight="bold" /> Limpar filtro
                </button>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ─── 2. LISTS GRID ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        
        {displayedLists.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-md mx-auto">
            <BookmarksSimple size={44} className="text-foreground/40 mx-auto" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhuma lista encontrada</h3>
            <p className="font-sans text-xs text-foreground/70">
              Você ainda não criou nenhuma lista. Comece agora mesmo clicando no botão acima!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayedLists.map((list) => {
              const listMovies = list.movie_ids
                .map((id) => MOCK_MOVIES.find((m) => m.id === id))
                .filter(Boolean);

              const isLiked = !!likedLists[list.id];

              return (
                <article
                  key={list.id}
                  className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all group"
                >
                  {/* Banner / Poster collage */}
                  <Link to={`/lists/${list.id}`} className="relative w-full h-44 bg-muted overflow-hidden border-b-2 border-foreground/30 block">
                    {list.backdrop_url ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${list.backdrop_url})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <FilmStrip size={40} className="text-foreground/30" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                    {/* Overlapping mini-posters stack */}
                    <div className="absolute bottom-3 left-4 flex items-center -space-x-3">
                      {listMovies.slice(0, 4).map((m, idx) => (
                        <div
                          key={idx}
                          className="w-12 aspect-[2/3] border-2 border-background shadow-md overflow-hidden shrink-0 bg-muted"
                        >
                          <img
                            src={m?.poster_url}
                            alt={m?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    <span className="absolute top-3 right-3 bg-background/90 border border-foreground/40 text-[10px] font-black uppercase px-2 py-0.5 text-foreground shadow-sm">
                      {list.movie_ids.length} Filmes
                    </span>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    
                    <div className="space-y-2">
                      <Link to={`/lists/${list.id}`} className="block">
                        <h2 className="text-lg sm:text-xl font-black uppercase text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {list.title}
                        </h2>
                      </Link>

                      <p className="font-sans text-xs text-foreground/80 leading-relaxed line-clamp-2">
                        {list.description}
                      </p>

                      {/* Card Tags */}
                      {list.tags && list.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {list.tags.slice(0, 4).map((t) => (
                            <TagChip
                              key={t}
                              tag={t}
                              size="sm"
                              active={activeTag?.toLowerCase() === t.toLowerCase()}
                              onClick={() => handleSelectTag(t)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Author & Likes Footer */}
                    <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
                      
                      {/* Author */}
                      <Link
                        to={`/users/${list.author_username}`}
                        className="flex items-center gap-2 group/author"
                      >
                        <img
                          src={list.author_avatar}
                          alt={list.author_name}
                          className="w-6 h-6 object-cover border border-foreground/40 shrink-0"
                        />
                        <span className="text-xs font-bold text-foreground/70 group-hover/author:text-primary transition-colors">
                          @{list.author_username}
                        </span>
                      </Link>

                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(list.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold transition-all border ${
                          isLiked
                            ? 'bg-secondary/10 border-secondary text-secondary font-black'
                            : 'bg-background hover:bg-muted border-foreground/20 text-foreground/70'
                        }`}
                      >
                        <Heart size={14} weight={isLiked ? 'fill' : 'regular'} className={isLiked ? 'text-secondary' : ''} />
                        <span>{list.likes_count}</span>
                      </button>

                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
