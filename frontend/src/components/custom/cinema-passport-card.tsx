import { useEffect, useState, type CSSProperties } from 'react';
import { Star, X } from '@phosphor-icons/react';
import screeKLogo from '../../assets/logos/logo-full.svg';
import type { PosterPaletteColors } from '../../types/movie';

export type CinemaPassportPalette =
  | 'navy-pink'
  | 'plum'
  | 'rose'
  | 'wine-amber'
  | 'petroleum'
  | 'yellow'
  | 'poster';

type PaletteColors = {
  frame: string;
  border: string;
  badge: string;
  title: string;
  panel: string;
  panelText: string;
};

// As seis variações usam os tokens do tema para acompanhar light/dark mode.
const PALETTES: Record<CinemaPassportPalette, PaletteColors> = {
  'navy-pink': {
    frame: 'bg-tertiary', border: 'border-secondary', badge: 'bg-secondary text-foreground',
    title: 'bg-foreground text-background', panel: 'bg-tertiary/85', panelText: 'text-tertiary-foreground',
  },
  plum: {
    frame: 'bg-primary', border: 'border-tertiary', badge: 'bg-tertiary text-tertiary-foreground',
    title: 'bg-primary text-primary-foreground', panel: 'bg-primary/85', panelText: 'text-primary-foreground',
  },
  rose: {
    frame: 'bg-secondary', border: 'border-foreground', badge: 'bg-primary text-primary-foreground',
    title: 'bg-background text-foreground', panel: 'bg-secondary/90', panelText: 'text-foreground',
  },
  'wine-amber': {
    frame: 'bg-foreground', border: 'border-warning', badge: 'bg-warning text-foreground',
    title: 'bg-foreground text-background', panel: 'bg-foreground/85', panelText: 'text-background',
  },
  petroleum: {
    frame: 'bg-tertiary', border: 'border-primary', badge: 'bg-primary text-primary-foreground',
    title: 'bg-tertiary text-tertiary-foreground', panel: 'bg-tertiary/90', panelText: 'text-tertiary-foreground',
  },
  yellow: {
    frame: 'bg-warning', border: 'border-foreground', badge: 'bg-foreground text-background',
    title: 'bg-warning text-foreground', panel: 'bg-warning/90', panelText: 'text-foreground',
  },
  poster: {
    frame: 'bg-[var(--passport-frame)]', border: 'border-[var(--passport-accent)]',
    badge: 'bg-[var(--passport-accent)] text-[var(--passport-on-accent)]',
    title: 'bg-[var(--passport-title)] text-[var(--passport-on-title)]',
    panel: 'bg-[var(--passport-panel)]', panelText: 'text-[var(--passport-on-panel)]',
  },
};

type PosterPaletteStyle = CSSProperties & {
  '--passport-frame'?: string;
  '--passport-accent'?: string;
  '--passport-on-accent'?: string;
  '--passport-title'?: string;
  '--passport-on-title'?: string;
  '--passport-panel'?: string;
  '--passport-on-panel'?: string;
  '--passport-rating'?: string;
  '--passport-on-rating'?: string;
};

const POSTER_PALETTE_FALLBACK: PosterPaletteStyle = {
  '--passport-frame': 'rgb(var(--tertiary-rgb))',
  '--passport-accent': 'rgb(var(--secondary-rgb))',
  '--passport-on-accent': 'rgb(var(--foreground-rgb))',
  '--passport-title': 'rgb(var(--foreground-rgb))',
  '--passport-on-title': 'rgb(var(--background-rgb))',
  '--passport-panel': 'rgb(var(--tertiary-rgb) / 0.88)',
  '--passport-on-panel': 'rgb(var(--tertiary-foreground-rgb))',
  '--passport-rating': 'rgb(var(--secondary-rgb))',
  '--passport-on-rating': 'rgb(var(--secondary-foreground-rgb))',
};

