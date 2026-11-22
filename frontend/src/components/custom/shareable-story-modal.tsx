import React, { useState, useRef } from 'react';
import type { Movie } from '../../types/movie';
import type { UserMovieLog } from '../../types/stats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, Copy, Sparkles, Check, Grid, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface ShareableStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'single' | 'grid';
  // Props para modo single
  movie?: Movie;
  userRating?: number;
  userName?: string;
  userAvatar?: string;
  // Props para modo grid
  logs?: UserMovieLog[];
  title?: string; // e.g. "Esta Semana", "Setembro 2026", "Meus Favoritos"
}

export const ShareableStoryModal: React.FC<ShareableStoryModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode = 'single',
  movie,
  userRating = 5.0,
  userName = 'lothrik',
  userAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  logs = [],
  title = 'Meus Filmes',
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'grid'>(initialMode);
  const [gridCols, setGridCols] = useState<number>(3);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalf) {
      stars.push('½');
    }
    return stars.join('');
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `screek-${activeTab === 'single' ? (movie?.id || 'filme') : 'grid'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagem salva com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      toast.error('Não foi possível gerar a imagem.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        cacheBust: true,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      toast.error('Erro ao copiar imagem para clipboard.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentMovie = movie;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background border-4 border-border rounded-none shadow-[8px_8px_0px_0px_var(--border)]">
        <DialogHeader className="border-b-2 border-border pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Compartilhar Card Social
            </DialogTitle>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 pt-2">
            {movie && (
              <Button
                size="sm"
                variant={activeTab === 'single' ? 'default' : 'outline'}
                onClick={() => setActiveTab('single')}
                className="gap-1.5 font-bold"
              >
                <ImageIcon className="h-4 w-4" />
                Story Individual (9:16)
              </Button>
            )}
            {logs && logs.length > 0 && (
              <Button
                size="sm"
                variant={activeTab === 'grid' ? 'default' : 'outline'}
                onClick={() => setActiveTab('grid')}
                className="gap-1.5 font-bold"
              >
                <Grid className="h-4 w-4" />
                Grid de Filmes (boxdgrid)
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Options Bar for Grid */}
        {activeTab === 'grid' && (
          <div className="flex items-center justify-between bg-muted p-2 border-2 border-border text-xs font-bold">
            <span className="text-muted-foreground uppercase tracking-wider">Colunas do Grid:</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => setGridCols(cols)}
                  className={`px-2 py-0.5 border font-mono ${
                    gridCols === cols
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-accent'
                  }`}
                >
                  {cols} colunas
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Container */}
        <div className="flex justify-center items-center py-4 bg-muted/40 border-2 border-dashed border-border overflow-hidden">
          {activeTab === 'single' && currentMovie && (
            /* STORY INDIVIDUAL (9:16) - Estilo Letterboxd */
            <div
              ref={cardRef}
              className="relative w-[320px] h-[568px] sm:w-[360px] sm:h-[640px] shrink-0 bg-neutral-950 overflow-hidden flex flex-col justify-between p-6 shadow-2xl select-none"
              style={{
                backgroundImage: `url(${currentMovie.backdrop_url || currentMovie.poster_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Dark Gradient Overlay for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
              <div className="absolute inset-0 backdrop-blur-[2px]" />

              {/* User Pin at Top */}
              <div className="relative z-10 flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-6 w-6 rounded-full object-cover border border-white"
                  />
                  <span className="text-xs font-bold text-white tracking-wide">@{userName}</span>
                </div>
              </div>

              {/* Center: Poster with subtle rotation/shadow */}
              <div className="relative z-10 flex flex-col items-center my-auto">
                <div className="relative group">
                  <img
                    src={currentMovie.poster_url}
                    alt={currentMovie.title}
                    className="w-[170px] sm:w-[190px] aspect-[2/3] object-cover rounded-md shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-white/20"
                  />
                </div>

                {/* Movie Title & User Stars */}
                <div className="mt-4 text-center px-4 space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
                    {currentMovie.title}
                  </h2>
                  <p className="text-xs text-white/70 font-medium">
                    {currentMovie.release_year} {currentMovie.origin_country && `· ${currentMovie.origin_country}`}
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-1 text-emerald-400 text-lg sm:text-xl tracking-widest drop-shadow">
                    {renderStars(userRating)}
                  </div>
                </div>
              </div>

              {/* Bottom: screeK Branding */}
              <div className="relative z-10 flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs tracking-widest uppercase font-black text-white/90">
                  🎬 screeK
                </span>
                <span className="text-[10px] text-white/50 font-mono">cinema & comunidade</span>
              </div>
            </div>
          )}

          {activeTab === 'grid' && logs.length > 0 && (
            /* GRID DE FILMES (Estilo boxdgrid) */
            <div
              ref={cardRef}
              className="w-full max-w-[540px] bg-neutral-950 p-4 border border-neutral-800 shadow-2xl flex flex-col justify-between"
            >
              {/* Optional Title */}
              {title && (
                <div className="border-b border-neutral-800 pb-2 mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {title}
                  </h3>
                </div>
              )}

              {/* Grid of Posters */}
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
              >
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="relative aspect-[2/3] overflow-hidden bg-neutral-900 border border-neutral-800 group"
                  >
                    <img
                      src={log.movie.poster_url}
                      alt={log.movie.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Dark gradient overlay on bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 pt-6 flex flex-col justify-end">
                      <h4 className="text-[11px] font-bold text-white line-clamp-1 leading-tight drop-shadow">
                        {log.movie.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        ({log.movie.release_year})
                      </p>
                      <div className="text-emerald-400 text-xs tracking-wider pt-0.5">
                        {renderStars(log.user_rating)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Branding */}
              <div className="flex items-center justify-between border-t border-neutral-800 pt-3 mt-4 text-[11px] text-neutral-400 font-bold">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2 w-2 bg-emerald-400 rounded-none inline-block" />
                  screeK · Cine-Pass
                </span>
                <span className="font-mono text-[10px] text-neutral-500">
                  @{userName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 border-t-2 border-border pt-4">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={isExporting}
            className="w-full sm:w-auto gap-2 font-bold"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar Imagem'}
          </Button>

          <Button
            variant="default"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full sm:w-auto gap-2 font-bold"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Baixar Imagem (PNG)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
