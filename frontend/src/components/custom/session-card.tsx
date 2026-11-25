import React from 'react';

// ============================================================================
// 1. SessionChip (Quadrado de Sessão 19:00, Sala 4, 82% livres)
// ============================================================================
export interface SessionChipProps {
  time: string; // e.g. "19:00"
  roomName: string; // e.g. "Sala 4"
  audioFormat?: string; // e.g. "LEG", "DUB"
  screenFormat?: string; // e.g. "IMAX", "4DX", "VIP", "2D"
  state?: 'available' | 'selected' | 'disabled';
  compact?: boolean;
  inline?: boolean;
  onClick?: () => void;
}

export const SessionChip: React.FC<SessionChipProps> = ({
  time,
  roomName,
  audioFormat,
  screenFormat,
  state = 'available',
  compact = false,
  inline = false,
  onClick,
}) => {
  const isSelected = state === 'selected';
  const isDisabled = state === 'disabled';

  if (inline) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={`${time} · ${[audioFormat, screenFormat].filter(Boolean).join(' · ')}`}
        className={`inline-flex h-7 shrink-0 items-center gap-1.5 border-2 px-2 text-[10px] font-black transition-colors ${
          isDisabled
            ? 'cursor-not-allowed border-foreground/30 text-foreground/40'
            : isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-foreground/40 bg-background text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        <span>{time}</span>
        {screenFormat && <span className="font-bold opacity-70">{screenFormat}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`${compact ? 'h-[86px] w-[106px] p-2' : 'h-28 w-28 p-2.5'} flex shrink-0 flex-col items-center justify-between rounded-none border-4 text-center font-display transition-all cursor-pointer ${
        isDisabled
          ? 'opacity-40 border-foreground/30 bg-background/50 cursor-not-allowed text-foreground/50'
          : isSelected
          ? `border-primary bg-primary text-primary-foreground ${compact ? '' : 'shadow-[4px_4px_0px_0px_var(--border)] scale-[1.02]'}`
          : `border-primary bg-background text-foreground hover:bg-primary/5 ${compact ? '' : 'shadow-[4px_4px_0px_0px_var(--border)] hover:-translate-y-1'}`
      }`}
    >
      {/* Time Text */}
      <span
        className={`${compact ? 'text-xl' : 'text-2xl'} font-black tracking-tight ${
          isSelected ? 'text-primary-foreground' : isDisabled ? 'text-foreground/50' : 'text-primary'
        }`}
      >
        {time}
      </span>

      {/* Room Name */}
      <span
        className={`${compact ? 'text-[10px]' : 'text-xs'} max-w-full truncate font-bold ${
          isSelected ? 'text-primary-foreground/90' : 'text-foreground/70'
        }`}
      >
        {roomName}
      </span>

      {/* Clean text line for Audio · Format */}
      <span
        className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-black uppercase tracking-wider ${
          isSelected ? 'text-primary-foreground/90' : 'text-primary'
        }`}
      >
        {[audioFormat, screenFormat].filter(Boolean).join(' · ')}
      </span>
    </button>
  );
};

// ============================================================================
// 2. SessionCard (Card Horizontal Retangular de Sessão com Badges)
// ============================================================================
export interface SessionCardProps {
  time: string; // e.g. "19:00"
  cinemaName: string; // e.g. "Cinesystem Arapiraca"
  roomName: string; // e.g. "Sala 4 - IMAX"
  freeSeatsPercentage?: number; // e.g. 82
  audioFormat?: string; // e.g. "DUB"
  screenFormat?: string; // e.g. "IMAX"
  dateLabel?: string; // e.g. "SEX 27/03"
  highlightBorder?: boolean;
  onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  time,
  cinemaName,
  roomName,
  freeSeatsPercentage = 82,
  audioFormat = 'DUB',
  screenFormat = 'IMAX',
  dateLabel = 'SEX 27/03',
  highlightBorder = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full rounded-none border-4 bg-background font-display p-4 sm:p-5 flex items-center justify-between shadow-[4px_4px_0px_0px_var(--border)] transition-all cursor-pointer ${
        highlightBorder
          ? 'border-[#6A1B4D]'
          : 'border-foreground/30 hover:border-[#6A1B4D]'
      }`}
    >
      {/* Left Column: Big Time + Info */}
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="text-2xl sm:text-3xl font-black text-[#6A1B4D] tracking-tight shrink-0">
          {time}
        </span>

        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-black uppercase text-foreground leading-none">
            {cinemaName}
          </h4>
          <p className="text-xs font-bold text-foreground/60">{roomName}</p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {audioFormat && (
              <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                {audioFormat}
              </span>
            )}
            {screenFormat && (
              <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                {screenFormat}
              </span>
            )}
            {dateLabel && (
              <span className="border border-foreground/40 text-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase">
                {dateLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Occupancy Progress Bar & Text */}
      <div className="flex flex-col items-end shrink-0 pl-2">
        <div className="w-24 sm:w-32 h-2 bg-foreground/20 rounded-none overflow-hidden">
          <div
            className="h-full bg-[#6A1B4D]"
            style={{ width: `${freeSeatsPercentage}%` }}
          />
        </div>
        <span className="text-xs font-extrabold text-[#6A1B4D] mt-1">
          {freeSeatsPercentage}% livres
        </span>
      </div>
    </div>
  );
};
