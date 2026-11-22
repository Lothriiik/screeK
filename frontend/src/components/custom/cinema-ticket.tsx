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
}) => {
  const isVip = ticketType === 'vip';
  const isUsed = ticketType === 'used';
  const isCancelled = ticketType === 'cancelled';

  // Dynamic colors for the header block matching the 4 Figma tickets
  const headerBg = isCancelled
    ? 'bg-[#E8857C]' // Light Coral / Salmon Red
    : isUsed
    ? 'bg-[#8D7B75]' // Taupe / Warm Grey
    : isVip
    ? 'bg-[#6A1B4D]' // Dark Wine
    : 'bg-[#1E2B45]'; // Dark Navy (Standard)

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
    <div className="w-full max-w-[340px] sm:w-[340px] h-[450px] flex flex-col justify-between rounded-none border-4 border-foreground/40 bg-background font-display shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden text-foreground">
      
      {/* 1. Header Block (Top Colored Area) */}
      <div className={`${headerBg} p-4 text-white space-y-1.5 border-b-4 border-foreground/40 shrink-0`}>
        <span className="block text-[10px] font-extrabold uppercase tracking-widest opacity-75 truncate">
          {cinemaName}
        </span>
        <h3 className="text-xl font-black uppercase tracking-tight leading-tight line-clamp-1">
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

      {/* 2. Middle Details (2x2 Grid + optional snacks) */}
      <div className="p-4 flex-1 flex flex-col justify-between text-xs font-bold text-foreground/80 space-y-2">
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
          <div className="pt-1.5 border-t border-foreground/10 text-[11px] font-bold text-foreground/70 truncate">
            <span className="text-[10px] font-black uppercase text-foreground/50 mr-1">Bomboniere:</span>
            <span>{snacks.map((s) => `${s.quantity}x ${s.name}`).join(' • ')}</span>
          </div>
        )}
      </div>

      {/* Dashed Separator Line */}
      <div className="border-b-2 border-dashed border-foreground/30 mx-4 shrink-0" />

      {/* 3. Footer Stub Section (QR Code & Status) */}
      <div className="p-3 flex items-center justify-between gap-3 shrink-0 bg-muted/10 h-[76px]">
        <div className="flex items-center gap-3">
          {/* QR Code Container with High-Contrast White Background (Fixed 52x52px) */}
          <button
            type="button"
            onClick={onQrClick}
            className="w-13 h-13 min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] shrink-0 border-2 border-foreground/40 bg-white p-1 cursor-pointer overflow-hidden flex items-center justify-center shadow-[2px_2px_0px_0px_var(--border)] hover:scale-105 active:scale-95 transition-transform"
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
        {actionButtons && <div className="flex items-center gap-1.5">{actionButtons}</div>}
      </div>

    </div>
  );
};
