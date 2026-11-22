import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  ShareNetwork,
  FilmStrip,
  Sparkle,
  User,
  CalendarBlank,
  MapPin,
  Eye
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MovieCard } from '../components/custom/movie-card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui/select';
import { getPersonById, MOCK_PEOPLE, MOCK_MOVIES } from '../mocks';
import { movieService } from '../services/movieService';
import type { PersonWithRole } from '../mocks/people';

const GENRES = [
  'Todos os Gêneros',
  'AÇÃO',
  'SCI-FI',
  'DRAMA',
  'TERROR',
  'ANIMAÇÃO',
  'SUSPENSE',
  'ROMANCE',
  'COMÉDIA',
  'FAMÍLIA',
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Mais Populares' },
  { value: 'rating', label: 'Melhor Avaliados' },
  { value: 'year_desc', label: 'Mais Recentes' },
  { value: 'year_asc', label: 'Mais Antigos' },
];

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [person, setPerson] = useState<PersonWithRole>(
    (id ? getPersonById(id) : undefined) || MOCK_PEOPLE[2]
  );
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (id) {
      movieService.getPersonDetails(id).then((p) => {
        if (p) {
          setPerson((prev) => ({
            ...prev,
            id: p.id,
            name: p.name,
            profile_url: p.profile_url || prev.profile_url,
            biography: p.biography || prev.biography,
            birth_place: p.place_of_birth || prev.birth_place,
            birth_date: p.birthday || prev.birth_date,
            role_display: p.known_for_department || prev.role_display,
          }));
        }
      });
    }
  }, [id]);

  // Filters
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DIRECTOR' | 'WRITER' | 'ACTOR'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState('Todos os Gêneros');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'now_playing' | 're_release' | 'upcoming'>('ALL');

  // Base list of all movies by this person
  const allPersonMovies = useMemo(() => {
    return MOCK_MOVIES.filter((m) => {
      const isDirector = m.directors.some((d) => d.toLowerCase().includes(person.name.toLowerCase()));
      const isWriter = m.writers && m.writers.some((w) => w.toLowerCase().includes(person.name.toLowerCase()));
      const isActor = m.credits && m.credits.some((c) => c.person.name.toLowerCase().includes(person.name.toLowerCase()));
      const isListed = person.movie_ids.includes(m.id);
      return isDirector || isWriter || isActor || isListed;
    });
  }, [person]);

  // Watched stats (e.g. movies with user_rating or watched status)
  const watchedMovies = allPersonMovies.filter((m) => m.user_rating !== undefined || m.id === 'speed-racer');
  const watchedPercentage = allPersonMovies.length > 0 
    ? Math.round((watchedMovies.length / allPersonMovies.length) * 100)
    : 0;

  // Filtered & Sorted filmography
  const filteredMovies = useMemo(() => {
    let list = allPersonMovies.filter((m) => {
      // 1. Role Filter
      if (roleFilter === 'DIRECTOR') {
        const isDir = m.directors.some((d) => d.toLowerCase().includes(person.name.toLowerCase()));
        if (!isDir) return false;
      } else if (roleFilter === 'WRITER') {
        const isWri = m.writers && m.writers.some((w) => w.toLowerCase().includes(person.name.toLowerCase()));
        if (!isWri) return false;
      } else if (roleFilter === 'ACTOR') {
        const isAct = m.credits && m.credits.some((c) => c.person.name.toLowerCase().includes(person.name.toLowerCase()));
        if (!isAct) return false;
      }

      // 2. Genre Filter
      if (selectedGenre !== 'Todos os Gêneros') {
        if (!m.genres.some((g) => g.toUpperCase() === selectedGenre.toUpperCase())) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL' && m.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (selectedSort === 'rating') {
        return (b.global_rating || 0) - (a.global_rating || 0);
      }
      if (selectedSort === 'year_desc') {
        return (b.release_year || 0) - (a.release_year || 0);
      }
      if (selectedSort === 'year_asc') {
        return (a.release_year || 0) - (b.release_year || 0);
      }
      return (b.popularity_score || 0) - (a.popularity_score || 0);
    });

    return list;
  }, [allPersonMovies, roleFilter, selectedGenre, selectedSort, statusFilter, person]);

  // Other related people in catalog
  const otherPeople = MOCK_PEOPLE.filter((p) => p.id !== person.id).slice(0, 4);

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      toast.success(next ? `Você começou a seguir ${person.name}!` : `Você deixou de seguir ${person.name}`);
      return next;
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do perfil copiado para a área de transferência!');
    }
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. PERSON HERO BANNER (POSTER STYLE) ─── */}
      <section className="bg-tertiary border-b-4 border-foreground/40 text-white relative overflow-hidden">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-6">
          
          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border-2 border-foreground/40 text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar</span>
          </button>

          {/* Profile Main Row */}
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            
            {/* Poster-Style Photo */}
            <div className="w-36 sm:w-48 aspect-[2/3] border-4 border-foreground shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden shrink-0 bg-background">
              <img
                src={person.profile_url}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info, Stats & Progress */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-secondary text-secondary-foreground text-xs font-black uppercase px-2.5 py-0.5 shadow-[1px_1px_0px_0px_var(--border)]">
                  {person.role_display}
                </span>
                <span className="bg-primary text-primary-foreground text-xs font-black uppercase px-2 py-0.5">
                  {allPersonMovies.length} {allPersonMovies.length === 1 ? 'filme no acervo' : 'filmes no acervo'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                {person.name}
              </h1>

              {/* Vital Details */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-sans text-white/80">
                {person.birth_date && (
                  <div className="flex items-center gap-1.5">
                    <CalendarBlank size={15} weight="bold" className="text-secondary shrink-0" />
                    <span>{person.birth_date}</span>
                  </div>
                )}
                {person.birth_place && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} weight="bold" className="text-secondary shrink-0" />
                    <span>{person.birth_place}</span>
                  </div>
                )}
              </div>

              {/* Watched Percentage Progress Box (Letterboxd Style) */}
              <div className="p-3 bg-foreground/20 border-2 border-white/20 max-w-md space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 text-white">
                    <Eye size={16} weight="bold" className="text-secondary" />
                    <span>Você assistiu</span>
                  </div>
                  <span className="text-secondary font-mono text-sm font-black">
                    {watchedPercentage}% ({watchedMovies.length} de {allPersonMovies.length})
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-black/40 border border-white/30 overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${watchedPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 ${
                    isFollowing
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-foreground/40 hover:bg-muted'
                  }`}
                >
                  <Heart size={16} weight={isFollowing ? 'fill' : 'regular'} />
                  <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartilhar Perfil"
                  className="w-9 h-9 bg-background text-foreground hover:bg-muted border-2 border-foreground/40 flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                >
                  <ShareNetwork size={16} weight="bold" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ─── 2. BIOGRAPHY ─── */}
      <section className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 pt-8 space-y-3">
        <div className="flex items-center gap-2 pb-2">
          <User size={22} weight="bold" className="text-primary" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            Biografia &amp; Trajetória
          </h2>
        </div>
        <p className="font-sans text-sm sm:text-base text-foreground/80 leading-relaxed max-w-4xl">
          {person.biography}
        </p>
      </section>

      {/* ─── 3. FILMOGRAPHY WITH ROLE TABS & FILTERS (LIKE /movies) ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-2">
            <FilmStrip size={22} weight="bold" className="text-primary" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Filmografia no screeK
            </h2>
          </div>

          <span className="text-xs font-bold text-foreground/60 font-sans">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'título exibido' : 'títulos exibidos'}
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-4 p-4 bg-background border-2 border-foreground/30 shadow-[4px_4px_0px_0px_var(--border)]">
          
          {/* Top Row: Role Tabs (Todos, Direção, Roteiro, Atuação) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-foreground/60 mr-1">
                Papel:
              </span>
              {[
                { key: 'ALL', label: 'Todos os Papéis' },
                { key: 'DIRECTOR', label: 'Direção' },
                { key: 'WRITER', label: 'Roteiro' },
                { key: 'ACTOR', label: 'Atuação' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key as any)}
                  className={`px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                    roleFilter === tab.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/70 border-foreground/30 hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'now_playing', label: 'Em Cartaz' },
                { key: 're_release', label: 'Reexibições' },
                { key: 'upcoming', label: 'Em Breve' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key as any)}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all cursor-pointer border-2 ${
                    statusFilter === st.key
                      ? 'bg-foreground text-background border-foreground shadow-[1px_1px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/60 border-foreground/20 hover:bg-muted'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

          </div>

          {/* Bottom Row: Genre & Sort Selects (Same component as in /movies) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-foreground/10">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Genre Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-foreground/60">Gênero:</span>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold uppercase">
                    <SelectValue>{selectedGenre}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-foreground/60">Ordenar:</span>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold uppercase">
                    <SelectValue>
                      {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Filters Shortcut */}
            {(roleFilter !== 'ALL' || selectedGenre !== 'Todos os Gêneros' || statusFilter !== 'ALL' || selectedSort !== 'popular') && (
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('ALL');
                  setSelectedGenre('Todos os Gêneros');
                  setStatusFilter('ALL');
                  setSelectedSort('popular');
                }}
                className="text-xs font-black uppercase text-primary hover:underline cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}

          </div>

        </div>

        {/* Movies Grid */}
        {filteredMovies.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-md mx-auto">
            <FilmStrip size={40} className="text-foreground/40 mx-auto" />
            <h3 className="text-lg font-black uppercase text-foreground">Nenhum filme encontrado</h3>
            <p className="font-sans text-xs text-foreground/70">
              Nenhum filme corresponde aos filtros de papel, gênero ou status selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
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
                    : movie.status === 'now_playing'
                    ? 'release'
                    : 'none'
                }
                eventLabel={
                  movie.is_pre_sale
                    ? 'PRÉ-VENDA'
                    : movie.status === 're_release'
                    ? 'REEXIBIÇÃO'
                    : movie.status === 'now_playing'
                    ? 'ESTREIA'
                    : undefined
                }
                releaseDate={movie.status === 'upcoming' ? movie.release_date_display : undefined}
                isPreSale={movie.is_pre_sale}
                linkTo={`/movies/${movie.id}`}
              />
            ))}
          </div>
        )}

        {/* Other People / Frequent Collaborators */}
        <section className="space-y-4 pt-8 border-t-2 border-foreground/20">
          <div className="flex items-center gap-2">
            <Sparkle size={20} weight="fill" className="text-secondary" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Outros Cineastas &amp; Elenco
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherPeople.map((other) => (
              <Link
                key={other.id}
                to={`/people/${other.id}`}
                className="bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] p-3 flex gap-3 items-center hover:-translate-y-0.5 hover:border-primary transition-all group"
              >
                <div className="w-12 aspect-[2/3] object-cover border-2 border-foreground/40 shrink-0 overflow-hidden bg-muted">
                  <img
                    src={other.profile_url}
                    alt={other.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase text-primary block truncate">
                    {other.role_display}
                  </span>
                  <h3 className="text-xs font-black uppercase text-foreground truncate group-hover:text-primary transition-colors">
                    {other.name}
                  </h3>
                  <span className="text-[10px] text-foreground/50 font-sans block truncate">
                    {other.known_for}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
