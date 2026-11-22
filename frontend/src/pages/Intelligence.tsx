import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowClockwise, ArrowRight, Brain, Compass, Info, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { intelligenceService } from '../services/intelligenceService';
import type { RecommendationItem } from '../services/intelligenceService';

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

  return (
    <div className="bg-background text-foreground font-display">
      <header className="px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/60">
              <Brain size={20} weight="bold" className="text-secondary" /> Recomendações personalizadas
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">screeK Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground/65">Metade da lista vem da sua Watchlist e metade traz filmes fora dela. Marque o que te interessa para ajustar as próximas sugestões.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border-2 border-foreground/30 px-3 py-2 text-xs font-bold uppercase hover:bg-muted disabled:opacity-50">
              <ArrowClockwise size={16} /> Atualizar
            </button>
            <Link to="/import" className="border-2 border-foreground/30 px-3 py-2 text-xs font-bold uppercase hover:bg-muted">Importar Letterboxd</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        {error && <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm">{error}</div>}
        {loading ? <p className="py-16 text-center text-sm text-foreground/60">Carregando recomendações…</p> : null}
        {!loading && !error && items.length === 0 && <div className="py-16 text-center"><Compass size={32} className="mx-auto mb-3 text-secondary"/><p className="font-bold">Ainda não há recomendações para mostrar.</p><p className="mt-1 text-sm text-foreground/60">Adicione filmes à Watchlist ou importe seu histórico do Letterboxd.</p></div>}

        {!loading && items.length > 0 && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const movie = item.movie;
            const title = movie?.title || `Filme #${item.movie_id}`;
            const moviePath = `/movies/${movie?.id || item.movie_id}`;
            const explanation = item.reason || 'Recomendado com base no seu perfil e nos filmes do catálogo.';
            return <article key={item.movie_id} className="flex flex-col overflow-hidden border-2 border-foreground/20 bg-background shadow-[4px_4px_0px_0px_var(--border)]">
              <Link to={moviePath} className="group relative block aspect-[16/9] bg-muted">
                {movie?.backdrop_url || movie?.poster_url ? <img src={movie.backdrop_url || movie.poster_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"/> : <div className="flex h-full items-center justify-center text-foreground/30"><Brain size={36}/></div>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 text-white">
                  <h2 className="line-clamp-2 text-lg font-black uppercase">{title}</h2>
                  {movie?.year && <span className="text-xs font-medium text-white/75">{movie.year}</span>}
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-secondary">{item.is_niche_breaker ? 'Descoberta' : 'Afinidade'} · {Math.round(item.score * 100)}%</span>
                  <span className="relative inline-flex" title={explanation} aria-label={`Por que foi recomendado: ${explanation}`}>
                    <Info size={18} className="text-foreground/50"/><span className="sr-only">{explanation}</span>
                  </span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-foreground/60">{explanation}</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-foreground/10 pt-3">
                  <div className="flex gap-2">
                    <button title="Tenho interesse" aria-label={`Tenho interesse em ${title}`} disabled={busyMovie === item.movie_id} onClick={() => void giveFeedback(item, 'interested')} className={`rounded border p-2 hover:bg-muted disabled:opacity-50 ${item.feedback === 'interested' ? 'border-primary text-primary' : 'border-foreground/20 text-foreground/60'}`}><ThumbsUp size={17}/></button>
                    <button title="Não me interessa" aria-label={`Não me interessa ${title}`} disabled={busyMovie === item.movie_id} onClick={() => void giveFeedback(item, 'not_interested')} className="rounded border border-foreground/20 p-2 text-foreground/60 hover:bg-muted disabled:opacity-50"><ThumbsDown size={17}/></button>
                  </div>
                  <Link to={moviePath} className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary hover:underline">Ver filme <ArrowRight size={14}/></Link>
                </div>
              </div>
            </article>;
          })}
        </div>}
      </main>
    </div>
  );
}
