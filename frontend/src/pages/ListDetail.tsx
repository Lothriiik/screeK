import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookmarksSimple,
  Heart,
  ShareNetwork,
  Trash,
  Plus,
  ArrowLeft,
  MagnifyingGlass,
  X,
  Lock,
  Globe
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIE_LISTS } from '../mocks/lists';
import { MOCK_MOVIES } from '../mocks';
import { useAuthStore } from '../stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { StatusModal } from '../components/custom/status-modal';
import { TagChip } from '../components/custom/tag-chip';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // Find exact list by ID without silent fallback
  const list = MOCK_MOVIE_LISTS.find((l) => l.id === id);

  useEffect(() => {
    if (list) {
      document.title = `Lista: ${list.title} | screeK`;
    }
  }, [list]);

  const [movieIds, setMovieIds] = useState<string[]>(list ? list.movie_ids : []);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(list ? list.likes_count : 0);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'original' | 'rating' | 'year'>('original');

  // Standardized Modal States
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Dynamic Owner Check
  const isOwner = currentUser
    ? currentUser.username.toLowerCase() === list?.author_username.toLowerCase()
    : list?.author_username === 'lothrik' || list?.author_username === 'uander';

  // Resolve movie objects
  const movies = useMemo(() => {
    if (!list) return [];
    const listMovies = movieIds
      .map((mId) => MOCK_MOVIES.find((m) => m.id === mId))
      .filter(Boolean) as typeof MOCK_MOVIES;

    // Apply internal search filter
    const filtered = listMovies.filter((m) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q)) ||
        m.directors.some((d) => d.toLowerCase().includes(q))
      );
    });

    // Apply sorting
    if (sortBy === 'rating') {
      return [...filtered].sort((a, b) => b.global_rating - a.global_rating);
    }
    if (sortBy === 'year') {
      return [...filtered].sort((a, b) => b.release_year - a.release_year);
    }
    return filtered;
  }, [list, movieIds, searchFilter, sortBy]);

  // Handle 404 if list does not exist
  if (!list) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-display">
        <div className="max-w-md space-y-4 border-4 border-foreground/30 p-8 shadow-[6px_6px_0px_0px_var(--border)] bg-background">
          <BookmarksSimple size={48} weight="bold" className="text-foreground/40 mx-auto" />
          <h2 className="text-2xl font-black uppercase text-foreground">Lista Não Encontrada</h2>
          <p className="font-sans text-xs text-foreground/70 leading-relaxed">
            A lista cinematográfica solicitada não existe ou foi excluída pelo autor.
          </p>
          <Link
            to="/lists"
            className="px-6 py-2.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--border)] inline-flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para Listas</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleLikeToggle = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      toast.success('Lista curtida!');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link da lista copiado!');
    }
  };

  const handleRemoveMovie = (movieIdToRemove: string) => {
    const previous = [...movieIds];
    setMovieIds((prev) => prev.filter((mId) => mId !== movieIdToRemove));
    toast.success('Filme removido da lista.', {
      action: {
        label: 'Desfazer',
        onClick: () => setMovieIds(previous),
      },
    });
  };

  const handleAddMovie = (movieToAddId: string) => {
    if (movieIds.includes(movieToAddId)) {
      toast.info('Este filme já está na lista.');
      return;
    }
    setMovieIds((prev) => [...prev, movieToAddId]);
    setIsAddMovieModalOpen(false);
    setAddSearchQuery('');
    toast.success('Filme adicionado com sucesso!');
  };

  const handleDeleteList = () => {
    setIsDeleteModalOpen(false);
    toast.success('Lista excluída com sucesso.');
    navigate('/lists');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. LIST HERO BANNER ─── */}
      <section className="bg-background border-b-4 border-foreground/40 px-4 sm:px-8 py-8 relative shadow-sm">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <Link
              to="/lists"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-foreground/60 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Voltar para Listas</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-muted/40 border border-foreground/20 text-[10px] font-black uppercase flex items-center gap-1">
                {list.is_private ? <Lock size={12} weight="bold" /> : <Globe size={12} weight="bold" />}
                <span>{list.is_private ? 'Privada' : 'Pública'}</span>
              </span>

              <span className="text-xs font-mono font-bold text-foreground/50">
                {movieIds.length} filmes
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-black uppercase text-foreground tracking-tight">
                {list.title}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed">
                {list.description}
              </p>

              {/* Author Row */}
              <div className="flex items-center gap-2.5 pt-2">
                <Link
                  to={`/users/${list.author_username}`}
                  className="flex items-center gap-2 group"
                >
                  <img
                    src={list.author_avatar}
                    alt={list.author_name}
                    className="w-7 h-7 object-cover border border-foreground/40 shrink-0"
                  />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-black text-foreground group-hover:text-primary transition-colors">
                      {list.author_name}
                    </span>
                    <span className="text-foreground/50 font-mono">
                      @{list.author_username}
                    </span>
                  </div>
                </Link>
                <span className="text-foreground/30">•</span>
                <span className="text-xs font-mono text-foreground/50">
                  Criada em {list.created_at}
                </span>
              </div>

              {/* Tags Section */}
              {list.tags && list.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {list.tags.map((t) => (
                    <TagChip key={t} tag={t} asLink size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* List Actions */}
            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={handleLikeToggle}
                className={`px-4 py-2 border-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                  isLiked
                    ? 'bg-secondary text-secondary-foreground border-secondary'
                    : 'bg-background hover:bg-muted text-foreground border-foreground'
                }`}
              >
                <Heart size={16} weight={isLiked ? 'fill' : 'bold'} />
                <span>{likesCount} Curtidas</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2 border-2 border-foreground hover:bg-muted text-foreground cursor-pointer shadow-[2px_2px_0px_0px_var(--border)]"
                title="Compartilhar Lista"
              >
                <ShareNetwork size={18} weight="bold" />
              </button>

              {isOwner && (
                <>
                  <Button
                    type="button"
                    onClick={() => setIsAddMovieModalOpen(true)}
                    variant="default"
                    className="flex items-center gap-1.5 uppercase font-display font-black text-xs"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Adicionar Filme</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2 border-2 border-destructive text-destructive hover:bg-destructive/10 cursor-pointer shadow-[2px_2px_0px_0px_var(--border)]"
                    title="Excluir Lista"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ─── 2. SEARCH & SORT BAR ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex-1 max-w-sm">
          <Input
            icon={<MagnifyingGlass size={16} className="text-foreground/40" />}
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar filmes nesta lista..."
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-foreground/60 uppercase">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="original">Ordem da Lista</option>
            <option value="rating">Maior Nota (★)</option>
            <option value="year">Ano de Lançamento</option>
          </select>
        </div>

      </div>

      {/* ─── 3. MOVIES GRID ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8">
        
        {movies.length === 0 ? (
          <div className="p-12 text-center border-4 border-dashed border-foreground/30 space-y-4 bg-muted/10">
            <BookmarksSimple size={40} weight="bold" className="text-foreground/40 mx-auto" />
            <h3 className="text-lg font-black uppercase text-foreground">Nenhum filme encontrado</h3>
            <p className="font-sans text-xs text-foreground/60 max-w-sm mx-auto">
              {searchFilter ? 'Nenhum filme corresponde à sua busca nesta lista.' : 'Esta lista ainda não possui filmes adicionados.'}
            </p>
            {isOwner && (
              <Button
                type="button"
                onClick={() => setIsAddMovieModalOpen(true)}
                variant="default"
                className="font-display font-black text-xs uppercase inline-flex items-center gap-2"
              >
                <Plus size={16} weight="bold" />
                <span>Adicionar Primeiro Filme</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie, idx) => (
              <div
                key={movie.id}
                className="group relative border-4 border-foreground/40 bg-background shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden flex flex-col justify-between"
              >
                {/* Poster Box */}
                <Link to={`/movies/${movie.id}`} className="block aspect-[2/3] bg-muted overflow-hidden relative">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white font-mono font-bold text-[10px]">
                    #{idx + 1}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-secondary text-secondary-foreground font-mono font-black text-[10px]">
                    ★ {movie.global_rating}
                  </div>
                </Link>

                {/* Info & Owner remove action */}
                <div className="p-3 space-y-1.5 bg-background border-t-2 border-foreground/20">
                  <Link
                    to={`/movies/${movie.id}`}
                    className="font-black uppercase text-xs text-foreground hover:text-primary transition-colors block truncate"
                  >
                    {movie.title}
                  </Link>

                  <span className="text-[10px] text-foreground/60 font-sans block truncate">
                    {movie.release_year} • {movie.genres[0]} • {movie.duration_display}
                  </span>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMovie(movie.id)}
                      className="w-full pt-1.5 border-t border-foreground/10 text-[10px] font-black uppercase text-destructive hover:underline text-left cursor-pointer flex items-center justify-between"
                    >
                      <span>Remover</span>
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ─── 4. STANDARDIZED ADD MOVIE DIALOG (RADIX UI) ─── */}
      <Dialog open={isAddMovieModalOpen} onOpenChange={setIsAddMovieModalOpen}>
        <DialogContent className="border-4 border-foreground shadow-[10px_10px_0px_0px_var(--border)] max-w-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-black uppercase text-foreground">
              Adicionar Filme à Lista
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60 font-sans">
              Busque um título no catálogo geral do screeK para incluir na sua lista.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              icon={<MagnifyingGlass size={16} className="text-foreground/40" />}
              type="text"
              value={addSearchQuery}
              onChange={(e) => setAddSearchQuery(e.target.value)}
              placeholder="Buscar título no catálogo..."
              autoFocus
            />

            <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-foreground/10 pr-1">
              {MOCK_MOVIES.filter((m) => {
                if (!addSearchQuery.trim()) return true;
                return m.title.toLowerCase().includes(addSearchQuery.toLowerCase());
              }).map((m) => {
                const isAlreadyIn = movieIds.includes(m.id);

                return (
                  <div key={m.id} className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={m.poster_url} alt={m.title} className="w-8 aspect-[2/3] object-cover border" />
                      <div className="min-w-0">
                        <span className="font-black uppercase text-xs block truncate">{m.title}</span>
                        <span className="text-[10px] text-foreground/50 font-sans">{m.release_year} • {m.genres[0]}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      disabled={isAlreadyIn}
                      onClick={() => handleAddMovie(m.id)}
                      variant={isAlreadyIn ? 'outline' : 'default'}
                      size="sm"
                      className="font-black text-xs uppercase shrink-0"
                    >
                      {isAlreadyIn ? 'Já adicionado' : '+ Adicionar'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── 5. STANDARDIZED DELETE LIST STATUS MODAL ─── */}
      <StatusModal
        isOpen={isDeleteModalOpen}
        type="destruction"
        headerTitle="EXCLUIR LISTA"
        description="Esta ação é irreversível e removerá permanentemente a coleção e todas as referências dos filmes salvos."
        deletionDetails={{
          title: list.title,
          subtitle: `Criada por @${list.author_username} · ${list.is_private ? 'Lista Privada' : 'Lista Pública'}`,
          highlightText: `${movieIds.length} filmes serão desvinculados definitivamente`,
        }}
        primaryActionLabel="‹ SIM, EXCLUIR DEFINITIVAMENTE"
        secondaryActionLabel="CANCELAR E MANTER"
        onPrimaryAction={handleDeleteList}
        onSecondaryAction={() => setIsDeleteModalOpen(false)}
        onClose={() => setIsDeleteModalOpen(false)}
      />

    </div>
  );
}
