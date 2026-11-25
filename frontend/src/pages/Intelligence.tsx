import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowClockwise, Brain, CaretLeft, CaretRight, Compass, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { intelligenceService } from '../services/intelligenceService';
import type { RecommendationItem } from '../services/intelligenceService';

// Helper to convert reason text to tags
function extractReasonTags(reason: string | undefined): string[] {
  if (!reason) return [];
  
  // Convert reason text to tag-like format
  const lowerReason = reason.toLowerCase();
  const tags: string[] = [];
  
  if (lowerReason.includes('watchlist')) tags.push('NA SUA WATCHLIST');
  if (lowerReason.includes('afinidade') || lowerReason.includes('perfil')) tags.push('ALTA AFINIDADE');
  if (lowerReason.includes('parecido') || lowerReason.includes('similar')) {
    const movieMatch = reason.match(/(?:parecido com|similar to) (.+?)(?:\.|$)/i);
    if (movieMatch) tags.push(`PARECIDO COM ${movieMatch[1].toUpperCase()}`);
    else tags.push('PARECIDO COM TUDO O LUGAR');
  }
  if (lowerReason.includes('diretor') || lowerReason.includes('director')) tags.push('MESMO DIRETOR');
  if (lowerReason.includes('gênero') || lowerReason.includes('genre')) tags.push('MESMO GÊNERO');
  
  return tags.length > 0 ? tags : ['RECOMENDADO PARA VOCÊ'];
}

interface RecommendationSectionProps {
  title: string;
  badge: string;
  badgeColor: string;
  items: RecommendationItem[];
  busyMovie: number | null;
  onFeedback: (item: RecommendationItem, feedback: 'interested' | 'not_interested') => void;
  rightInfo?: string;
}

