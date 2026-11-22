import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FilmStrip,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { MovieCard } from '../components/custom/movie-card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui/select';
import { movieService } from '../services/movieService';
import { MOCK_MOVIES } from '../mocks/movies';
import type { Movie } from '../types/movie';

const GENRES = [
  'Todos os Gêneros',
  'AÇÃO',
  'ANIMAÇÃO',
  'SCI-FI',
  'TERROR',
  'DRAMA',
  'ROMANCE',
  'SUSPENSE',
  'WESTERN',
  'MUSICAL',
  'CRIME',
];

const DECADE_CONFIG = [
  { key: 'all', label: 'DÉCADA', startYear: 1900, endYear: 2099 },
  { key: '2020s', label: '2020s', startYear: 2020, endYear: 2029 },
  { key: '2010s', label: '2010s', startYear: 2010, endYear: 2019 },
  { key: '2000s', label: '2000s', startYear: 2000, endYear: 2009 },
  { key: '1990s', label: '1990s', startYear: 1990, endYear: 1999 },
  { key: '1980s', label: '1980s', startYear: 1980, endYear: 1989 },
  { key: '1970s', label: '1970s', startYear: 1970, endYear: 1979 },
  { key: '1960s', label: '1960s', startYear: 1960, endYear: 1969 },
  { key: '1950s', label: '1950s', startYear: 1950, endYear: 1959 },
];

const RATING_OPTIONS = [
  { key: 'all', label: 'AVALIAÇÃO' },
  { key: '5.0', label: '★ 5.0 (Perfeito)' },
  { key: '4.5', label: '★ 4.5 ou mais' },
  { key: '4.0', label: '★ 4.0 ou mais' },
  { key: '3.5', label: '★ 3.5 ou mais' },
  { key: '3.0', label: '★ 3.0 ou mais' },
  { key: '2.0', label: '★ 2.0 ou mais' },
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'STATUS' },
  { key: 'now_playing', label: 'Em Cartaz' },
  { key: 'pre_sale', label: 'Pré-Venda' },
  { key: 'upcoming', label: 'Em Breve' },
  { key: 're_release', label: 'Reexibições / Clássicos' },
];

const SORT_OPTIONS = [
  { key: 'release_date_desc', label: 'Data de Lançamento (Novos)' },
  { key: 'release_date_asc', label: 'Data de Lançamento (Antigos)' },
  { key: 'popular', label: 'Popularidade Geral' },
  { key: 'rating_general_desc', label: 'Nota Geral da Crítica (★)' },
  { key: 'my_rating_desc', label: 'Minha Avaliação (★)' },
  { key: 'title_asc', label: 'Ordem Alfabética (A-Z)' },
  { key: 'duration_desc', label: 'Duração (Mais longos)' },
  { key: 'duration_asc', label: 'Duração (Mais curtos)' },
];

const GENRE_TO_TMDB_ID: Record<string, number> = {
  'AÇÃO': 28,
  'AVENTURA': 12,
  'ANIMAÇÃO': 16,
  'SCI-FI': 878,
  'TERROR': 27,
  'DRAMA': 18,
  'ROMANCE': 10749,
  'SUSPENSE': 9648,
  'COMÉDIA': 35,
  'CRIME': 80,
  'WESTERN': 37,
  'MUSICAL': 10402,
};

