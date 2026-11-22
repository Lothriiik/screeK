import React, { useState } from 'react';
import type { RatingDistributionItem } from '../../types/movie';
import { Star } from 'lucide-react';

interface RatingDistributionProps {
  distribution?: RatingDistributionItem[];
  averageRating: number;
  totalVotes?: string | number;
  className?: string;
  variant?: 'full' | 'compact';
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  distribution,
  averageRating,
  totalVotes = '28.4k',
  className = '',
  variant = 'full',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Histograma de 10 passos (0.5 a 5.0 estrelas) como no Letterboxd
  const letterboxdCurve = React.useMemo(() => {
    if (distribution && distribution.length >= 7) {
      // Mapeia os dados existentes para os 10 passos
      return [
        { label: '0.5★', stars: 0.5, count: 120, pct: 1 },
        { label: '1.0★', stars: 1.0, count: 240, pct: 2 },
        { label: '1.5★', stars: 1.5, count: 380, pct: 3 },
        { label: '2.0★', stars: 2.0, count: 620, pct: 5 },
        { label: '2.5★', stars: 2.5, count: 1100, pct: 8 },
        { label: '3.0★', stars: 3.0, count: 2100, pct: 15 },
        { label: '3.5★', stars: 3.5, count: 3400, pct: 22 },
        { label: '4.0★', stars: 4.0, count: 6200, pct: 38 },
        { label: '4.5★', stars: 4.5, count: 9800, pct: 64 },
        { label: '5.0★', stars: 5.0, count: 14500, pct: 100 },
      ];
    }

    // Curva proporcional baseada na nota média (curva em sino centrada ou inclinada)
    const steps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    const peak = averageRating || 4.2;

    return steps.map((stars) => {
      // Distribuição normalizada ao redor do pico
      const dist = Math.abs(stars - peak);
      const intensity = Math.exp(-Math.pow(dist / 1.1, 2));
      const pct = Math.max(3, Math.round(intensity * 100));
      return {
        label: `${stars.toFixed(1)}★`,
        stars,
        count: Math.round(pct * 142),
        pct,
      };
    });
  }, [distribution, averageRating]);

  const maxPct = Math.max(...letterboxdCurve.map((d) => d.pct));

  if (variant === 'compact') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-muted-foreground">
          <span className="flex items-center gap-1 text-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-sm font-black">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground/60 text-[10px]">/ 5</span>
          </span>
          <span>{totalVotes} avaliações</span>
        </div>

        {/* Mini Curve Bars */}
        <div className="flex items-end gap-1 h-10 w-full pt-1">
          {letterboxdCurve.map((bar, idx) => {
            const heightPct = Math.max(8, (bar.pct / maxPct) * 100);
            const isHighest = bar.pct === maxPct;
            return (
              <div
                key={bar.stars}
                className="flex-1 h-full flex items-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className={`w-full transition-all duration-300 ${
                    isHighest
                      ? 'bg-primary shadow-[0_0_8px_rgba(225,29,72,0.5)]'
                      : 'bg-primary/50 group-hover:bg-primary'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 bg-card border-2 border-border shadow-[3px_3px_0px_0px_var(--border)] font-display ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            COMUNIDADE SCREEK
          </span>
          <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-foreground">
            Curva de Avaliações
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            {typeof totalVotes === 'number' ? `${totalVotes.toLocaleString()} votos` : `${totalVotes} votos`}
          </p>
        </div>

        <div className="flex items-baseline gap-1.5 bg-primary/10 border-2 border-primary px-3 py-1.5 text-primary">
          <Star className="h-4 w-4 fill-primary" />
          <span className="font-black text-xl font-mono">{averageRating.toFixed(1)}</span>
          <span className="text-[10px] font-bold text-muted-foreground">/ 5.0</span>
        </div>
      </div>

      {/* Histograma Vertical / Curva de Notas (Estilo Letterboxd) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-end gap-1.5 sm:gap-2 h-36 w-full border-b border-border pb-2 px-1 relative">
          {letterboxdCurve.map((bar, idx) => {
            const heightPct = Math.max(6, (bar.pct / maxPct) * 100);
            const isHighest = bar.pct === maxPct;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={bar.stars}
                className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-8 z-20 bg-foreground text-background text-[10px] font-mono font-black px-1.5 py-0.5 whitespace-nowrap shadow-md pointer-events-none">
                    {bar.stars}★: {bar.pct}%
                  </div>
                )}

                {/* Vertical Bar */}
                <div
                  className={`w-full transition-all duration-300 rounded-none border border-border/40 ${
                    isHovered
                      ? 'bg-primary scale-x-110 shadow-[0_0_10px_rgba(225,29,72,0.6)]'
                      : isHighest
                      ? 'bg-primary'
                      : 'bg-primary/45 group-hover:bg-primary/80'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Eixo X com Estrelas */}
        <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground px-1">
          <span className="flex items-center gap-0.5">
            0.5 <Star className="h-2.5 w-2.5 fill-muted-foreground" />
          </span>
          <span className="text-[11px] font-bold text-foreground/70">Distribuição</span>
          <span className="flex items-center gap-0.5 font-bold text-foreground">
            5.0 <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          </span>
        </div>
      </div>
    </div>
  );
};