function RecommendationSection({ title, badge, badgeColor, items, busyMovie, onFeedback, rightInfo }: RecommendationSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 600;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="relative w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {rightInfo && (
            <span className="text-xs font-bold text-foreground/60 font-sans hidden sm:block">
              {rightInfo}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-7 h-7 sm:w-10 sm:h-10 bg-foreground/80 hover:bg-primary text-background border-2 border-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
              aria-label="Anterior"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-7 h-7 sm:w-10 sm:h-10 bg-foreground/80 hover:bg-primary text-background border-2 border-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
              aria-label="Próximo"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={containerRef}
        className="flex items-stretch gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
      >
        {items.map(item => {
          const movie = item.movie;
          const title = movie?.title || `Filme #${item.movie_id}`;
          const moviePath = `/movies/${movie?.id || item.movie_id}`;
          const tags = extractReasonTags(item.reason);
          
          return (
            <article key={item.movie_id} className="w-[280px] sm:w-[320px] shrink-0 flex flex-col overflow-hidden border-4 border-foreground/30 bg-background shadow-[4px_4px_0px_0px_var(--border)]">
              <Link to={moviePath} className="group relative block aspect-[16/9] bg-muted">
                {/* Badge no topo */}
                <div className={`absolute top-2 left-2 ${badgeColor} text-white text-[10px] font-black uppercase px-2 py-1 z-10`}>
                  {badge}
                </div>
                
                {movie?.backdrop_url || movie?.poster_url ? (
                  <img 
                    src={movie.backdrop_url || movie.poster_url} 
                    alt="" 
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-foreground/30">
                    <Brain size={36}/>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 text-white">
                  <h2 className="line-clamp-2 text-lg font-black uppercase">{title}</h2>
                  {movie?.year && <span className="text-xs font-medium text-white/75">{movie.year}</span>}
                </div>
              </Link>
              
              <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Tags de justificativa */}
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="text-[9px] font-black uppercase border-2 border-foreground/30 px-2 py-0.5 text-foreground/70 bg-background"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-auto space-y-2">
                  {/* Like/Dislike buttons */}
                  <div className="flex gap-2">
                    <button 
                      title="Tenho interesse" 
                      aria-label={`Tenho interesse em ${title}`} 
                      disabled={busyMovie === item.movie_id} 
                      onClick={() => onFeedback(item, 'interested')} 
                      className={`flex-1 border-2 py-2 px-3 text-xs font-black uppercase transition-all disabled:opacity-50 ${
                        item.feedback === 'interested' 
                          ? 'border-primary bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]' 
                          : 'border-foreground/30 text-foreground/70 hover:bg-muted'
                      }`}
                    >
                      <ThumbsUp size={16} weight="bold" className="mx-auto" />
                    </button>
                    <button 
                      title="Não me interessa" 
                      aria-label={`Não me interessa ${title}`} 
                      disabled={busyMovie === item.movie_id} 
                      onClick={() => onFeedback(item, 'not_interested')} 
                      className="flex-1 border-2 border-foreground/30 py-2 px-3 text-xs font-black uppercase text-foreground/70 hover:bg-muted disabled:opacity-50 transition-all"
                    >
                      <ThumbsDown size={16} weight="bold" className="mx-auto" />
                    </button>
                  </div>
                  
                  {/* Ver Filme button */}
                  <Link 
                    to={moviePath} 
                    className="w-full block text-center bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 text-xs font-black uppercase transition-all border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)]"
                  >
                    Ver Filme ›
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Intelligence() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyMovie, setBusyMovie] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems(await intelligenceService.getRecommendations(20)); }
    catch { setError('Não foi possível carregar suas recomendações. Tente novamente.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const giveFeedback = async (item: RecommendationItem, feedback: 'interested' | 'not_interested') => {
    setBusyMovie(item.movie_id);
    try {
      await intelligenceService.setRecommendationFeedback(item.movie_id, feedback);
      if (feedback === 'not_interested') setItems(current => current.filter(movie => movie.movie_id !== item.movie_id));
      else setItems(current => current.map(movie => movie.movie_id === item.movie_id ? { ...movie, feedback } : movie));
    } catch { setError('Não foi possível salvar sua preferência.'); }
    finally { setBusyMovie(null); }
  };

  // Separate items into three categories
  // For now, distribute evenly since we don't have session data in the recommendation
  const nowPlayingItems = items.slice(0, Math.floor(items.length / 3));
  const watchlistItems = items.slice(Math.floor(items.length / 3), Math.floor(items.length * 2 / 3)).filter(item => !item.is_niche_breaker);
  const discoveryItems = items.slice(Math.floor(items.length * 2 / 3)).concat(items.filter(item => item.is_niche_breaker));

  return (
    <div className="bg-background text-foreground font-display">
      <header className="page-divider px-4 py-8 sm:px-0">
        <div className="mx-auto flex max-w-4xl md:max-w-5xl lg:max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/60">
              <Brain size={20} weight="bold" className="text-secondary" /> Recomendações personalizadas
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">screeK Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground/65">Metade da lista vem da sua Watchlist e metade traz filmes fora dela. Marque o que te interessa para ajustar as próximas sugestões.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border-2 border-foreground/30 px-3 py-2 text-xs font-bold uppercase hover:bg-muted disabled:opacity-50 shadow-[2px_2px_0px_0px_var(--border)]">
              <ArrowClockwise size={16} /> Atualizar
            </button>
            <Link to="/import" className="border-2 border-foreground/30 px-3 py-2 text-xs font-bold uppercase hover:bg-muted shadow-[2px_2px_0px_0px_var(--border)]">Importar Letterboxd</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 py-8 space-y-12">
        {error && <div role="alert" className="border-2 border-destructive/40 bg-destructive/5 p-4 text-sm shadow-[3px_3px_0px_0px_var(--border)]">{error}</div>}
        {loading ? <p className="py-16 text-center text-sm text-foreground/60">Carregando recomendações…</p> : null}
        {!loading && !error && items.length === 0 && <div className="py-16 text-center"><Compass size={32} className="mx-auto mb-3 text-secondary"/><p className="font-bold">Ainda não há recomendações para mostrar.</p><p className="mt-1 text-sm text-foreground/60">Adicione filmes à Watchlist ou importe seu histórico do Letterboxd.</p></div>}

        {!loading && items.length > 0 && (
          <>
            {/* Em Cartaz Section */}
            {nowPlayingItems.length > 0 && (
              <RecommendationSection
                title="Em Cartaz"
                badge="EM CARTAZ"
                badgeColor="bg-primary"
                items={nowPlayingItems}
                busyMovie={busyMovie}
                onFeedback={giveFeedback}
                rightInfo="você pode ver hoje"
              />
            )}

            {/* Da Sua Watchlist Section */}
            {watchlistItems.length > 0 && (
              <RecommendationSection
                title="Da Sua Watchlist"
                badge="DA SUA WATCHLIST"
                badgeColor="bg-[#2C2640]"
                items={watchlistItems}
                busyMovie={busyMovie}
                onFeedback={giveFeedback}
                rightInfo={`${watchlistItems.length} de ${items.length}`}
              />
            )}

            {/* Descobertas Section */}
            {discoveryItems.length > 0 && (
              <RecommendationSection
                title="Descobertas"
                badge="DESCOBERTA"
                badgeColor="bg-[#D64545]"
                items={discoveryItems}
                busyMovie={busyMovie}
                onFeedback={giveFeedback}
                rightInfo="fora da sua watchlist"
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
