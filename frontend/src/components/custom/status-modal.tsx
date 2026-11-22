import React from 'react';
import { Check, X as XIcon, WarningCircle, Clock, Trash } from '@phosphor-icons/react';
import { Button } from '../ui/button';

export interface ReservationDetails {
  movieTitle: string;
  cinemaName: string;
  sessionTime: string;
  seats: string[];
}

export interface DeletionDetails {
  title: string; // e.g. "DUNA: PARTE II" or "TOP SCI-FI 2026"
  subtitle?: string; // e.g. "Cinemark Bourbon · Seg 25/08 - 19:30" or "Coleção de 14 Filmes"
  highlightText: string; // e.g. "Reembolso de R$ 109,00 será estornado" or "Esta lista será excluída definitivamente"
}

export interface StatusModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'expired' | 'confirm' | 'destruction';
  headerTitle?: string;
  title?: string; 
  description: string; 
  errorCode?: string | number;
  errorTechnicalDetails?: string;
  reservationDetails?: ReservationDetails;
  deletionDetails?: DeletionDetails;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  type,
  headerTitle,
  title,
  description,
  errorCode,
  errorTechnicalDetails,
  reservationDetails,
  deletionDetails,
  primaryActionLabel = 'CONFIRMAR',
  secondaryActionLabel = 'VOLTAR',
  onPrimaryAction,
  onSecondaryAction,
  onClose,
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isConfirm = type === 'confirm';
  const isDestruction = type === 'destruction';
  const isWarning = type === 'warning';
  const isExpired = type === 'expired';

  const isDestructionTheme = isDestruction || isConfirm;

  const displayHeaderTitle =
    headerTitle ||
    (isSuccess
      ? 'SUCESSO!'
      : isError
      ? 'ERROR'
      : isDestruction
      ? 'EXCLUIR DEFINITIVAMENTE'
      : isConfirm
      ? 'CONFIRMAR CANCELAMENTO'
      : isWarning
      ? 'ATENÇÃO'
      : 'RESERVA EXPIRADA');

  const colorTheme = isSuccess
    ? {
        border: 'border-success',
        bg: 'bg-success/10',
        text: 'text-success dark:text-success',
        buttonBg: 'bg-success hover:bg-emerald-700 text-background',
      }
    : isDestructionTheme || isError
    ? {
        border: 'border-destructive',
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        buttonBg: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
      }
    : isWarning
    ? {
        border: 'border-amber-500',
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        buttonBg: 'bg-amber-500 hover:bg-amber-600 text-black',
      }
    : {
        border: 'border-primary',
        bg: 'bg-primary/10',
        text: 'text-primary',
        buttonBg: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs font-display">
      <div className={`w-full max-w-[420px] bg-background text-foreground rounded-none border-4 ${colorTheme.border} shadow-[10px_10px_0px_0px_var(--border)] overflow-hidden animate-in fade-in zoom-in-95`}>
        
        {/* Header Bar */}
        <div className={`flex items-center justify-between border-b-4 ${colorTheme.bg} ${colorTheme.border} p-3.5 sm:p-4 px-5 sm:px-6`}>
          <div className="flex items-center gap-2.5">
            {isSuccess && <Check size={22} weight="bold" className={colorTheme.text} />}
            {isError && <XIcon size={22} weight="bold" className={colorTheme.text} />}
            {(isDestructionTheme) && <Trash size={22} weight="bold" className={colorTheme.text} />}
            {isWarning && <WarningCircle size={22} weight="bold" className={colorTheme.text} />}
            {isExpired && <Clock size={22} weight="fill" className={colorTheme.text} />}
            
            <h1 className={`text-sm sm:text-base font-display font-black uppercase tracking-wide ${colorTheme.text}`}>
              {displayHeaderTitle}
            </h1>
          </div>

          <button
            onClick={onClose}
            className={`border-2 hover:bg-foreground/20 ${colorTheme.border} h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center ml-auto cursor-pointer transition-colors`}
            title="Fechar"
          >
            <XIcon size={16} className={colorTheme.text} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {title && (
            <h2 className="text-base sm:text-lg font-black uppercase text-foreground leading-snug">
              {title}
            </h2>
          )}

          <p className="text-xs sm:text-sm font-sans text-foreground/80 leading-relaxed">
            {description}
          </p>

          {/* Technical Error Code Box (For Error Modals) */}
          {(isError || errorCode || errorTechnicalDetails) && (
            <div className="p-3 border-2 border-foreground/40 bg-foreground/5 font-mono text-xs font-bold text-foreground/80 space-y-1 my-3">
              <div>Error Code: {errorCode || '500'}</div>
              <div>Mensagem: {errorTechnicalDetails || 'Internal Server Error'}</div>
            </div>
          )}

          {/* Reservation Details Box (For Expired Reservation Modal) */}
          {reservationDetails && (
            <div className="p-4 border-2 border-foreground/40 bg-foreground/5 font-mono text-center space-y-1 my-3">
              <div className="font-black text-foreground text-sm uppercase">{reservationDetails.movieTitle}</div>
              <div className="text-xs font-bold text-foreground/60">
                {reservationDetails.cinemaName} &nbsp; {reservationDetails.sessionTime}
              </div>
              <div className="text-xs font-black text-primary pt-1">
                Assentos {reservationDetails.seats.join(' e ')} foram liberados
              </div>
            </div>
          )}

          {/* Deletion / Cancellation Details Box in Destruction Red Tone */}
          {deletionDetails && (
            <div className="p-4 border-2 border-destructive/50 bg-destructive/5 font-mono text-center space-y-1.5 my-3">
              <div className="font-black text-foreground text-sm uppercase tracking-wide">
                {deletionDetails.title}
              </div>
              {deletionDetails.subtitle && (
                <div className="text-xs font-bold text-foreground/70">
                  {deletionDetails.subtitle}
                </div>
              )}
              <div className="text-xs font-black text-destructive pt-1 leading-snug">
                {deletionDetails.highlightText}
              </div>
            </div>
          )}

          {/* Stacked Action Buttons matching the Figma design */}
          <div className="flex flex-col space-y-2 pt-2">
            <button
              onClick={() => {
                if (onPrimaryAction) onPrimaryAction();
                onClose();
              }}
              className={`w-full py-3 text-xs font-display font-black uppercase tracking-wider border-2 border-transparent transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${colorTheme.buttonBg}`}
            >
              {primaryActionLabel}
            </button>

            {secondaryActionLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onSecondaryAction) onSecondaryAction();
                  onClose();
                }}
                className="w-full font-display font-black text-xs uppercase"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
