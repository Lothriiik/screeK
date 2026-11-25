import React from 'react';

export interface CinemaTicketProps {
  id?: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  seats: string[];
  date: string;
  time: string;
  ticketType?: 'standard' | 'vip' | 'used' | 'cancelled';
  price?: number;
  ticketCategory?: string; // e.g. "2x Inteira - 2x Meia"
  audioFormat?: string; // e.g. "DUB", "LEG"
  screenFormat?: string; // e.g. "IMAX", "2D", "3D"
  code?: string;
  qrCodeUrl?: string;
  onQrClick?: () => void;
  snacks?: { name: string; quantity: number }[];
  actionButtons?: React.ReactNode;
  featured?: boolean;
  compact?: boolean;
  notice?: string;
}

export const CinemaTicket: React.FC<CinemaTicketProps> = ({
  cinemaName,
  movieTitle,
  roomName,
  seats,
  date,
  time,
  ticketType = 'standard',
  price = 109.0,
  ticketCategory = '2x Inteira - 2x Meia',
  audioFormat = 'DUB',
  screenFormat = 'IMAX',
  code = '#SKR-20260327-4891',
  qrCodeUrl,
  onQrClick,
  snacks,
  actionButtons,
  featured = false,
  compact = false,
  notice,
}) => {
  const isUsed = ticketType === 'used';
  const isCancelled = ticketType === 'cancelled';

  // Dynamic colors for the header block matching the 4 Figma tickets
  const headerBg = isCancelled
    ? 'bg-[#E8857C]'
    : isUsed
      ? 'bg-[#8D7B75]'
      : 'bg-[#1E2B45]';

  // Status Badge in the footer
  const statusBadge = isCancelled ? (
    <span className="border-2 border-[#E8857C] bg-[#E8857C]/10 text-[#E8857C] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
      CANCELADO
    </span>
  ) : isUsed ? (
    <span className="border-2 border-[#8D7B75] bg-[#8D7B75]/10 text-[#8D7B75] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
      UTILIZADO
    </span>
  ) : (
    <span className="border-2 border-[#34A853] bg-[#34A853]/10 text-[#34A853] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
      ATIVO
    </span>
  );

  const finalQrUrl =
    qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(code)}`;

  return (
    <div className={`w-full ${compact ? 'h-[430px] min-h-[430px] max-w-none sm:w-auto' : featured ? 'sm:grid sm:h-[280px] sm:max-w-none sm:grid-cols-[1fr_190px] sm:grid-rows-[auto_1fr]' : 'max-w-[340px] sm:w-[340px]'} ${compact ? '' : 'h-[450px]'} flex flex-col justify-between rounded-none ${compact ? 'border-2' : 'border-4'} border-foreground/40 bg-background font-display ${compact ? '' : 'shadow-[6px_6px_0px_0px_var(--border)]'} overflow-hidden text-foreground`}>
      
      {/* 1. Header Block (Top Colored Area) */}
      <div className={`${headerBg} ${compact ? 'min-h-[116px]' : ''} p-4 text-white space-y-1.5 border-b-2 border-foreground/30 shrink-0 ${featured ? 'sm:col-start-1 sm:row-start-1' : ''}`}>
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-widest opacity-75 truncate">
          {cinemaName}
        </span>
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-black uppercase tracking-tight leading-tight line-clamp-2`}>
          {movieTitle}
        </h3>

        {/* Badges Row with specific date and time */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="bg-[#FF5C80] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
            {date} • {time}
          </span>
          {audioFormat && (
            <span className="border border-white/40 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase">
              {audioFormat}
            </span>
          )}
          {screenFormat && (
            <span className="border border-white/40 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase">
              {screenFormat}
            </span>
          )}
        </div>
        </div>
        </div>
      </div>

      {/* 2. Middle Details (2x2 Grid + optional snacks) */}
      <div className={`${compact ? 'min-h-0 flex-1 p-4' : 'p-4 flex-1'} flex flex-col justify-start text-xs font-bold text-foreground/80 space-y-2 ${featured ? 'sm:col-start-1 sm:row-start-2' : ''}`}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-foreground/40 mb-0.5">SALA</span>
              <span className="font-extrabold text-foreground text-xs sm:text-sm">{roomName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-foreground/40 mb-0.5">ASSENTOS</span>
              <span className="font-extrabold text-foreground text-xs sm:text-sm">{seats.join(', ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-foreground/10">
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-foreground/40 mb-0.5">TIPO</span>
              <span className="font-extrabold text-foreground text-xs sm:text-sm truncate block">
                {ticketCategory}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-foreground/40 mb-0.5">TOTAL</span>
              <span className="font-black text-[#FF5C80] text-xs sm:text-sm">R$ {price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Snacks line if present */}
        {snacks && snacks.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-foreground/10 text-[11px] font-bold text-foreground/70 truncate">
            <span className="text-[10px] font-black uppercase text-foreground/50 mr-1">Bomboniere:</span>
            <span>{snacks.map((s) => `${s.quantity}x ${s.name}`).join(' • ')}</span>
          </div>
        )}
        {notice && <div className="mt-auto min-h-8 border-t border-foreground/10 pt-2 text-[10px] font-bold text-foreground/70">{notice}</div>}
      </div>

      {/* Dashed Separator Line */}
      {!compact && <div className={`border-b-2 border-dashed border-foreground/30 mx-4 shrink-0 ${featured ? 'sm:hidden' : ''}`} />}

      {/* 3. Footer Stub Section (QR Code & Status) */}
      <div className={`p-3 flex ${compact ? 'min-h-[128px] flex-col items-stretch justify-between' : 'items-center justify-between'} gap-3 shrink-0 bg-muted/10 ${compact ? '' : 'h-[92px]'} ${featured ? 'sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:h-full sm:flex-col sm:justify-center sm:border-l-2 sm:border-dashed sm:border-foreground/30' : ''}`}>
        <div className="flex items-center gap-3">
          {/* QR Code Container with High-Contrast White Background */}
          <button
            type="button"
            onClick={onQrClick}
            className={`${featured ? 'h-[68px] w-[68px] min-h-[68px] min-w-[68px] sm:h-[144px] sm:w-[144px] sm:min-h-[144px] sm:min-w-[144px]' : compact ? 'h-[62px] w-[62px] min-h-[62px] min-w-[62px]' : 'h-[68px] w-[68px] min-h-[68px] min-w-[68px]'} shrink-0 border-2 border-foreground/40 bg-white p-1 cursor-pointer overflow-hidden flex items-center justify-center ${compact ? '' : 'shadow-[2px_2px_0px_0px_var(--border)]'} hover:scale-105 active:scale-95 transition-transform`}
            title="Clique para ampliar o QR Code"
          >
            <img
              src={finalQrUrl}
              alt="QR Code de Entrada"
              className="w-full h-full object-contain pointer-events-none"
            />
          </button>

          <div className="flex flex-col items-start gap-1">
            {statusBadge}
            <span className="text-[10px] font-mono font-extrabold text-foreground/70 tracking-wider">
              {code}
            </span>
          </div>
        </div>

        {/* Custom Actions if provided */}
        {actionButtons && <div className={`flex items-center gap-1.5 ${compact ? 'justify-end' : ''}`}>{actionButtons}</div>}
      </div>

    </div>
  );
};
