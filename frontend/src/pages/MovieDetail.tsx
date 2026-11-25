import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  BookmarkSimple,
  Check,
  ShareNetwork,
  ArrowLeft,
  CaretLeft,
  X,
  CaretRight,
  SignIn,
  Sparkle,
  CaretDown,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { ReviewRow } from '../components/custom/review-row';
import { StarRating } from '../components/custom/star-rating';
import { MovieCard } from '../components/custom/movie-card';
import { RatingDistribution } from '../components/custom/rating-distribution';
import { PersonCard } from '../components/custom/person-card';
import { SectionHeading } from '../components/custom/section-heading';
import { ShareableStoryModal } from '../components/custom/shareable-story-modal';
import { AddToListModal } from '../components/custom/add-to-list-modal';
import { LogDiaryModal } from '../components/custom/log-diary-modal';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { movieService } from '../services/movieService';
import type { Movie, Person } from '../types/movie';

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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const castContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeShareMenu = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };
    const closeShareMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowShareOptions(false);
    };

    document.addEventListener('mousedown', closeShareMenu);
    document.addEventListener('keydown', closeShareMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeShareMenu);
      document.removeEventListener('keydown', closeShareMenuOnEscape);
    };
  }, []);

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

  const getCreditsForRole = (role: 'DIRECTOR' | 'WRITER') =>
    movie.credits.filter((credit) => credit.role.toUpperCase() === role);

  const scrollCast = (direction: 'left' | 'right') => {
    castContainerRef.current?.scrollBy({
      left: direction === 'left' ? -500 : 500,
      behavior: 'smooth',
    });
  };

  const peopleLinks = (names: string[], role: 'DIRECTOR' | 'WRITER') => names
    .filter((name) => name && !/não informad/i.test(name))
    .map((name, index) => {
      const credit = getCreditsForRole(role).find((item) => item.person.name.toLowerCase() === name.toLowerCase());
      const href = credit
        ? `/people/${credit.person.tmdb_id ?? credit.person.id}`
        : `/search?q=${encodeURIComponent(name)}&tab=people`;
      return (
        <span key={`${role}-${name}`}>
          {index > 0 && ', '}
          <Link to={href} className="font-bold text-white underline decoration-white/40 underline-offset-2 hover:text-secondary hover:decoration-secondary">{name}</Link>
        </span>
      );
    });

  const castCardCandidates: Array<{ key: string; person: Person; subtitle: string; href?: string }> = [
    ...movie.credits.filter((credit) => credit.role.toUpperCase() === 'ACTOR').map((credit) => ({
      key: `actor-${credit.id}`,
      person: { ...credit.person, role_display: 'Atuação' },
      subtitle: credit.character || 'Personagem não informado',
    })),
    ...(['DIRECTOR', 'WRITER'] as const).flatMap((role) => {
      const names = role === 'DIRECTOR' ? movie.directors : movie.writers;
      const label = role === 'DIRECTOR' ? 'Direção' : 'Roteiro';
      return names
        .filter((name) => name && !/não informad/i.test(name))
        .map((name) => {
          const credit = getCreditsForRole(role).find((item) => item.person.name.toLowerCase() === name.toLowerCase());
          const person = credit?.person ?? {
            id: 0,
            name,
            initials: name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
          };
          return {
            key: `${role}-${name}`,
            person: { ...person, role_display: 'Equipe' },
            subtitle: label,
            href: credit
              ? `/people/${credit.person.tmdb_id ?? credit.person.id}`
              : `/search?q=${encodeURIComponent(name)}&tab=people`,
          };
        });
    }),
  ];
  const castCards = castCardCandidates.reduce<typeof castCardCandidates>((cards, card) => {
    const existing = cards.find((item) => item.person.name.toLowerCase() === card.person.name.toLowerCase());
    if (existing) {
      if (!existing.subtitle.includes(card.subtitle)) existing.subtitle = `${existing.subtitle} · ${card.subtitle}`;
    } else {
      cards.push(card);
    }
    return cards;
  }, []);

  return (
    <div className="bg-background pb-0 font-display text-foreground">
      {/* ─── 1. HERO BACKDROP SECTION ─── */}
      <section className="relative w-full overflow-hidden border-b-4 border-foreground/40 bg-tertiary">
        <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-65 transition-transform duration-700" style={{ backgroundImage: `url(${movie.backdrop_url})` }} />
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-tertiary/40 to-foreground/35" />

        <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:max-w-5xl lg:max-w-6xl sm:px-6 lg:px-8">
          <Link to="/movies" className="inline-flex items-center gap-2 border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-black/60">
            <ArrowLeft size={16} weight="bold" /><span>Voltar ao catálogo</span>
          </Link>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px] xl:gap-8">
            <div className="grid items-start gap-5 text-white sm:grid-cols-[minmax(150px,210px)_minmax(0,1fr)] sm:gap-7">
              <div className="mx-auto flex w-36 shrink-0 flex-col gap-3 sm:mx-0 sm:w-full">
                <div className="relative border-4 border-white/80">
                  <img src={movie.poster_url} alt={movie.title} className="aspect-[2/3] w-full bg-muted object-cover" />
                  <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-xs font-black uppercase ${getAgeRatingBg(movie.age_rating)}`}>{movie.age_rating}</span>
                    {movie.is_in_theaters && <span className="bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">Em cartaz</span>}
                  </div>
                </div>
                <Button asChild size="lg" className="h-auto w-full px-2 py-3 text-center text-xs sm:px-3 sm:text-sm">
                  <Link to={`/movies/${movie.id}/sessions`}>Ver sessões</Link>
                </Button>
              </div>

              <div className="flex min-w-0 flex-col items-start gap-5 pt-1 sm:pt-0">
                <div className="w-full">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-white/80">
                    <span>{movie.release_year}</span><span>·</span><span>{movie.duration_display}</span>
                    {movie.origin_country && <><span>·</span><span className="text-white">{movie.origin_country}</span></>}
                    {movie.genres.map((genre) => <span key={genre} className="border border-white/40 bg-white/10 px-2 py-0.5 text-[10px]">{genre}</span>)}
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">{movie.title}</h1>
                  {movie.original_title && <p className="mt-1 text-xs font-bold uppercase text-white/60 sm:text-sm">Título original: {movie.original_title}</p>}
                </div>

                <div className="space-y-1.5 text-xs text-white/80">
                  <p><span className="font-mono text-[10px] font-black uppercase tracking-wider text-white/55">Direção</span> {peopleLinks(movie.directors, 'DIRECTOR')}</p>
                  <p><span className="font-mono text-[10px] font-black uppercase tracking-wider text-white/55">Roteiro</span> {peopleLinks(movie.writers, 'WRITER')}</p>
                </div>
              </div>
            </div>

            <aside className="border-2 border-white/30 bg-foreground/80 text-background backdrop-blur-md">
              <div className="grid grid-cols-3 divide-x divide-white/20 border-b border-white/20">
                <button type="button" onClick={handleWatchedToggle} className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-white/75 transition-colors hover:bg-white/10 hover:text-white"><Check size={19} weight={watched ? 'fill' : 'bold'} className={watched ? 'text-primary' : ''} />{watched ? 'Assistido' : 'Assisti'}</button>
                <button type="button" onClick={handleLikedToggle} className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-white/75 transition-colors hover:bg-white/10 hover:text-white"><Heart size={19} weight={liked ? 'fill' : 'bold'} className={liked ? 'text-secondary' : ''} />{liked ? 'Curtido' : 'Curtir'}</button>
                <button type="button" onClick={handleWatchlistToggle} className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-white/75 transition-colors hover:bg-white/10 hover:text-white"><BookmarkSimple size={19} weight={inWatchlist ? 'fill' : 'bold'} className={inWatchlist ? 'text-secondary' : ''} />Watchlist</button>
              </div>

              <div className="space-y-2 border-b border-white/20 p-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/70"><span>Sua avaliação</span><span className="font-mono text-sm text-secondary">{userRating > 0 ? userRating.toFixed(1) : '—'}</span></div>
                {isAuthenticated ? (
                  <StarRating value={userRating} onChange={(rating) => { setUserRating(rating); toast.success(`Nota ${rating} ★ registrada!`); }} size={22} starColor="text-secondary" emptyColor="text-white/30" showValue={false} />
                ) : (
                  <button type="button" onClick={() => openModal('login')} className="flex w-full items-center justify-between text-xs font-bold text-white/65 hover:text-white"><span>Entre para avaliar</span><SignIn size={15} weight="bold" /></button>
                )}
              </div>

              <div className="divide-y divide-white/20">
                <button type="button" onClick={handleOpenReviewModal} className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-white/85 transition-colors hover:bg-white/10">Escrever review <CaretRight size={14} weight="bold" /></button>
                <button type="button" onClick={() => requireAuth(() => setShowAddToListModal(true))} className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-white/85 transition-colors hover:bg-white/10">Adicionar a listas <CaretRight size={14} weight="bold" /></button>
                <div ref={shareMenuRef} className="relative">
                  <Button type="button" variant="ghost" onClick={() => setShowShareOptions((open) => !open)} aria-haspopup="menu" aria-expanded={showShareOptions} className="h-auto w-full justify-between px-4 py-3 text-left text-xs font-bold text-white/85 hover:bg-white/10 hover:text-white shadow-none"><span className="flex items-center gap-2"><ShareNetwork size={15} weight="bold" />Compartilhar</span><CaretDown size={14} weight="bold" className={`transition-transform ${showShareOptions ? 'rotate-180' : ''}`} /></Button>
                  {showShareOptions && <div role="menu" className="absolute right-2 top-full z-30 mt-1 w-48 border-2 border-foreground/40 bg-background py-1 text-foreground">
                    <button type="button" role="menuitem" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copiado para a área de transferência!'); } catch { toast.error('Não foi possível copiar o link.'); } setShowShareOptions(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary"><ShareNetwork size={15} weight="bold" />Copiar link</button>
                    <button type="button" role="menuitem" onClick={() => { setShowShareOptions(false); setShowStoryModal(true); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-primary/10 hover:text-primary"><Sparkle size={15} weight="fill" />Criar Story</button>
                  </div>}
                </div>
              </div>

              <div className="p-4">
                <div className="mb-1 flex items-baseline justify-between gap-2"><span className="text-[10px] font-mono font-black uppercase tracking-wider text-white/60">Nota da comunidade</span><span className="font-display text-2xl font-black text-background">{movie.global_rating.toFixed(1)}</span></div>
                <RatingDistribution variant="compact" averageRating={movie.global_rating} totalVotes={movie.global_votes || '20k'} distribution={movie.rating_distribution} />
              </div>
            </aside>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-4xl space-y-8 px-4 pb-4 pt-10 md:max-w-5xl lg:max-w-6xl sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-5">
          <section className="space-y-3 lg:col-span-3">
            <SectionHeading title="Sinopse" />
            <p className="font-sans text-sm leading-relaxed text-foreground/80 sm:text-base">{movie.overview}</p>
          </section>

          <section className="space-y-3 lg:col-span-2">
            <SectionHeading title="Ficha técnica" />
            <dl className="divide-y divide-foreground/15 border-y border-foreground/20">
              {[
                ['Direção', movie.directors?.join(', ') || 'Não informada'],
                ['Roteiro', movie.writers?.join(', ') || 'Não informado'],
                ['Produtora', movie.production_company || 'Não informada'],
                ['Classificação', `${movie.age_rating} anos`],
                ['Idioma original', movie.original_language || 'Não informado'],
                ['País', movie.origin_country || 'Não informado'],
                ['Duração', movie.duration_display],
                ['Lançamento', String(movie.release_year)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground/55">{label}</dt>
                  <dd className="text-right text-xs font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {castCards.length > 0 && (
          <section className="space-y-4">
            <SectionHeading
              title="Elenco"
              actions={(
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button type="button" variant="ghost" size="icon" onClick={() => scrollCast('left')} aria-label="Rolar elenco para a esquerda" className="h-8 w-8 border-2 border-foreground bg-foreground/80 text-background hover:bg-primary hover:text-background sm:h-10 sm:w-10">
                    <CaretLeft size={16} weight="bold" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => scrollCast('right')} aria-label="Rolar elenco para a direita" className="h-8 w-8 border-2 border-foreground bg-foreground/80 text-background hover:bg-primary hover:text-background sm:h-10 sm:w-10">
                    <CaretRight size={16} weight="bold" />
                  </Button>
                </div>
              )}
            />
            <div ref={castContainerRef} className="flex items-stretch gap-4 overflow-x-auto scroll-smooth px-1 py-2 scrollbar-hide">
              {castCards.map((credit) => (
                <PersonCard
                  key={credit.key}
                  person={credit.person}
                  subtitle={credit.subtitle}
                  layout="carousel"
                  href={credit.href}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionHeading
            title="Reviews da comunidade"
            titleAction={(
              <Button asChild variant="link" size="sm" className="h-auto px-0 text-[10px] sm:text-xs">
                <Link to="/feed">Ver todos <CaretRight size={14} weight="bold" /></Link>
              </Button>
            )}
          />
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

        <section className="space-y-4">
          <SectionHeading
            title="Filmes semelhantes"
            titleAction={(
              <Link to="/movies" className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary hover:text-primary/80">
                Ver catálogo <CaretRight size={14} weight="bold" />
              </Link>
            )}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {similarMovies.map((similarMovie) => (
              <MovieCard
                key={similarMovie.id}
                id={similarMovie.id}
                title={similarMovie.title}
                posterUrl={similarMovie.poster_url}
                rating={similarMovie.global_rating}
                genre={similarMovie.genres[0] || 'DRAMA'}
                duration={similarMovie.duration_display}
                ageRating={similarMovie.age_rating}
                linkTo={`/movies/${similarMovie.id}`}
              />
            ))}
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
