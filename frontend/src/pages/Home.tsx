import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { HeroCarousel, type CarouselSlide } from '../components/custom/hero-carousel';
import { MovieCard, type MovieCardProps } from '../components/custom/movie-card';
import { MOCK_MOVIES } from '../mocks';

// Hero Carousel Slides derived from Central Mock Store
const MOCK_HERO_SLIDES: CarouselSlide[] = MOCK_MOVIES.slice(0, 3).map((m) => ({
  id: m.id,
  title: m.title,
  badge: m.status === 're_release' ? 'REEXIBIÇÃO' : 'ESTREIA',
  logoUrl: m.logo_url,
  backdropUrl: m.backdrop_url,
  category: `Cinema - ${m.duration_display} - ${m.genres.join(' ')}`,
  ageRating: m.age_rating,
  directors: m.directors,
  synopsis: m.overview,
  ticketLink: `/movies/${m.id}/sessions`,
}));

// Movie sections mapped from Central Mock Store
const MOCK_NOW_PLAYING: MovieCardProps[] = MOCK_MOVIES.filter(
  (m) => m.status === 'now_playing'
).map((m) => ({
  id: m.id,
  title: m.title,
  posterUrl: m.poster_url,
  rating: m.global_rating,
  duration: m.duration_display,
  genre: m.genres[0] || 'DRAMA',
  ageRating: m.age_rating,
  tagType: 'release',
  eventLabel: 'ESTREIA',
  linkTo: `/movies/${m.id}/sessions`,
}));

const MOCK_RE_RELEASES: MovieCardProps[] = MOCK_MOVIES.filter(
  (m) => m.status === 're_release'
).map((m) => ({
  id: m.id,
  title: m.title,
  posterUrl: m.poster_url,
  rating: m.global_rating,
  duration: m.duration_display,
  genre: m.genres[0] || 'DRAMA',
  ageRating: m.age_rating,
  tagType: 're_release',
  eventLabel: 'REEXIBIÇÃO',
  linkTo: `/movies/${m.id}/sessions`,
}));

const MOCK_UPCOMING: MovieCardProps[] = MOCK_MOVIES.filter(
  (m) => m.status === 'upcoming' || m.is_pre_sale
).map((m) => ({
  id: m.id,
  title: m.title,
  posterUrl: m.poster_url,
  rating: m.global_rating,
  duration: m.duration_display,
  genre: m.genres[0] || 'DRAMA',
  ageRating: m.age_rating,
  tagType: m.is_pre_sale ? 'pre_sale' : m.status === 're_release' ? 're_release' : 'none',
  eventLabel: m.is_pre_sale ? 'PRÉ-VENDA' : m.status === 're_release' ? 'REEXIBIÇÃO' : undefined,
  releaseDate: m.release_date_display,
  isPreSale: m.is_pre_sale,
  linkTo: `/movies/${m.id}/sessions`,
}));

interface MovieSectionProps {
  title: string;
  linkTo: string;
  movies: MovieCardProps[];
}

const MovieSection: React.FC<MovieSectionProps> = ({ title, linkTo, movies }) => {
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

  return (
    <section className="relative w-full space-y-4 font-display">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary">
            {title}
          </h2>
          <Link
            to={linkTo}
            className="text-xs sm:text-sm font-black uppercase text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Todos</span>
            <CaretRight size={12} weight="bold" className="self-center" />
          </Link>
        </div>

        {/* Top Right Fixed Navigation Arrows */}
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

      <div className="relative">
        <div
          ref={containerRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
        >
          {movies.map((movie) => (
            <div key={movie.id} className="w-[165px] sm:w-[190px] shrink-0">
              <MovieCard {...movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import { MOCK_PEOPLE } from '../mocks/people';
import { PersonCard } from '../components/custom/person-card';
import { CommunitySection } from '../components/custom/community-section';

export const Home: React.FC = () => {
  const [personFilter, setPersonFilter] = React.useState<'all' | 'directors' | 'actors'>('all');
  const peopleContainerRef = useRef<HTMLDivElement>(null);

  const filteredPeople = React.useMemo(() => {
    if (personFilter === 'directors') {
      return MOCK_PEOPLE.filter((p) => p.role_display.toLowerCase().includes('diret'));
    }
    if (personFilter === 'actors') {
      return MOCK_PEOPLE.filter((p) => p.role_display.toLowerCase().includes('at'));
    }
    return MOCK_PEOPLE;
  }, [personFilter]);

  const scrollPeople = (direction: 'left' | 'right') => {
    if (peopleContainerRef.current) {
      const scrollAmount = 500;
      peopleContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full py-6 space-y-12">
      <div className="w-full overflow-hidden">
        <HeroCarousel slides={MOCK_HERO_SLIDES} />
      </div>

      <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 space-y-12">
        <MovieSection
          title="Em Cartaz"
          linkTo="/movies?status=now_playing"
          movies={MOCK_NOW_PLAYING}
        />

        <MovieSection
          title="Reexibições"
          linkTo="/movies?status=re_release"
          movies={MOCK_RE_RELEASES}
        />

        <MovieSection
          title="Em Breve"
          linkTo="/movies?status=upcoming"
          movies={MOCK_UPCOMING}
        />

        {/* SEÇÃO: EXPLORE POR DIRETORES & ATORES (mesmo padrão visual de Em Cartaz) */}
        <section className="relative w-full space-y-4 font-display">
          <div className="flex flex-wrap items-center justify-between pb-2 gap-3">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-primary">
                Explore por Diretores &amp; Atores
              </h2>
              <Link
                to="/search"
                className="text-xs sm:text-sm font-black uppercase text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todos</span>
                <CaretRight size={12} weight="bold" className="self-center" />
              </Link>
            </div>

            {/* Controls: Tabs + Navigation Arrows */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPersonFilter('all')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                    personFilter === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/70 border-foreground/30 hover:border-primary hover:text-primary'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setPersonFilter('directors')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                    personFilter === 'directors'
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/70 border-foreground/30 hover:border-primary hover:text-primary'
                  }`}
                >
                  Diretores
                </button>
                <button
                  type="button"
                  onClick={() => setPersonFilter('actors')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                    personFilter === 'actors'
                      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-background text-foreground/70 border-foreground/30 hover:border-primary hover:text-primary'
                  }`}
                >
                  Atores
                </button>
              </div>

              {/* Arrow navigation buttons (identical to MovieSection) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollPeople('left')}
                  className="w-7 h-7 sm:w-10 sm:h-10 bg-foreground/80 hover:bg-primary text-background border-2 border-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                  aria-label="Anterior"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPeople('right')}
                  className="w-7 h-7 sm:w-10 sm:h-10 bg-foreground/80 hover:bg-primary text-background border-2 border-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                  aria-label="Próximo"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              ref={peopleContainerRef}
              className="flex items-stretch gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
            >
              {filteredPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO DA COMUNIDADE SCREEK */}
        <CommunitySection />
      </div>
    </div>
  );
};
