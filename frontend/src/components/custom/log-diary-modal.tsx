import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { StarRating } from './star-rating';
import { BookOpen, Calendar, MapPin, Eye, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../../mocks/cinemas';
import type { Movie } from '../../types/movie';

interface LogDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie;
  initialRating?: number;
  onSaved?: (logData: any) => void;
}

export const LogDiaryModal: React.FC<LogDiaryModalProps> = ({
  isOpen,
  onClose,
  movie,
  initialRating = 5,
  onSaved,
}) => {
  const [rating, setRating] = useState<number>(initialRating || 5);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cinema, setCinema] = useState<string>('Reserva Cultural');
  const [format, setFormat] = useState<string>('2D');
  const [isRewatch, setIsRewatch] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const logEntry = {
      id: `diary-${Date.now()}`,
      movieId: movie.id,
      movieTitle: movie.title,
      watchedAt: date,
      cinemaName: cinema,
      format,
      rating,
      isRewatch,
      notes: notes.trim(),
    };

    // Salva no localStorage como mock persistente do diário
    try {
      const existing = JSON.parse(localStorage.getItem('screek_user_diary') || '[]');
      localStorage.setItem('screek_user_diary', JSON.stringify([logEntry, ...existing]));
    } catch {
      // ignore
    }

    if (onSaved) onSaved(logEntry);
    toast.success(`Filme "${movie.title}" registrado no seu Diário!`, {
      description: `${date} • ${cinema} (${format})`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-background border-4 border-foreground text-foreground p-6 shadow-[8px_8px_0px_0px_var(--border)] rounded-none font-display">
        <DialogHeader className="border-b-2 border-foreground/20 pb-3">
          <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Registrar Sessão no Diário</span>
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-sans">
            <span className="font-bold text-foreground">{movie.title}</span>
            <span>({movie.release_year})</span>
            {movie.duration_display && <span>• {movie.duration_display}</span>}
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-3">
          {/* Rating */}
          <div className="space-y-1.5 p-3 bg-muted/60 border-2 border-border">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              Sua Nota para Esta Sessão
            </label>
            <div className="flex items-center justify-between">
              <StarRating value={rating} onChange={setRating} size={22} starColor="text-amber-400" />
              <span className="font-mono font-black text-base text-amber-500">
                {rating.toFixed(1)} ★
              </span>
            </div>
          </div>

          {/* Date & Rewatch Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> Data da Sessão
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs h-9 bg-card font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3 text-emerald-500" /> Reexibição?
              </label>
              <button
                type="button"
                onClick={() => setIsRewatch(!isRewatch)}
                className={`w-full h-9 px-3 border-2 text-xs font-bold uppercase flex items-center justify-between transition-all ${
                  isRewatch
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-black'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{isRewatch ? 'Sim (Rewatch)' : 'Primeira Vez'}</span>
                {isRewatch && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Cinema Location & Screen Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> Cinema / Local
              </label>
              <select
                value={cinema}
                onChange={(e) => setCinema(e.target.value)}
                className="w-full h-9 px-2 text-xs font-sans bg-card border-2 border-border focus:outline-none focus:border-primary text-foreground"
              >
                <option value="Em Casa / Streaming">🏠 Em Casa / Streaming</option>
                {MOCK_CINEMAS.map((c) => (
                  <option key={c.id} value={c.name}>
                    📍 {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                Formato da Sala
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['2D', '3D', 'IMAX', 'VIP'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`h-9 border text-[11px] font-mono font-bold uppercase transition-all ${
                      format === fmt
                        ? 'bg-primary text-primary-foreground border-primary font-black shadow-[1px_1px_0px_0px_var(--border)]'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes / Snippet */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              Anotações Rápidas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que achou da projeção, som ou público desta sessão..."
              className="w-full p-2.5 bg-card border-2 border-border text-xs font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none text-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t-2 border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="uppercase font-black text-xs">
              Cancelar
            </Button>
            <Button type="submit" variant="default" size="sm" className="uppercase font-black text-xs">
              Salvar no Diário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
