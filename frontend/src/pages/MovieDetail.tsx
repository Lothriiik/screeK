import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Heart,
  BookmarkSimple,
  Check,
  ShareNetwork,
  FilmStrip,
  ArrowLeft,
  X,
  CaretRight,
  SignIn,
  GlobeHemisphereWest,
  Buildings,
  Translate,
  ListPlus,
  Sparkle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { ReviewRow } from '../components/custom/review-row';
import { StarRating } from '../components/custom/star-rating';
import { MovieCard } from '../components/custom/movie-card';
import { InfoBlock } from '../components/custom/info-block';
import { RatingDistribution } from '../components/custom/rating-distribution';
import { ShareableStoryModal } from '../components/custom/shareable-story-modal';
import { AddToListModal } from '../components/custom/add-to-list-modal';
import { LogDiaryModal } from '../components/custom/log-diary-modal';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { movieService } from '../services/movieService';
import type { Movie } from '../types/movie';

function MovieDetailSkeleton() {
  return (
    <div className="w-full font-display space-y-8 animate-pulse">
      {/* Backdrop Skeleton */}
      <div className="relative w-full h-[280px] sm:h-[380px] md:h-[460px] bg-muted/40 border-b-4 border-foreground/30 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 pb-8 relative z-10 w-full flex items-end gap-6 sm:gap-8">
          <div className="w-28 sm:w-44 md:w-52 aspect-[2/3] bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--border)] shrink-0" />
          <div className="space-y-3 w-full max-w-xl pb-2">
            <div className="h-4 bg-primary/40 w-32" />
            <div className="h-8 sm:h-12 bg-foreground/20 w-3/4" />
            <div className="h-4 bg-foreground/15 w-1/2" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 space-y-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="h-5 bg-foreground/20 w-28" />
              <div className="h-3 bg-foreground/10 w-full" />
              <div className="h-3 bg-foreground/10 w-5/6" />
              <div className="h-3 bg-foreground/10 w-4/6" />
            </div>

            <div className="p-4 bg-card border-2 border-foreground/30 shadow-[4px_4px_0px_0px_var(--border)] space-y-3">
              <div className="h-4 bg-foreground/20 w-36" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 bg-foreground/10 w-16" />
                    <div className="h-4 bg-foreground/20 w-24" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cast Skeleton */}
            <div className="space-y-3">
              <div className="h-5 bg-foreground/20 w-32" />
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-square bg-muted/60 border border-foreground/20" />
                    <div className="h-3 bg-foreground/15 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Actions Skeleton */}
          <div className="space-y-4">
            <div className="p-6 bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--border)] space-y-4">
              <div className="h-5 bg-foreground/20 w-40" />
              <div className="h-10 bg-primary/30 w-full" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-muted/60 border border-foreground/20" />
                <div className="h-12 bg-muted/60 border border-foreground/20" />
                <div className="h-12 bg-muted/60 border border-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const { requireAuth } = useRequireAuth();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      movieService
        .getMovieById(id)
        .then((data) => {
          if (data) {
            setMovie(data);
            setUserRating(data.user_rating || 0);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });

      movieService.getRecommendations(id).then((recs) => {
        if (recs && recs.length > 0) {
          setSimilarMovies(recs);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} (${movie.release_year}) | screeK`;
    }
  }, [movie]);

  const [watched, setWatched] = useState(false);
  const [liked, setLiked] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  if (isLoading || !movie) {
    return <MovieDetailSkeleton />;
  }

  const handleWatchedToggle = () => {
    requireAuth(() => {
      const nextState = !watched;
      setWatched(nextState);
      if (nextState) {
        setShowDiaryModal(true);
      }
    }, { message: 'Faça login para marcar filmes no seu Diário screeK.' });
  };

  const handleLikedToggle = () => {
    requireAuth(() => {
      const nextState = !liked;
      setLiked(nextState);
      if (nextState) {
        toast.success('Adicionado aos favoritos!');
      }
    }, { message: 'Faça login para salvar este filme nos seus favoritos.' });
  };

  const handleWatchlistToggle = () => {
    requireAuth(() => {
      const nextState = !inWatchlist;
      setInWatchlist(nextState);
      if (nextState) {
        toast.info('Salvo na Watchlist!', { description: `${movie.title} pronto para assistir depois.` });
      }
    }, { message: 'Faça login para salvar filmes na sua Watchlist.' });
  };

  const handleOpenReviewModal = () => {
    requireAuth(() => {
      setShowReviewModal(true);
    }, { message: 'Faça login para publicar sua avaliação e review.' });
  };

  const handlePublishReview = () => {
    setShowReviewModal(false);
    toast.success('Avaliação publicada!', {
      description: `Nota ${userRating.toFixed(1)} ★ registrada no screeK Social.`,
    });
  };

  const getAgeRatingBg = (ageRating: string) => {
    switch (ageRating) {
      case 'L':
        return 'bg-[#34A853] text-white';
      case '10':
        return 'bg-[#3B82F6] text-white';
      case '12':
      case '14':
        return 'bg-[#D4A338] text-white';
      case '16':
        return 'bg-[#FF9900] text-white';
      case '18':
        return 'bg-[#DC3545] text-white';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="bg-background text-foreground pb-20 font-display">
      {/* ─── 1. HERO BACKDROP SECTION ─── */}
      <section className="relative w-full overflow-hidden border-b-4 border-foreground/40 bg-tertiary">
        {/* Backdrop Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-65 scale-105 transition-transform duration-700"
          style={{ backgroundImage: `url(${movie.backdrop_url})` }}
        />
        
        {/* Dark Tertiary Overlay Filter */}
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-tertiary/40 to-transparent" />

        {/* Aligned 7xl Container */}
        <div className="relative z-10 max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Voltar Button */}
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-black uppercase tracking-wider border border-white/30 backdrop-blur-md transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar ao Catálogo</span>
          </Link>

          {/* Hero Content: Poster + Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 pt-2">
            
            {/* Left: Poster */}
            <div className="w-48 sm:w-56 md:w-64 shrink-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] border-4 border-white/80 relative group">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover bg-muted"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 text-xs font-black uppercase shadow-sm ${getAgeRatingBg(
                    movie.age_rating
                  )}`}
                >
                  {movie.age_rating}
                </span>
                {movie.is_in_theaters && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Em Cartaz
                  </span>
                )}
              </div>
            </div>

            {/* Right: Info & Stats */}
            <div className="flex-1 space-y-5 text-white w-full">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-white/80 mb-2">
                  <span>{movie.release_year}</span>
                  <span>•</span>
                  <span>{movie.duration_display}</span>
                  {movie.origin_country && (
                    <>
                      <span>•</span>
                      <span className="text-white font-black">{movie.origin_country}</span>
                    </>
                  )}
                  <span>•</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-0.5 border border-white/40 bg-white/10 text-[10px]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
                  {movie.title}
                </h1>
                {movie.original_title && (
                  <p className="text-xs sm:text-sm font-bold text-white/60 mt-1 uppercase">
                    Título Original: {movie.original_title}
                  </p>
                )}
              </div>

              {/* Direction & Writing (Visível e destacado) */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1 px-3 bg-white/10 border border-white/20 backdrop-blur-sm max-w-xl text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/60 font-mono font-black uppercase text-[10px] tracking-wider">
                    Direção
                  </span>
                  <span className="font-extrabold text-sm text-white">
                    {movie.directors && movie.directors.length > 0 && !movie.directors[0].includes('não informad')
                      ? movie.directors.join(', ')
                      : 'Não informada'}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20 hidden sm:block" />
                <div className="flex items-baseline gap-2">
                  <span className="text-white/60 font-mono font-black uppercase text-[10px] tracking-wider">
                    Roteiro
                  </span>
                  <span className="font-extrabold text-sm text-white">
                    {movie.writers && movie.writers.length > 0 && !movie.writers[0].includes('não informad')
                      ? movie.writers.join(', ')
                      : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Ratings Section: SUA NOTA + CURVA BONITINHA DA COMUNIDADE */}
              <div className="space-y-3 max-w-xl pt-1">
                {/* 1. SUA NOTA */}
                {isAuthenticated ? (
                  <div className="p-3.5 sm:p-4 bg-white/10 border-2 border-white/30 backdrop-blur-sm space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Star size={16} weight="fill" className="text-amber-400" />
                        <span>Sua Avaliação</span>
                      </span>
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                        {userRating > 0 ? `${userRating.toFixed(1)} ★` : 'Não avaliado'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <StarRating
                        value={userRating}
                        onChange={(r) => {
                          setUserRating(r);
                          toast.success(`Nota ${r} ★ registrada!`);
                        }}
                        size={22}
                        starColor="text-amber-400"
                        emptyColor="text-white/30"
                        showValue={false}
                      />
                      <span className="text-[11px] font-sans text-white/70">
                        {userRating > 0 ? 'Clique para alterar nota' : 'Clique nas estrelas para avaliar'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 bg-white/10 border-2 border-white/30 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Star size={16} weight="fill" className="text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Sua Avaliação • screeK
                        </span>
                      </div>
                      <p className="text-xs text-white/75 font-sans">
                        Faça login para dar nota, registrar no seu diário e ver o que seus amigos acharam.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openModal('login')}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-black uppercase flex items-center gap-1.5 border border-primary hover:bg-primary/90 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] cursor-pointer shrink-0"
                    >
                      <SignIn size={15} weight="bold" />
                      <span>Entrar / Avaliar</span>
                    </button>
                  </div>
                )}

                {/* 2. CURVA DE NOTAS DA COMUNIDADE (Em vez de caixas brutas soltas) */}
                <div className="p-3 bg-white/10 border-2 border-white/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-black text-white/80 uppercase tracking-wider">
                      Curva de Notas da Comunidade
                    </span>
                    <span className="text-[10px] font-mono text-white/60">
                      {movie.global_votes || '20k'} avaliações
                    </span>
                  </div>
                  <RatingDistribution
                    variant="compact"
                    averageRating={movie.global_rating}
                    totalVotes={movie.global_votes || '20k'}
                    distribution={movie.rating_distribution}
                  />
                </div>
              </div>

              {/* Blocky Action Grid (Inspirado no Gibizin / Letterboxd) */}
              <div className="space-y-2 pt-2 max-w-xl">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {/* 1. Já Assisti */}
                  <button
                    type="button"
                    onClick={handleWatchedToggle}
                    className={`h-16 flex flex-col items-center justify-center p-1 border-2 text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 ${
                      watched
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-white/40 hover:bg-muted'
                    }`}
                  >
                    <Check size={18} weight={watched ? 'bold' : 'regular'} className="mb-0.5" />
                    <span className="leading-tight text-center">{watched ? 'Assistido' : 'Já Assisti'}</span>
                  </button>

                  {/* 2. Favoritar */}
                  <button
                    type="button"
                    onClick={handleLikedToggle}
                    className={`h-16 flex flex-col items-center justify-center p-1 border-2 text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 ${
                      liked
                        ? 'bg-[#DC3545] text-white border-[#DC3545]'
                        : 'bg-card text-foreground border-white/40 hover:bg-muted'
                    }`}
                  >
                    <Heart size={18} weight={liked ? 'fill' : 'regular'} className="mb-0.5" />
                    <span className="leading-tight text-center">{liked ? 'Favorito' : 'Favoritar'}</span>
                  </button>

                  {/* 3. Watchlist */}
                  <button
                    type="button"
                    onClick={handleWatchlistToggle}
                    className={`h-16 flex flex-col items-center justify-center p-1 border-2 text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 ${
                      inWatchlist
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-card text-foreground border-white/40 hover:bg-muted'
                    }`}
                  >
                    <BookmarkSimple size={18} weight={inWatchlist ? 'fill' : 'regular'} className="mb-0.5" />
                    <span className="leading-tight text-center">{inWatchlist ? 'Salvo' : 'Watchlist'}</span>
                  </button>

                  {/* 4. Review */}
                  <button
                    type="button"
                    onClick={handleOpenReviewModal}
                    className="h-16 flex flex-col items-center justify-center p-1 bg-card text-foreground border-2 border-white/40 hover:bg-muted text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <FilmStrip size={18} weight="bold" className="mb-0.5" />
                    <span className="leading-tight text-center">Review</span>
                  </button>

                  {/* 5. 📸 Story Social */}
                  <button
                    type="button"
                    onClick={() => setShowStoryModal(true)}
                    className="h-16 flex flex-col items-center justify-center p-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-white border-2 border-emerald-400/80 hover:bg-emerald-500/30 text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-0.5 active:translate-y-0.5"
                    title="Gerar Story para Instagram"
                  >
                    <Sparkle size={18} weight="fill" className="mb-0.5 text-emerald-400" />
                    <span className="leading-tight text-center text-emerald-300">📸 Story</span>
                  </button>

                  {/* 6. Link */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success('Link copiado para a área de transferência!');
                    }}
                    className="h-16 flex flex-col items-center justify-center p-1 bg-card text-foreground border-2 border-white/40 hover:bg-muted text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                    title="Compartilhar Link"
                  >
                    <ShareNetwork size={18} weight="bold" className="mb-0.5" />
                    <span className="leading-tight text-center">Link</span>
                  </button>
                </div>

                {/* Full-width "Adicionar a Listas" button */}
                <button
                  type="button"
                  onClick={() => {
                    requireAuth(() => {
                      setShowAddToListModal(true);
                    });
                  }}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm text-xs font-black uppercase tracking-wider flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ListPlus size={16} weight="bold" />
                    Adicionar a uma Lista
                  </span>
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. SYNOPSIS, RATING DISTRIBUTION & TECHNICAL INFO ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Synopsis + Rating Distribution (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Synopsis (7 cols) */}
          <section className="lg:col-span-7 space-y-3">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground border-b-2 border-foreground/20 pb-2">
              Sinopse
            </h2>
            <p className="font-sans text-sm sm:text-base text-foreground/80 leading-relaxed">
              {movie.overview}
            </p>

            {/* Informações Técnicas Blocadas (Sem orçamento e sem bilheteria) */}
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground font-mono">
                Informações Técnicas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoBlock
                  label="Direção"
                  value={movie.directors && movie.directors.length > 0 && !movie.directors[0].includes('não informad') ? movie.directors.join(', ') : 'Não informada'}
                />
                <InfoBlock
                  label="Roteiro"
                  value={movie.writers && movie.writers.length > 0 && !movie.writers[0].includes('não informad') ? movie.writers.join(', ') : 'Não informado'}
                />
                <InfoBlock
                  label="País de Origem"
                  value={movie.origin_country || '🇺🇸 Estados Unidos'}
                  icon={<GlobeHemisphereWest size={16} />}
                />
                <InfoBlock
                  label="Idioma Original"
                  value={movie.original_language || 'Inglês'}
                  icon={<Translate size={16} />}
                />
                <InfoBlock
                  label="Produtora / Estúdio"
                  value={movie.production_company || 'Village Roadshow / Warner'}
                  icon={<Buildings size={16} />}
                />
                <InfoBlock
                  label="Classificação"
                  value={`${movie.age_rating} Anos`}
                />
                <InfoBlock
                  label="Duração"
                  value={movie.duration_display}
                />
                <InfoBlock
                  label="Lançamento"
                  value={movie.release_year.toString()}
                />
              </div>
            </div>
          </section>

          {/* Right: Distribuição de Avaliações (5 cols) */}
          <div className="lg:col-span-5">
            <RatingDistribution
              distribution={movie.rating_distribution}
              averageRating={movie.global_rating}
              totalVotes={movie.global_votes || '28.4k'}
            />
          </div>
        </div>

        {/* Cast */}
        {movie.credits && movie.credits.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground border-b-2 border-foreground/20 pb-2">
              Elenco Principal
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {movie.credits.map((actor) => (
                <div
                  key={actor.id}
                  className="p-3 bg-background border-2 border-foreground/30 flex flex-col justify-between space-y-1"
                >
                  <div className="w-10 h-10 bg-primary/20 text-primary font-black text-xs flex items-center justify-center border border-primary/40 mb-2">
                    {actor.person.initials || actor.person.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-extrabold text-foreground line-clamp-1">
                    {actor.person.name}
                  </span>
                  <span className="font-sans text-[10px] text-foreground/60 line-clamp-1">
                    {actor.character}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Movies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Filmes Semelhantes &amp; Recomendações
            </h2>
            <Link
              to="/movies"
              className="text-xs font-black uppercase text-primary hover:underline flex items-center gap-1"
            >
              <span>Ver Catálogo</span>
              <CaretRight size={14} weight="bold" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {similarMovies.map((sim) => (
              <MovieCard
                key={sim.id}
                id={sim.id}
                title={sim.title}
                posterUrl={sim.poster_url}
                rating={sim.global_rating}
                genre={sim.genres[0] || 'DRAMA'}
                duration={sim.duration_display}
                ageRating={sim.age_rating}
                linkTo={`/movies/${sim.id}`}
              />
            ))}
          </div>
        </section>

        {/* Reviews Community Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Reviews da Comunidade screeK
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewModal(true)}
              className="rounded-none border-2 border-foreground/40 text-xs font-black uppercase"
            >
              Adicionar Review
            </Button>
          </div>

          <div className="space-y-3">
            <ReviewRow
              name="Beatriz Lima"
              handle="@beatrizl"
              dateLabel="Ontem"
              avatarUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              rating={5}
              reviewText="Uma das maiores experiências audiovisuais da história do cinema! A trilha sonora e o ritmo não deixam você respirar por um segundo."
              likesCount={42}
              commentsCount={7}
            />
            <ReviewRow
              name="Henrique Farias"
              handle="@henriquef"
              dateLabel="Há 2 dias"
              avatarUrl="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"
              rating={5}
              hasSpoiler={true}
              reviewText="[CONTÉM SPOILER] A cena do confronto no porto e a revelação do passado do personagem trazem uma carga emocional devastadora que redefine o final do filme."
              likesCount={28}
              commentsCount={5}
            />
            <ReviewRow
              name="Gabriel Souza"
              handle="@gabriels"
              dateLabel="Há 3 dias"
              avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
              rating={4.5}
              reviewText="Revisitar esse clássico no IMAX do Bourbon foi uma loucura. A direção de arte e a montagem continuam anos à frente de seu tempo."
              likesCount={19}
              commentsCount={2}
            />
          </div>
        </section>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-background border-4 border-foreground text-foreground max-w-lg w-full p-6 space-y-4 shadow-[8px_8px_0px_0px_var(--border)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-foreground/30 pb-3">
              <h3 className="text-lg font-black uppercase">Escrever Review — {movie.title}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase block mb-1">Sua Avaliação</label>
                <StarRating value={userRating} onChange={setUserRating} size={20} />
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1">Seu Comentário</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Compartilhe seus pensamentos sobre o filme, direção, trilha..."
                  rows={4}
                  className="w-full p-3 bg-background border-2 border-foreground/40 text-xs font-sans placeholder:text-foreground/40 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="spoiler"
                  checked={containsSpoilers}
                  onChange={(e) => setContainsSpoilers(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="spoiler" className="text-xs font-bold text-foreground/80 cursor-pointer">
                  Este comentário contém spoilers
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-foreground/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewModal(false)}
                className="rounded-none border-2 border-foreground/40 uppercase font-black text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePublishReview}
                className="rounded-none border-2 border-primary uppercase font-black text-xs bg-primary text-primary-foreground"
              >
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shareable Story Modal (Letterboxd Style) */}
      {movie && (
        <ShareableStoryModal
          isOpen={showStoryModal}
          onClose={() => setShowStoryModal(false)}
          mode="single"
          movie={movie}
          userRating={userRating > 0 ? userRating : 5.0}
        />
      )}

      {/* Add To List Modal */}
      {movie && (
        <AddToListModal
          isOpen={showAddToListModal}
          onClose={() => setShowAddToListModal(false)}
          movie={movie}
        />
      )}

      {/* Log Diary Modal */}
      {movie && (
        <LogDiaryModal
          isOpen={showDiaryModal}
          onClose={() => setShowDiaryModal(false)}
          movie={movie}
          initialRating={userRating}
        />
      )}
    </div>
  );
}