type RGB = [number, number, number];
const PALETTE_CACHE_PREFIX = 'screek:cinema-passport-palette:v1:';
const PALETTE_STYLE_KEYS = [
  '--passport-frame',
  '--passport-accent',
  '--passport-on-accent',
  '--passport-title',
  '--passport-on-title',
  '--passport-panel',
  '--passport-on-panel',
  '--passport-rating',
  '--passport-on-rating',
] as const;

function paletteCacheKey(posterUrl: string) {
  return `${PALETTE_CACHE_PREFIX}${posterUrl}`;
}

function readCachedPosterPalette(posterUrl: string): PosterPaletteStyle | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const serialized = window.localStorage.getItem(paletteCacheKey(posterUrl));
    if (!serialized) return undefined;
    const cached = JSON.parse(serialized) as Record<string, unknown>;
    if (!PALETTE_STYLE_KEYS.every((key) => typeof cached[key] === 'string')) return undefined;
    return Object.fromEntries(PALETTE_STYLE_KEYS.map((key) => [key, cached[key]])) as PosterPaletteStyle;
  } catch {
    return undefined;
  }
}

function cachePosterPalette(posterUrl: string, palette: PosterPaletteStyle) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(paletteCacheKey(posterUrl), JSON.stringify(palette));
  } catch {
    // Cartões continuam funcionando quando o navegador bloqueia o armazenamento local.
  }
}

function posterColorsToStyle(palette: PosterPaletteColors): PosterPaletteStyle {
  return {
    '--passport-frame': palette.frame,
    '--passport-accent': palette.accent,
    '--passport-on-accent': palette.on_accent,
    '--passport-title': palette.title,
    '--passport-on-title': palette.on_title,
    '--passport-panel': palette.panel,
    '--passport-on-panel': palette.on_panel,
    '--passport-rating': palette.rating,
    '--passport-on-rating': palette.on_rating,
  };
}

function colorTextColor([r, g, b]: RGB) {
  const luminance = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b) > 0.42
    ? 'rgb(25 2 7)'
    : 'rgb(233 216 200)';
}

function toCssColor([r, g, b]: RGB) {
  return `rgb(${r} ${g} ${b})`;
}

function darken([r, g, b]: RGB, amount: number): RGB {
  return [r, g, b].map((channel) => Math.round(channel * (1 - amount))) as RGB;
}

function colorDistance(first: RGB, second: RGB) {
  return Math.sqrt(first.reduce((total, channel, index) => total + (channel - second[index]) ** 2, 0));
}

function extractPosterPalette(image: HTMLImageElement): PosterPaletteStyle | undefined {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 72;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return undefined;

  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const buckets = new Map<string, { color: RGB; count: number; saturation: number; lightness: number }>();

    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 180) continue;
      const color: RGB = [data[index], data[index + 1], data[index + 2]];
      const key = color.map((channel) => Math.round(channel / 32)).join('-');
      const red = color[0] / 255;
      const green = color[1] / 255;
      const blue = color[2] / 255;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const lightness = (max + min) / 2;
      const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
      const bucket = buckets.get(key);
      if (bucket) bucket.count += 1;
      else buckets.set(key, { color: color.map((channel) => Math.round(channel / 32) * 32) as RGB, count: 1, saturation, lightness });
    }

    const colors = [...buckets.values()];
    if (!colors.length) return undefined;
    const dominant = colors.reduce((best, current) => current.count > best.count ? current : best).color;
    const vivid = colors
      .filter((color) => color.lightness > 0.18 && color.lightness < 0.86 && color.saturation > 0.35)
      .sort((a, b) => b.saturation * Math.sqrt(b.count) - a.saturation * Math.sqrt(a.count))[0];
    const accent = vivid?.color ?? dominant;
    const frame = darken(dominant, 0.28);
    const title = darken(dominant, 0.62);
    const panelText = colorTextColor(darken(dominant, 0.12));
    const rating = [accent, frame, title]
      .sort((first, second) => colorDistance(second, dominant) - colorDistance(first, dominant))[0];

    return {
      '--passport-frame': toCssColor(frame),
      '--passport-accent': toCssColor(accent),
      '--passport-on-accent': colorTextColor(accent),
      '--passport-title': toCssColor(title),
      '--passport-on-title': colorTextColor(title),
      '--passport-panel': `rgb(${dominant.join(' ')} / 0.88)`,
      '--passport-on-panel': panelText,
      '--passport-rating': toCssColor(rating),
      '--passport-on-rating': colorTextColor(rating),
    };
  } catch {
    // Imagens externas sem CORS permanecem utilizáveis e usam a paleta de fallback.
    return undefined;
  }
}

