import { movieRouteId } from '../lib/movie-route';
import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookmarksSimple, Heart, ShareNetwork, Trash, Plus, ArrowLeft, MagnifyingGlass, X, Lock, Globe,
  Copy, UserPlus, DotsThree, DotsSixVertical, PencilSimple, CaretDown, Funnel, Eye,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIE_LISTS } from '../mocks/lists';
import { MOCK_MOVIES } from '../mocks';
import { useAuthStore } from '../stores/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { StatusModal } from '../components/custom/status-modal';
import { TagChip } from '../components/custom/tag-chip';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MovieCard } from '../components/custom/movie-card';

const DEMO_WATCHED: Record<string, string[]> = {
  'list-1': ['speed-racer', 'dune-part-two'],
  'list-2': ['dune-part-two'],
};

const durationInMinutes = (value: string) => {
  const match = value.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
  return match ? Number(match[1] || 0) * 60 + Number(match[2] || 0) : 0;
};

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;

export function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const list = MOCK_MOVIE_LISTS.find((item) => item.id === id);
  const [movieIds, setMovieIds] = useState<string[]>(list ? list.movie_ids : []);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(list ? list.likes_count : 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'original' | 'rating' | 'year'>('original');
  const [draggedMovieId, setDraggedMovieId] = useState<string | null>(null);
  const [watchedIds, setWatchedIds] = useState<string[]>(list ? DEMO_WATCHED[list.id] || [] : []);
  const [watchedFilter, setWatchedFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [fadeWatched, setFadeWatched] = useState(false);
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list?.title || '');
  const [editedDescription, setEditedDescription] = useState(list?.description || '');

  useEffect(() => {
    if (list) document.title = `Lista: ${list.title} | screeK`;
  }, [list]);

  useEffect(() => {
    if (!list) return;
    setMovieIds([...list.movie_ids]);
    setWatchedIds(DEMO_WATCHED[list.id] || []);
    setLikesCount(list.likes_count);
    setEditedTitle(list.title);
    setEditedDescription(list.description);
  }, [list]);

  const isOwner = Boolean(currentUser && list && currentUser.username.toLowerCase() === list.author_username.toLowerCase());
  const displayTitle = editedTitle || list?.title || '';
  const displayDescription = editedDescription || list?.description || '';
  const detailMovies = useMemo(() => movieIds
    .map((movieId) => MOCK_MOVIES.find((movie) => movie.id === movieId))
    .filter(Boolean) as typeof MOCK_MOVIES, [movieIds]);

  const genres = useMemo(() => Array.from(new Set(detailMovies.flatMap((movie) => movie.genres))).sort(), [detailMovies]);
  const visibleDetailMovies = useMemo(() => {
    const filtered = detailMovies.filter((movie) => {
      const isWatched = watchedIds.includes(movie.id);
      if (watchedFilter === 'watched' && !isWatched) return false;
      if (watchedFilter === 'unwatched' && isWatched) return false;
      if (genreFilter !== 'all' && !movie.genres.includes(genreFilter)) return false;
      return true;
    });
    if (sortBy === 'rating') return [...filtered].sort((a, b) => b.global_rating - a.global_rating);
    if (sortBy === 'year') return [...filtered].sort((a, b) => b.release_year - a.release_year);
    return filtered;
  }, [detailMovies, watchedIds, watchedFilter, genreFilter, sortBy]);

  const ownerMovies = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    const filtered = detailMovies.filter((movie) => !query || movie.title.toLowerCase().includes(query));
    if (sortBy === 'rating') return [...filtered].sort((a, b) => b.global_rating - a.global_rating);
    if (sortBy === 'year') return [...filtered].sort((a, b) => b.release_year - a.release_year);
    return filtered;
  }, [detailMovies, searchFilter, sortBy]);

  if (!list) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background p-6 text-center font-display text-foreground">
        <div className="max-w-md space-y-4 border-2 border-foreground/30 p-8">
          <BookmarksSimple size={44} className="mx-auto text-foreground/40" />
          <h2 className="text-2xl font-black uppercase">Lista não encontrada</h2>
          <p className="font-sans text-xs text-foreground/70">A lista solicitada não existe ou foi removida.</p>
          <Link to="/lists" className="inline-flex items-center gap-2 text-xs font-black uppercase text-primary"><ArrowLeft size={16} /> Voltar para Listas</Link>
        </div>
      </div>
    );
  }

  const handleLikeToggle = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: displayTitle, url }); } catch { /* Share was dismissed. */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success('Link da lista copiado!');
    }
  };

  const handleCopyList = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!currentUser) return;
    const copiedList = {
      ...list,
      id: `list-copy-${Date.now()}`,
      title: `${displayTitle} (cópia)`,
      author_id: currentUser.id,
      author_name: currentUser.name || currentUser.username,
      author_username: currentUser.username,
      author_avatar: currentUser.avatar_url || list.author_avatar,
      likes_count: 0,
      movie_ids: [...movieIds],
      created_at: new Date().toISOString().slice(0, 10),
    };
    MOCK_MOVIE_LISTS.unshift(copiedList);
    toast.success('Cópia criada nas suas listas.');
    navigate(`/lists/${copiedList.id}`);
  };

  const handleFollow = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setIsFollowing((following) => !following);
    toast.success(isFollowing ? 'Você deixou de seguir esta lista.' : 'Lista adicionada às que você segue.');
  };

  const handleToggleWatched = (movieId: string) => {
    setWatchedIds((current) => current.includes(movieId)
      ? current.filter((watchedId) => watchedId !== movieId)
      : [...current, movieId]);
  };

  const handleRemoveMovie = (movieId: string) => {
    const previous = [...movieIds];
    setMovieIds((current) => current.filter((item) => item !== movieId));
    toast.success('Filme removido da lista.', { action: { label: 'Desfazer', onClick: () => setMovieIds(previous) } });
  };

  const handleAddMovie = (movieId: string) => {
    if (movieIds.includes(movieId)) { toast.info('Este filme já está na lista.'); return; }
    setMovieIds((current) => [...current, movieId]);
    setIsAddMovieModalOpen(false);
    setAddSearchQuery('');
    toast.success('Filme adicionado à lista.');
  };

  const handleDropMovie = (targetMovieId: string) => {
    if (!draggedMovieId || draggedMovieId === targetMovieId) return;
    setMovieIds((current) => {
      const reordered = [...current];
      const from = reordered.indexOf(draggedMovieId);
      const to = reordered.indexOf(targetMovieId);
      if (from < 0 || to < 0) return current;
      reordered.splice(to, 0, reordered.splice(from, 1)[0]);
      return reordered;
    });
    setDraggedMovieId(null);
  };

  const handleDeleteList = () => {
    setIsDeleteModalOpen(false);
    toast.success('Lista excluída.');
    navigate('/lists');
  };

  const dateParts = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatToParts(new Date(list.created_at));
  const createDate = `${dateParts.find((part) => part.type === 'day')?.value} ${dateParts.find((part) => part.type === 'month')?.value.replace('.', '')} ${dateParts.find((part) => part.type === 'year')?.value}`;
  const watchedCount = detailMovies.filter((movie) => watchedIds.includes(movie.id)).length;
  const remainingMinutes = detailMovies.filter((movie) => !watchedIds.includes(movie.id)).reduce((total, movie) => total + durationInMinutes(movie.duration_display), 0);

  return (
    <div className="bg-background font-display text-foreground">
      <section className="relative overflow-hidden bg-[#18090e] px-4 py-8 text-[#f0dfce] sm:px-0">
        {list.backdrop_url && <img src={list.backdrop_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#18090e]/95 via-[#18090e]/90 to-[#18090e]/70" />
        <div className="relative mx-auto max-w-4xl space-y-5 md:max-w-5xl lg:max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/lists" className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#f0dfce]/65 hover:text-[#f0dfce]"><ArrowLeft size={15} /> Voltar para listas</Link>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#f0dfce]/65">{list.is_private ? <Lock size={12} /> : <Globe size={12} />}{list.is_private ? 'Privada' : 'Pública'} · {detailMovies.length} filmes</span>
          </div>

          <div className="grid items-end gap-5 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl">{displayTitle}</h1>
              <p className="mt-3 font-sans text-sm leading-relaxed text-[#f0dfce]/80">{displayDescription}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link to={`/users/${list.author_username}`} className="flex items-center gap-2">
                  <img src={list.author_avatar} alt="" className="h-7 w-7 border border-[#f0dfce]/50 object-cover" />
                  <span className="text-xs font-black">{list.author_name}</span>
                  <span className="text-[10px] text-[#f0dfce]/60">@{list.author_username}</span>
                </Link>
                <span className="text-[#f0dfce]/40">·</span>
                <span className="text-xs text-[#f0dfce]/70">Criada em {createDate}</span>
              </div>
              {!!list.tags?.length && <div className="mt-3 flex flex-wrap gap-1.5">{list.tags.map((tag) => <TagChip key={tag} tag={tag} size="sm" className="border-[#f0dfce]/50 bg-transparent text-[#f0dfce]" />)}</div>}
            </div>

            {!isOwner && (
              <div className="flex flex-wrap gap-2 lg:max-w-[430px] lg:justify-end">
                <button type="button" onClick={handleLikeToggle} className={`inline-flex min-h-12 items-center gap-2 border-2 px-3 text-[10px] font-black uppercase ${isLiked ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-[#f0dfce]/45 text-[#f0dfce]'}`}>
                  <Heart size={15} weight={isLiked ? 'fill' : 'bold'} /> {likesCount} curtidas
                </button>
                <button type="button" onClick={handleCopyList} className="inline-flex min-h-12 items-center gap-2 border-2 border-[#f0dfce]/45 px-3 text-[10px] font-black uppercase hover:bg-white/10"><Copy size={15} /> Copiar lista</button>
                <button type="button" onClick={handleShare} className="inline-flex min-h-12 items-center gap-2 border-2 border-[#f0dfce]/45 px-3 text-[10px] font-black uppercase hover:bg-white/10"><ShareNetwork size={15} /> Compartilhar</button>
                <button type="button" onClick={handleFollow} className={`inline-flex min-h-12 items-center gap-2 border-2 px-3 text-[10px] font-black uppercase ${isFollowing ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-secondary bg-secondary text-secondary-foreground'}`}>
                  <UserPlus size={15} /> {isFollowing ? 'Seguindo' : 'Seguir lista'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-2 border-[#f0dfce]/35 px-3 py-2.5 text-[10px] font-black sm:gap-4 sm:px-4">
            <span>Você viu {watchedCount} de {detailMovies.length}</span>
            <div className="h-1.5 bg-white/20"><div className="h-full bg-secondary" style={{ width: `${detailMovies.length ? watchedCount / detailMovies.length * 100 : 0}%` }} /></div>
            <span className="text-[#f0dfce]/70">faltam {formatDuration(remainingMinutes)} de filmes</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-6 md:max-w-5xl lg:max-w-6xl sm:px-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground/15 pb-3">
          <span className="text-[10px] font-black uppercase text-foreground/55">{visibleDetailMovies.length} de {detailMovies.length} filmes</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Ordenar filmes" className="h-9 appearance-none border-2 border-foreground/30 bg-background pl-3 pr-8 text-[10px] font-black uppercase">
                <option value="original">Ordem da lista</option><option value="rating">Maior nota</option><option value="year">Ano de lançamento</option>
              </select>
              <CaretDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </label>
            <label className="relative">
              <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="Filtrar por gênero" className="h-9 appearance-none border-2 border-foreground/30 bg-background pl-3 pr-8 text-[10px] font-black uppercase">
                <option value="all">Todos os gêneros</option>
                {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              <CaretDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </label>
            <details className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-2 border-2 border-foreground/30 bg-background px-3 text-[10px] font-black uppercase hover:bg-muted">
                <Funnel size={14} weight="bold" /> Vistos <CaretDown size={13} />
              </summary>
              <div className="absolute right-0 z-30 mt-1 w-60 border-2 border-foreground/30 bg-background p-3 shadow-lg">
                <span className="mb-2 block text-[9px] font-black uppercase tracking-wider text-foreground/50">Estado dos filmes</span>
                {[
                  { value: 'all', label: 'Mostrar todos' },
                  { value: 'watched', label: 'Mostrar assistidos' },
                  { value: 'unwatched', label: 'Mostrar não assistidos' },
                ].map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 py-1.5 text-xs font-bold hover:text-primary">
                    <input type="radio" name="watched-filter" value={option.value} checked={watchedFilter === option.value} onChange={() => setWatchedFilter(option.value as typeof watchedFilter)} className="accent-primary" />
                    {option.label}
                  </label>
                ))}
                <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-foreground/15 pt-2 text-xs font-bold">
                  <input type="checkbox" checked={fadeWatched} onChange={(event) => setFadeWatched(event.target.checked)} className="accent-primary" />
                  Esmaecer assistidos
                </label>
              </div>
            </details>
          </div>
        </div>

        {detailMovies.length === 0 ? (
          <div className="border-2 border-dashed border-foreground/30 p-12 text-center">
            <h2 className="font-black uppercase">Esta lista ainda não tem filmes</h2>
            {isOwner && <Button type="button" onClick={() => setIsAddMovieModalOpen(true)} className="mt-4 text-xs font-black uppercase"><Plus size={15} /> Adicionar filme</Button>}
          </div>
        ) : visibleDetailMovies.length === 0 ? (
          <div className="border-2 border-dashed border-foreground/30 p-10 text-center">
            <p className="text-xs font-bold text-foreground/60">Nenhum filme corresponde aos filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {visibleDetailMovies.map((movie) => {
              const watched = watchedIds.includes(movie.id);
              return (
                <div key={movie.id} className={`group relative transition-opacity ${fadeWatched && watched ? 'opacity-40' : ''}`}>
                  <MovieCard id={movie.id} title={movie.title} posterUrl={movie.poster_url} rating={movie.global_rating} duration={movie.duration_display} genre={movie.genres[0]} ageRating={movie.age_rating} linkTo={`/movies/${movieRouteId(movie)}`} />
                  <button type="button" onClick={() => handleToggleWatched(movie.id)} aria-pressed={watched} aria-label={watched ? `Marcar ${movie.title} como não assistido` : `Marcar ${movie.title} como assistido`} title={watched ? 'Marcar como não assistido' : 'Marcar como assistido'} className={`absolute left-2 top-2 z-20 inline-flex min-h-7 min-w-7 items-center justify-center gap-1 border px-2 py-1 text-[9px] font-black uppercase shadow-sm ${watched ? 'border-[#23834c] bg-[#23834c] text-white' : 'border-foreground/50 bg-[#16080d]/85 text-white hover:border-primary hover:text-secondary'}`}>
                    {watched ? '✓ Visto' : <Eye size={14} weight="bold" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isOwner && (
        <section className="mt-2 border-t-2 border-dashed border-foreground/35 px-4 py-7 sm:px-0">
          <div className="mx-auto max-w-4xl space-y-4 md:max-w-5xl lg:max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Dono · Modo edição (reordenar, remover, excluir lista no menu)</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditListModalOpen(true)} className="text-[10px] font-black uppercase"><PencilSimple size={14} /> Editar lista</Button>
                <Button type="button" onClick={() => setIsAddMovieModalOpen(true)} className="text-[10px] font-black uppercase"><Plus size={14} /> Adicionar filme</Button>
                <details className="relative">
                  <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center border-2 border-foreground/30 hover:bg-muted"><DotsThree size={19} weight="bold" /></summary>
                  <div className="absolute right-0 z-20 mt-1 w-48 border-2 border-foreground/30 bg-background p-1 shadow-lg">
                    <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-black uppercase text-destructive hover:bg-destructive/10"><Trash size={14} /> Excluir lista…</button>
                  </div>
                </details>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45" />
                <Input value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} placeholder="Buscar filmes nesta lista..." className="pl-9" />
              </label>
              <label className="relative">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="h-9 appearance-none border-2 border-foreground/30 bg-background pl-3 pr-8 text-[10px] font-black uppercase">
                  <option value="original">Ordem da lista</option><option value="rating">Maior nota</option><option value="year">Ano de lançamento</option>
                </select>
                <CaretDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </label>
              <span className="ml-auto text-[10px] font-bold text-foreground/55">Arraste os pôsteres para reordenar</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {ownerMovies.map((movie) => (
                <div key={movie.id} draggable onDragStart={() => setDraggedMovieId(movie.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDropMovie(movie.id)} className="group relative cursor-grab active:cursor-grabbing">
                  <MovieCard id={movie.id} title={movie.title} posterUrl={movie.poster_url} rating={movie.global_rating} duration={movie.duration_display} genre={movie.genres[0]} ageRating={movie.age_rating} linkTo={`/movies/${movieRouteId(movie)}`} />
                  <span className="pointer-events-none absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center bg-[#16080d]/90 text-[#f0dfce]"><DotsSixVertical size={17} weight="bold" /></span>
                  <button type="button" onClick={() => handleRemoveMovie(movie.id)} aria-label={`Remover ${movie.title}`} className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center bg-[#16080d]/90 text-white hover:bg-destructive"><X size={15} weight="bold" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Dialog open={isEditListModalOpen} onOpenChange={setIsEditListModalOpen}>
        <DialogContent className="max-w-lg border-2 border-foreground bg-background text-foreground">
          <DialogHeader><DialogTitle className="font-black uppercase">Editar lista</DialogTitle><DialogDescription>Atualize o título e a descrição que aparecem para outras pessoas.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} placeholder="Título" />
            <textarea value={editedDescription} onChange={(event) => setEditedDescription(event.target.value)} rows={4} className="w-full border-2 border-foreground/25 bg-background p-3 text-sm outline-none focus:border-primary" placeholder="Descrição" />
            <Button type="button" onClick={() => { setIsEditListModalOpen(false); toast.success('Lista atualizada.'); }} className="w-full text-xs font-black uppercase">Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMovieModalOpen} onOpenChange={setIsAddMovieModalOpen}>
        <DialogContent className="max-w-lg border-2 border-foreground bg-background text-foreground">
          <DialogHeader><DialogTitle className="font-black uppercase">Adicionar filme à lista</DialogTitle><DialogDescription>Busque um filme do catálogo para incluir nesta lista.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input icon={<MagnifyingGlass size={16} />} value={addSearchQuery} onChange={(event) => setAddSearchQuery(event.target.value)} placeholder="Buscar título no catálogo..." autoFocus />
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {MOCK_MOVIES.filter((movie) => !addSearchQuery.trim() || movie.title.toLowerCase().includes(addSearchQuery.toLowerCase())).map((movie) => {
                const alreadyInList = movieIds.includes(movie.id);
                return <div key={movie.id} className="flex items-center justify-between gap-3 border-b border-foreground/10 py-2">
                  <div className="flex min-w-0 items-center gap-3"><img src={movie.poster_url} alt="" className="h-12 w-8 object-cover" /><div className="min-w-0"><strong className="block truncate text-xs uppercase">{movie.title}</strong><span className="text-[10px] text-foreground/55">{movie.release_year} · {movie.genres[0]}</span></div></div>
                  <Button type="button" disabled={alreadyInList} onClick={() => handleAddMovie(movie.id)} size="sm" className="shrink-0 text-[10px] font-black uppercase">{alreadyInList ? 'Adicionado' : 'Adicionar'}</Button>
                </div>;
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StatusModal
        isOpen={isDeleteModalOpen}
        type="destruction"
        headerTitle="Excluir lista"
        description="Esta ação remove a lista e suas referências aos filmes."
        deletionDetails={{ title: displayTitle, subtitle: `Criada por @${list.author_username}`, highlightText: `${movieIds.length} filmes serão desvinculados` }}
        primaryActionLabel="Excluir lista"
        secondaryActionLabel="Cancelar"
        onPrimaryAction={handleDeleteList}
        onSecondaryAction={() => setIsDeleteModalOpen(false)}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