export function MoviesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || 'all';

  const [activeStatus, setActiveStatus] = useState<string>(initialStatus);
  const [selectedGenre, setSelectedGenre] = useState('Todos os Gêneros');
  const [selectedDecade, setSelectedDecade] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [catalogMovies, setCatalogMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live movies on filter or page changes
  useEffect(() => {
    setIsLoading(true);
    const genreId = selectedGenre !== 'Todos os Gêneros' ? GENRE_TO_TMDB_ID[selectedGenre] : undefined;
    const year = selectedYear !== 'all' ? parseInt(selectedYear, 10) : undefined;

    if (activeStatus === 'now_playing') {
      movieService
        .getNowPlaying(currentPage)
        .then((data) => {
          if (data && data.length > 0) setCatalogMovies(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else if (activeStatus === 'upcoming' || activeStatus === 'pre_sale') {
      movieService
        .getUpcoming(currentPage)
        .then((data) => {
          if (data && data.length > 0) setCatalogMovies(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      movieService
        .discover(genreId, year, currentPage)
        .then((data) => {
          if (data && data.length > 0) setCatalogMovies(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [activeStatus, selectedGenre, selectedYear, selectedDecade, currentPage]);

  // Active decade object
  const activeDecadeObj = useMemo(() => {
    if (selectedDecade === 'all') return null;
    return DECADE_CONFIG.find((d) => d.key === selectedDecade) || null;
  }, [selectedDecade]);

  // Available years inside active decade
  const availableYears = useMemo(() => {
    if (!activeDecadeObj) return [];
    const years: number[] = [];
    for (let y = activeDecadeObj.startYear; y <= activeDecadeObj.endYear; y++) {
      years.push(y);
    }
    return years;
  }, [activeDecadeObj]);

  // When decade changes, reset year to 'all'
  const handleDecadeChange = (decadeKey: string) => {
    setSelectedDecade(decadeKey);
    setSelectedYear('all');
    setCurrentPage(1);
  };

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    return catalogMovies.filter((movie) => {
      // Genre filter (local safety)
      if (selectedGenre !== 'Todos os Gêneros') {
        if (!movie.genres.some((g) => g.toUpperCase().includes(selectedGenre.toUpperCase()))) return false;
      }

      // Specific Year vs Decade filter (local safety)
      if (selectedYear !== 'all') {
        if (movie.release_year !== parseInt(selectedYear, 10)) return false;
      } else if (activeDecadeObj !== null) {
        if (
          movie.release_year < activeDecadeObj.startYear ||
          movie.release_year > activeDecadeObj.endYear
        ) {
          return false;
        }
      }

      // Rating filter
      if (selectedRating !== 'all') {
        const minRating = parseFloat(selectedRating);
        if (selectedRating === '5.0') {
          if (movie.global_rating < 4.9) return false;
        } else {
          if (movie.global_rating < minRating) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'release_date_desc') {
        return b.release_year - a.release_year;
      }
      if (sortBy === 'release_date_asc') {
        return a.release_year - b.release_year;
      }
      if (sortBy === 'rating_general_desc') {
        return (b.global_rating || 0) - (a.global_rating || 0);
      }
      if (sortBy === 'my_rating_desc') {
        return (b.user_rating || 0) - (a.user_rating || 0);
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'duration_desc') {
        return b.runtime_minutes - a.runtime_minutes;
      }
      if (sortBy === 'duration_asc') {
        return a.runtime_minutes - b.runtime_minutes;
      }
      return b.popularity_score - a.popularity_score;
    });
  }, [activeStatus, selectedGenre, selectedYear, activeDecadeObj, selectedRating, sortBy]);

  // Movies to display for current page
  const paginatedMovies = filteredMovies;

  // Generate continuous page window
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    for (let i = start; i <= start + 4; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage]);

  const handleStatusChange = (statusKey: string) => {
    setActiveStatus(statusKey);
    setCurrentPage(1);
    if (statusKey === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', statusKey);
    }
    setSearchParams(searchParams);
  };

  // Scope title based on active filters
  const scopeTitle = useMemo(() => {
    if (selectedYear !== 'all') return `FILMES DE ${selectedYear}`;
    if (selectedDecade !== 'all') return `FILMES DOS ANOS ${selectedDecade}`;
    if (selectedGenre !== 'Todos os Gêneros') return `FILMES DE ${selectedGenre}`;
    if (activeStatus === 'now_playing') return 'EM CARTAZ';
    if (activeStatus === 'pre_sale') return 'PRÉ-VENDA';
    if (activeStatus === 'upcoming') return 'EM BREVE';
    if (activeStatus === 're_release') return 'REEXIBIÇÕES & CLÁSSICOS';
    return 'FILMES';
  }, [activeStatus, selectedGenre, selectedDecade, selectedYear]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-3">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Active Scope Title & Count */}
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-lg sm:text-xl font-black uppercase text-foreground tracking-tight">
                {scopeTitle}
              </h1>
              <span className="font-sans text-xs font-bold text-foreground/60">
                ({filteredMovies.length} {filteredMovies.length === 1 ? 'filme' : 'filmes'})
              </span>
            </div>

            {/* Right: Dropdowns matching Letterboxd bar */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 1. RATING SELECT */}
              <Select value={selectedRating} onValueChange={(val) => { setSelectedRating(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8.5 px-3 py-1 bg-background border-2 border-foreground/30 text-xs font-black uppercase text-foreground hover:border-primary">
                  <SelectValue placeholder="AVALIAÇÃO" />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 border-foreground/40 text-xs font-display">
                  {RATING_OPTIONS.map((r) => (
                    <SelectItem key={r.key} value={r.key} className="cursor-pointer font-bold">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 2. DECADE SELECT */}
              <Select value={selectedDecade} onValueChange={handleDecadeChange}>
                <SelectTrigger className="h-8.5 px-3 py-1 bg-background border-2 border-foreground/30 text-xs font-black uppercase text-foreground hover:border-primary">
                  <SelectValue placeholder="DÉCADA" />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 border-foreground/40 text-xs font-display">
                  {DECADE_CONFIG.map((d) => (
                    <SelectItem key={d.key} value={d.key} className="cursor-pointer font-bold">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 3. GENRE FILTER */}
              <Select value={selectedGenre} onValueChange={(val) => { setSelectedGenre(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8.5 px-3 py-1 bg-background border-2 border-foreground/30 text-xs font-black uppercase text-foreground hover:border-primary">
                  <SelectValue placeholder="GÊNERO" />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 border-foreground/40 text-xs font-display">
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g} className="cursor-pointer font-bold">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 4. STATUS FILTER */}
              <Select value={activeStatus} onValueChange={(val) => handleStatusChange(val)}>
                <SelectTrigger className="h-8.5 px-3 py-1 bg-background border-2 border-foreground/30 text-xs font-black uppercase text-foreground hover:border-primary">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 border-foreground/40 text-xs font-display">
                  {STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st.key} value={st.key} className="cursor-pointer font-bold">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 5. SORT BY SELECT */}
              <div className="flex items-center gap-1.5 pl-1">
                <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                  <SelectTrigger className="h-8.5 px-3 py-1 bg-background border-2 border-foreground/40 text-xs font-black text-foreground hover:border-primary shadow-sm">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-2 border-foreground/40 text-xs font-display">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="cursor-pointer font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

          </div>

          {/* ─── BOTTOM ROW: LETTERBOXD SEGMENTED YEAR STRIP ─── */}
          {activeDecadeObj && (
            <div className="pt-2 border-t border-foreground/15 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Reset to all decades chevron button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDecade('all');
                  setSelectedYear('all');
                  setCurrentPage(1);
                }}
                title="Voltar para todas as décadas"
                className="w-8 h-7.5 bg-background hover:bg-muted border border-foreground/30 text-foreground flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              {/* Contiguous Segmented Strip */}
              <div className="inline-flex border border-foreground/30 rounded-none overflow-hidden divide-x divide-foreground/30 shrink-0">
                {/* Decade Cell */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-black transition-colors cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground/80 hover:bg-muted'
                  }`}
                >
                  {activeDecadeObj.label}
                </button>

                {/* Individual Year Cells */}
                {availableYears.map((year) => {
                  const isYearSelected = selectedYear === year.toString();
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year.toString());
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 text-xs font-black transition-colors cursor-pointer ${
                        isYearSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground/80 hover:bg-muted'
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ─── 2. MOVIES POSTER GRID ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div
                key={`skel-${idx}`}
                className="aspect-[2/3] w-full bg-card border-2 border-foreground/30 shadow-[3px_3px_0px_0px_var(--border)] animate-pulse relative overflow-hidden flex flex-col justify-end p-3 space-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
                <div className="h-4 bg-foreground/20 w-3/4 rounded-none" />
                <div className="h-3 bg-foreground/10 w-1/2 rounded-none" />
              </div>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)]">
            <FilmStrip size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhum filme encontrado</h3>
            <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
              Nenhum filme corresponde aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Grid of Movie Cards with uniform height and overlay tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {paginatedMovies.map((movie) => (
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
                      : 'none'
                  }
                  eventLabel={
                    movie.is_pre_sale
                      ? 'PRÉ-VENDA'
                      : movie.status === 're_release'
                      ? 'REEXIBIÇÃO'
                      : undefined
                  }
                  releaseDate={movie.status === 'upcoming' ? movie.release_date_display : undefined}
                  isPreSale={movie.is_pre_sale}
                  linkTo={`/movies/${movie.id}`}
                />
              ))}
            </div>

            {/* ─── 3. NEO-BRUTALIST PAGINATION ─── */}
            <div className="pt-6 border-t-2 border-foreground/20 flex flex-wrap items-center justify-between gap-4">
              <span className="font-sans text-xs font-bold text-foreground/70">
                Página <strong>{currentPage}</strong> • Exibindo <strong>{filteredMovies.length}</strong> filmes por popularidade
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed border-2 border-foreground/40 text-foreground font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] flex items-center gap-1 cursor-pointer"
                >
                  <CaretLeft size={14} weight="bold" />
                  <span>Anterior</span>
                </button>

                {visiblePages.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-9 h-8 flex items-center justify-center border-2 text-xs font-black transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                        : 'bg-background text-foreground/80 border-foreground/30 hover:bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] flex items-center gap-1 cursor-pointer"
                >
                  <span>Próximo</span>
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