export interface CinemaPassportCardProps {
  ticketNumber: string;
  ticketCode: string;
  movieTitle: string;
  posterUrl: string;
  rating: number;
  cinemaName: string;
  roomName: string;
  seats: string[];
  date: string;
  palette?: CinemaPassportPalette;
  posterColors?: PosterPaletteColors;
}

export function CinemaPassportCard({
  ticketNumber,
  ticketCode,
  movieTitle,
  posterUrl,
  rating,
  cinemaName,
  roomName,
  seats,
  date,
  palette = 'navy-pink',
  posterColors,
}: CinemaPassportCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [posterPaletteStyle, setPosterPaletteStyle] = useState<PosterPaletteStyle | undefined>(() =>
    palette === 'poster'
      ? (posterColors ? posterColorsToStyle(posterColors) : readCachedPosterPalette(posterUrl) ?? POSTER_PALETTE_FALLBACK)
      : undefined
  );
  const colors = PALETTES[palette];

  useEffect(() => {
    if (palette !== 'poster') {
      setPosterPaletteStyle(undefined);
      return;
    }

    if (posterColors) {
      const serverPalette = posterColorsToStyle(posterColors);
      setPosterPaletteStyle(serverPalette);
      cachePosterPalette(posterUrl, serverPalette);
      return;
    }

    const cachedPalette = readCachedPosterPalette(posterUrl);
    if (cachedPalette) {
      setPosterPaletteStyle(cachedPalette);
      return;
    }

    setPosterPaletteStyle(POSTER_PALETTE_FALLBACK);
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!cancelled) {
        const extractedPalette = extractPosterPalette(image);
        if (extractedPalette) {
          cachePosterPalette(posterUrl, extractedPalette);
          setPosterPaletteStyle(extractedPalette);
        }
      }
    };
    image.src = posterUrl;
    return () => { cancelled = true; };
  }, [palette, posterUrl, posterColors]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const cardContent = (
    <span className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
      <span className={`absolute inset-0 block border-[0.88cqw] border-dark-void p-[2.94cqw] [backface-visibility:hidden] ${colors.frame}`}>
        <span className={`relative block h-full overflow-hidden border-[0.88cqw] ${colors.border} bg-foreground`}>
          <img
            src={posterUrl}
            alt={`Pôster de ${movieTitle}`}
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
          />

          <span className={`absolute left-[2.94cqw] top-[2.94cqw] px-[2.35cqw] py-[0.88cqw] text-[clamp(8px,3.24cqw,11px)] font-extrabold leading-[1.2] tracking-[0.29cqw] ${colors.badge}`}>
            Nº {ticketNumber}
          </span>

          <span className="absolute inset-x-0 bottom-0 block">
            <span className={`flex min-h-[18.82cqw] items-center border-b-[0.88cqw] px-[4.12cqw] py-[2.94cqw] ${colors.border} ${colors.title}`}>
              <span className="line-clamp-2 w-full break-words pb-[0.6cqw] font-display text-[clamp(9px,5.88cqw,20px)] font-extrabold leading-[1.08] tracking-[-0.01em]">
                {movieTitle}
              </span>
            </span>

            <span className={`block px-[4.12cqw] py-[3.53cqw] backdrop-blur-md ${colors.panel} ${colors.panelText}`}>
              <span className="mb-[2.35cqw] flex items-end justify-between gap-[2.94cqw] text-[clamp(9px,3.82cqw,13px)] font-semibold leading-tight">
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="mb-[0.6cqw] block text-[clamp(7px,2.65cqw,9px)] font-normal tracking-[0.44cqw] opacity-80">CINEMA</span>
                  {cinemaName}
                </span>
                <span className={`flex shrink-0 items-center gap-[1.2cqw] px-[2.35cqw] py-[0.88cqw] font-display text-[clamp(9px,4.12cqw,14px)] font-extrabold ${palette === 'poster' ? 'bg-[var(--passport-rating)] text-[var(--passport-on-rating)]' : colors.badge}`}>
                  <Star size="1em" weight="fill" /> {rating.toFixed(1)}
                </span>
              </span>

              <span className="flex gap-[5.3cqw] whitespace-nowrap text-[clamp(9px,3.82cqw,13px)] font-semibold leading-tight">
                <span className="min-w-0 overflow-hidden text-ellipsis">
                  <span className="mb-[0.6cqw] block text-[clamp(7px,2.65cqw,9px)] font-normal tracking-[0.44cqw] opacity-80">SALA / POLTRONAS</span>
                  {roomName} / {seats.join(', ')}
                </span>
                <span className="min-w-0 overflow-hidden text-ellipsis">
                  <span className="mb-[0.6cqw] block text-[clamp(7px,2.65cqw,9px)] font-normal tracking-[0.44cqw] opacity-80">DATA</span>
                  {date}
                </span>
              </span>
            </span>
          </span>

          <span className="passport-shine pointer-events-none absolute inset-0 block bg-[length:250%_100%] bg-[position:130%_0] opacity-0 mix-blend-screen transition-[opacity,background-position] duration-1000 ease-out group-hover:bg-[position:-30%_0] group-hover:opacity-100" />
        </span>
      </span>

      <span className={`absolute inset-0 block border-[0.88cqw] border-dark-void p-[2.94cqw] [backface-visibility:hidden] [transform:rotateY(180deg)] ${colors.frame}`}>
        <span className={`passport-back-pattern relative flex h-full flex-col items-center justify-center gap-[5cqw] overflow-hidden border-[0.88cqw] px-[4cqw] ${colors.border} ${colors.frame} ${colors.panelText}`}>
          <img src={screeKLogo} alt="screeK" className="w-[42cqw] brightness-0 invert" />
          <span className="absolute bottom-[3cqw] left-[2cqw] right-[2cqw] text-center font-mono text-[clamp(8px,2.94cqw,10px)] tracking-wider text-secondary">
            Nº {ticketNumber} · {ticketCode}
          </span>
          <span className="absolute bottom-[10cqw] text-[clamp(7px,2.65cqw,9px)] font-black uppercase tracking-[0.2em] opacity-50">
            Toque para voltar
          </span>
        </span>
      </span>
    </span>
  );

  return (
    <>
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Ingresso de ${movieTitle} ampliado`}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Fechar ingresso ampliado"
            className="absolute right-4 top-4 z-[102] flex h-10 w-10 items-center justify-center border-2 border-background bg-foreground text-background hover:bg-primary"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label={`${isExpanded ? 'Carta ampliada. Clique para virar; Escape para fechar' : 'Duplo clique para ampliar'}: ${movieTitle}`}
        aria-pressed={isFlipped}
        onClick={() => setIsFlipped((current) => !current)}
        onDoubleClick={() => setIsExpanded(true)}
        style={posterPaletteStyle}
        className={`group mx-auto block aspect-[340/512] [container-type:inline-size] cursor-pointer text-left [perspective:1200px] ${isExpanded
          ? 'fixed left-1/2 top-1/2 z-[101] w-[min(88vw,calc(82vh*0.664))] max-w-none -translate-x-1/2 -translate-y-1/2'
          : 'relative w-full'
        }`}
      >
        {cardContent}
      </button>
    </>
  );
}
