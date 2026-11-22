import React, { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export interface CarouselSlide {
  id: string;
  title: string;
  badge?: string; // e.g. "ESTREIA"
  logoUrl?: string; // e.g. Speed Racer logo PNG
  backdropUrl: string;
  category: string; // e.g. "Cinema - 2h56 - Ação Aventura"
  ageRating?: 'L' | '10' | '12' | '14' | '16' | '18';
  directors: string[]; // e.g. ["Lana Wachowski", "Lilly Wachowski"]
  synopsis: string;
  ticketLink?: string;
}

export interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!slides || slides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const currentSlide = slides[currentIndex];
  const prevSlide = slides[currentIndex === 0 ? slides.length - 1 : currentIndex - 1];
  const nextSlide = slides[currentIndex === slides.length - 1 ? 0 : currentIndex + 1];

  const getAgeRatingBg = (rating?: string) => {
    if (rating === 'L') return 'bg-[#16A34A]';
    if (rating === '18') return 'bg-[#DC2626]';
    if (rating === '16') return 'bg-[#DBA212]';
    if (rating === '14') return 'bg-[#D4A338]';
    return 'bg-[#205BC2]';
  };

  return (
    <div className="w-full font-display space-y-3 sm:space-y-4 select-none">
      {/* 1. Full-Width Stage Container (Screen edge to screen edge) */}
      <div className="relative flex items-center justify-between w-full overflow-hidden py-1 sm:py-2 px-0 gap-1.5 sm:gap-4">
        
        {/* Left Side Peeking Card */}
        <div
          onClick={handlePrev}
          className="w-[8%] sm:w-[12%] lg:w-[10%] h-[330px] sm:h-[400px] lg:h-[460px] shrink-0 opacity-40 hover:opacity-75 transition-opacity cursor-pointer border-4 border-l-0 border-foreground relative overflow-hidden -ml-2 shadow-[4px_4px_0px_0px_var(--border)]"
        >
          <img
            src={prevSlide.backdropUrl}
            alt={prevSlide.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-8 h-8 sm:w-11 sm:h-11 aspect-square bg-foreground/80 border-2 border-foreground text-background flex items-center justify-center hover:bg-primary cursor-pointer transition-all shadow-[2px_2px_0px_0px_var(--border)]"
              aria-label="Anterior"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Center Main Active Card (Vertical Stack on Mobile | Horizontal 38/62 Split on Desktop) */}
        <div className="w-[82%] md:w-[60%] lg:w-[65%] h-[330px] sm:h-[400px] lg:h-[480px] shrink-0 border-4 border-foreground bg-background shadow-[6px_6px_0px_0px_var(--border)] sm:shadow-[8px_8px_0px_0px_var(--border)] relative overflow-hidden flex flex-col sm:flex-row mx-auto">
          
          {/* Top Image (Mobile) / Full Backdrop (Desktop) */}
          <div className="relative w-full sm:absolute sm:inset-0 h-[180px] sm:h-full overflow-hidden">
            <img
              src={currentSlide.backdropUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Bottom Info Box (Mobile) / Left Info Box (Desktop) */}
          <div className="relative z-10 w-full sm:w-[42%] lg:w-[38%] h-[150px] sm:h-full bg-foreground/85 sm:bg-foreground/75 backdrop-blur-xs border-t-4 sm:border-t-0 sm:border-r-4 border-foreground/40 p-3 sm:p-6 lg:p-7 flex flex-col justify-between items-center sm:items-start text-center sm:text-left text-white">
            
            {/* Top Badge (Desktop only) */}
            <div className="hidden sm:block">
              <span className="inline-block border-2 border-[#FF5C80] text-[#FF5C80] px-3 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-black/60">
                {currentSlide.badge || 'ESTREIA'}
              </span>
            </div>

            {/* Middle Section (Logo + Details + Synopsis) */}
            <div className="my-auto space-y-1.5 sm:space-y-4 w-full flex flex-col items-center sm:items-start">
              {currentSlide.logoUrl ? (
                <div className="flex items-center justify-center sm:justify-start">
                  <img
                    src={currentSlide.logoUrl}
                    alt={currentSlide.title}
                    className="max-h-11 sm:max-h-24 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                  />
                </div>
              ) : (
                <h2 className="text-base sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">
                  {currentSlide.title}
                </h2>
              )}

              {/* Meta Category & Age Rating */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-white/90">
                <span>{currentSlide.category}</span>
                {currentSlide.ageRating && (
                  <span
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white ${getAgeRatingBg(
                      currentSlide.ageRating
                    )}`}
                  >
                    {currentSlide.ageRating}
                  </span>
                )}
              </div>

              {/* Directors (Desktop only) */}
              {currentSlide.directors && currentSlide.directors.length > 0 && (
                <p className="hidden sm:block text-[11px] sm:text-xs font-bold text-white/80">
                  Dir.{' '}
                  {currentSlide.directors.map((d, i) => (
                    <span key={i} className="text-[#FF5C80] underline font-black cursor-pointer hover:text-white">
                      {d}{i < currentSlide.directors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}

              {/* Synopsis (Desktop only) */}
              <p className="hidden sm:block text-[11px] sm:text-xs text-white/70 line-clamp-3 leading-relaxed">
                {currentSlide.synopsis}
              </p>
            </div>

            {/* Bottom CTA Button */}
            <div className="w-full pt-1 sm:pt-2 flex justify-center sm:justify-start">
              <button className="bg-[#7E2553] hover:bg-[#983067] text-[#E9D8C8] px-5 sm:px-6 py-1.5 sm:py-2.5 font-display font-black uppercase text-[11px] sm:text-sm tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] sm:shadow-[3px_3px_0px_0px_var(--border)] transition-all">
                INGRESSOS
              </button>
            </div>

          </div>

          {/* Right Area (Desktop only) */}
          <div className="hidden sm:block w-[58%] lg:w-[62%] h-full pointer-events-none" />

        </div>

        {/* Right Side Peeking Card */}
        <div
          onClick={handleNext}
          className="w-[8%] sm:w-[12%] lg:w-[10%] h-[330px] sm:h-[400px] lg:h-[460px] shrink-0 opacity-40 hover:opacity-75 transition-opacity cursor-pointer border-4 border-r-0 border-foreground relative overflow-hidden -mr-2 shadow-[4px_4px_0px_0px_var(--border)]"
        >
          <img
            src={nextSlide.backdropUrl}
            alt={nextSlide.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-8 h-8 sm:w-11 sm:h-11 aspect-square bg-foreground/80 border-2 border-foreground text-background flex items-center justify-center hover:bg-primary cursor-pointer transition-all shadow-[2px_2px_0px_0px_var(--border)]"
              aria-label="Próximo"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. Bottom Indicator Bars (Figma Indicators) */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all cursor-pointer ${
                isActive
                  ? 'w-10 sm:w-12 h-3.5 bg-[#7E2553] border-2 border-[#7E2553]'
                  : 'w-3.5 h-3.5 bg-transparent border-2 border-foreground hover:border-primary'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};
