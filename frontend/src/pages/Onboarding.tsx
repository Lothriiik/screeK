import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkle,
  Check,
  ArrowRight,
  CheckCircle,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIES } from '../mocks';

const GENRE_PREFERENCES = [
  'Sci-Fi',
  'Ação',
  'Terror',
  'Anime & Animação',
  'Suspense',
  'Drama',
  'Giallo & Cult',
  'Cinema Asiático',
];

export function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Sci-Fi', 'Ação']);
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>(['speed-racer']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleMovie = (id: string) => {
    if (selectedMovieIds.includes(id)) {
      setSelectedMovieIds(selectedMovieIds.filter((mId) => mId !== id));
    } else {
      if (selectedMovieIds.length >= 5) {
        toast.warning('Você já selecionou o limite máximo de 5 filmes.');
        return;
      }
      setSelectedMovieIds([...selectedMovieIds, id]);
    }
  };

  const filteredMovies = MOCK_MOVIES.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q)) ||
      m.directors.some((d) => d.toLowerCase().includes(q))
    );
  });

  const handleFinish = () => {
    if (selectedMovieIds.length < 3) {
      toast.error('Selecione pelo menos 3 filmes para calibrar o seu perfil.');
      return;
    }

    toast.success('Perfil calibrado com sucesso pelo screeK Intelligence!');
    navigate('/intelligence');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. HERO BANNER ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-10">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/40 text-primary text-xs font-black uppercase">
            <Sparkle size={16} weight="fill" />
            <span>screeK Intelligence • Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase text-foreground tracking-tight">
            Calibre seu Gosto Cinéfilo
          </h1>

          <p className="font-sans text-sm sm:text-base text-foreground/80 max-w-xl mx-auto">
            {step === 1
              ? 'Selecione os gêneros e estilos que você mais gosta para ajustarmos o algoritmo.'
              : 'Escolha de 3 a 5 filmes que definem o seu gosto para ativarmos as recomendações ponderadas.'}
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 border-2 text-xs font-black uppercase ${
                step === 1
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-muted/40 text-foreground/60 border-foreground/20'
              }`}
            >
              <span>1. Gêneros &amp; Vibe</span>
            </div>

            <span className="text-foreground/30 font-bold">→</span>

            <div
              className={`flex items-center gap-2 px-4 py-1.5 border-2 text-xs font-black uppercase ${
                step === 2
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-muted/40 text-foreground/60 border-foreground/20'
              }`}
            >
              <span>2. Seleção de Filmes ({selectedMovieIds.length}/5)</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 2. STEP CONTENTS ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-8">
        
        {/* ─── ETAPA 1: GÊNEROS & VIBES ─── */}
        {step === 1 && (
          <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-3">
              <h2 className="text-base sm:text-lg font-black uppercase text-foreground">
                Seus Estilos Favoritos ({selectedGenres.length} selecionados)
              </h2>
              <span className="text-xs text-foreground/50 font-sans">
                Clique nos cards para selecionar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GENRE_PREFERENCES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`p-4 border-2 text-left font-display font-black text-xs uppercase transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)]'
                        : 'bg-background hover:bg-muted text-foreground border-foreground/30'
                    }`}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check size={16} weight="bold" className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span>Avançar para Filmes</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ETAPA 2: SELEÇÃO DE 3 A 5 FILMES ─── */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Search Bar & Counter */}
            <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={18}
                  weight="bold"
                  className="absolute left-3.5 top-3.5 text-foreground/50 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar títulos para calibrar..."
                  className="w-full h-11 pl-10 pr-4 bg-background border-2 border-foreground/30 font-sans text-xs sm:text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/40"
                />
              </div>

              {/* Progress counter badge */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 bg-muted/40 border-2 border-foreground/30 text-xs font-black uppercase text-foreground shrink-0">
                  <span>Selecionados: </span>
                  <span className={selectedMovieIds.length >= 3 ? 'text-secondary font-mono' : 'text-primary font-mono'}>
                    {selectedMovieIds.length}/5 (mínimo 3)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={selectedMovieIds.length < 3}
                  className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    selectedMovieIds.length >= 3
                      ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-primary/90'
                      : 'bg-muted text-foreground/40 border-foreground/20 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Concluir Calibração</span>
                </button>
              </div>

            </div>

            {/* Movies Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMovies.map((movie) => {
                const isSelected = selectedMovieIds.includes(movie.id);

                return (
                  <div
                    key={movie.id}
                    onClick={() => toggleMovie(movie.id)}
                    className={`relative border-4 overflow-hidden cursor-pointer transition-all group flex flex-col justify-between ${
                      isSelected
                        ? 'border-secondary shadow-[5px_5px_0px_0px_var(--secondary)] -translate-y-1'
                        : 'border-foreground/40 shadow-[3px_3px_0px_0px_var(--border)] hover:border-primary'
                    }`}
                  >
                    <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Selected check overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-secondary/30 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="w-10 h-10 bg-secondary text-white border-2 border-white flex items-center justify-center shadow-lg animate-in zoom-in-75 duration-150">
                            <Check size={22} weight="bold" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-background border-t-2 border-foreground/20 space-y-0.5">
                      <h4 className="text-xs font-black uppercase text-foreground truncate">
                        {movie.title}
                      </h4>
                      <span className="text-[10px] text-foreground/60 font-sans block truncate">
                        {movie.release_year} • {movie.genres[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-foreground/20">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-xs uppercase"
              >
                ← Voltar para Gêneros
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={selectedMovieIds.length < 3}
                className={`px-6 py-2.5 font-black text-xs uppercase tracking-wider border-2 flex items-center gap-2 transition-all ${
                  selectedMovieIds.length >= 3
                    ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted text-foreground/40 border-foreground/20 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={16} weight="bold" />
                <span>Concluir Calibração</span>
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
