import React from 'react';
import { Info } from '@phosphor-icons/react';

export interface OrderItem {
  label: string;
  price: number;
}

export interface OrderSummaryProps {
  movieTitle?: string;
  moviePoster?: string;
  cinemaName?: string;
  cinemaLocation?: string;
  sessionRoomTime?: string;
  seats?: string[];
  items?: OrderItem[];
  subtotal?: number;
  serviceFee?: number;
  totalPrice?: number;
  ratingBadge?: string;
  formatBadges?: string[];
  showTimer?: boolean;
  timerSeconds?: number;
  onConfirm?: () => void;
  confirmButtonText?: string;
  disabledConfirm?: boolean;
  children?: React.ReactNode;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  movieTitle = 'Angel Dust',
  moviePoster = 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
  cinemaName = 'Cinesystem Arapiraca',
  cinemaLocation = 'Arapiraca / AL',
  sessionRoomTime = 'Sala 5 · Sex 27/03 · 19:00',
  seats = ['D7', 'D8'],
  items = [
    { label: '1x Inteira', price: 30.0 },
    { label: '1x Inteira', price: 30.0 },
  ],
  subtotal = 60.0,
  serviceFee = 5.0,
  totalPrice = 65.0,
  ratingBadge = 'L',
  formatBadges = ['IMAX', 'LEGENDADO'],
  showTimer = false,
  timerSeconds = 452,
  onConfirm,
  confirmButtonText = 'Avançar para Pagamento →',
  disabledConfirm = false,
  children,
}) => {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, Math.round((timerSeconds / 600) * 100)));

  const ratingColor =
    ratingBadge === 'L'
      ? 'bg-[#34A853]'
      : ratingBadge === '10'
      ? 'bg-[#3B82F6]'
      : ratingBadge === '12' || ratingBadge === '14'
      ? 'bg-[#D4A338]'
      : ratingBadge === '16'
      ? 'bg-[#FF9900]'
      : 'bg-[#DC3545]';

  return (
    <div className="w-full rounded-none border-4 border-foreground/40 bg-background font-display shadow-[6px_6px_0px_0px_var(--border)] overflow-hidden text-foreground">
      
      {/* Top Banner Header when showTimer is true (Exact matching Image) */}
      {showTimer ? (
        <div className="bg-tertiary text-background p-4 border-b-4 border-foreground/40 flex items-center justify-between">
          {/* Animated Circular Ring */}
          <div className="relative w-11 h-11 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-background/20"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-secondary"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>

          <div className="text-right">
            <span className="block text-2xl font-black text-secondary leading-none">{formattedTime}</span>
            <span className="text-[10px] font-bold text-background/80 font-sans tracking-wider block mt-0.5">
              restantes para concluir
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b-4 border-foreground/40 bg-background">
          <h3 className="text-base sm:text-lg font-black uppercase text-foreground">Resumo do Pedido</h3>
        </div>
      )}

      {/* Movie Details Header */}
      <div className="p-4 sm:p-5 flex gap-4 border-b-2 border-foreground/30 bg-background/50">
        <img
          src={moviePoster}
          alt={movieTitle}
          className="w-16 h-24 sm:w-20 sm:h-28 object-cover border-2 border-foreground/40 shrink-0 shadow-sm"
        />

        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            <h4 className="text-base font-black uppercase text-foreground leading-snug line-clamp-1">
              {movieTitle}
            </h4>

            {/* Rating and Format Badges */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`${ratingColor} text-white px-1.5 py-0.5 text-[10px] font-black uppercase shadow-sm`}>
                {ratingBadge}
              </span>
              {formatBadges.map((b, i) => (
                <span key={i} className="border border-foreground/40 text-foreground px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-background">
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-2">
              <span className="block text-xs font-black text-foreground">{cinemaName}</span>
              <span className="block text-[10px] font-sans text-foreground/60">{cinemaLocation}</span>
            </div>
          </div>

          <button className="flex items-center gap-1 text-[11px] font-black text-foreground/70 hover:text-primary cursor-pointer mt-1.5">
            <Info size={14} weight="bold" />
            <span>Ver Detalhes</span>
          </button>
        </div>
      </div>

      {/* Session Details Row */}
      <div className="px-5 py-3 border-b-2 border-foreground/30 flex items-center justify-between text-xs font-bold">
        <span className="text-foreground/60 uppercase font-black text-[11px]">Sessão</span>
        <span className="font-bold text-foreground font-sans">{sessionRoomTime}</span>
      </div>

      {/* Seats Row */}
      <div className="px-5 py-3 border-b-2 border-foreground/30 flex items-center justify-between text-xs font-bold">
        <span className="text-foreground/60 uppercase font-black text-[11px]">Assentos</span>
        <span className="font-black text-foreground">{seats.length > 0 ? seats.join(', ') : 'Nenhum'}</span>
      </div>

      {/* Optional Children slot (e.g. ticket type switchers) */}
      {children}

      {/* Itemized Pricing Section */}
      {items.length > 0 && (
        <div className="p-5 border-b-2 border-foreground/30 space-y-2 text-xs font-bold bg-background/30">
          <span className="block text-foreground/60 uppercase font-black text-[11px] mb-1">Itens</span>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-foreground font-sans">
              <span className="font-bold">{item.label}</span>
              <span className="font-black">R$ {item.price.toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Subtotal Row */}
      <div className="px-5 py-3 border-b-2 border-foreground/30 flex items-center justify-between text-xs font-bold">
        <span className="text-foreground/60 uppercase font-black text-[11px]">Subtotal</span>
        <span className="font-black text-foreground">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
      </div>

      {/* Taxa Row */}
      <div className="px-5 py-3 border-b-2 border-foreground/30 flex items-center justify-between text-xs font-bold">
        <span className="text-foreground/60 uppercase font-black text-[11px]">Taxa</span>
        <span className="font-black text-foreground">R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
      </div>

      {/* Total Row (Secondary Pink highlight) */}
      <div className="p-5 border-b-2 border-foreground/30 flex items-center justify-between text-base sm:text-lg font-black bg-muted/20">
        <span className="uppercase text-foreground">Total</span>
        <span className="text-2xl sm:text-3xl font-black text-secondary">
          R$ {totalPrice.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Confirm CTA Button */}
      {onConfirm && (
        <div className="p-4 bg-background">
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabledConfirm}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black text-sm uppercase transition-all shadow-[4px_4px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            {confirmButtonText}
          </button>
        </div>
      )}

    </div>
  );
};
