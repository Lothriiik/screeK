import React, { useEffect, useRef } from 'react';
import type { Cinema } from '../../types/cinema';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Coordenadas mock para os cinemas da plataforma
const CINEMA_COORDS: Record<string, [number, number]> = {
  'cinemark-bourbon': [-23.5283, -46.6801],
  'cinepolis-jk': [-23.5911, -46.6902],
  'reserva-cultural': [-23.5652, -46.6512],
  'uci-nycc': [-22.9998, -43.3613],
};

interface CinemaMapProps {
  cinemas: Cinema[];
  selectedCinemaId?: string;
  onSelectCinema?: (cinema: Cinema) => void;
  className?: string;
}

export const CinemaMap: React.FC<CinemaMapProps> = ({
  cinemas,
  selectedCinemaId,
  onSelectCinema,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inicializar mapa em São Paulo
    const map = L.map(mapContainerRef.current, {
      center: [-23.555, -46.665],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // TileLayer com tema escuro / minimalista OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Adicionar marcadores brutalistas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpar marcadores anteriores
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    cinemas.forEach((cinema) => {
      const coords = CINEMA_COORDS[cinema.id] || [-23.55 + Math.random() * 0.05, -46.65 + Math.random() * 0.05];

      const customIcon = L.divIcon({
        className: 'custom-cinema-pin',
        html: `
          <div style="
            background: #000;
            color: #fff;
            padding: 4px 8px;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
            border: 2px solid var(--primary, #e11d48);
            box-shadow: 3px 3px 0px #000;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>📍</span>
            <span>${cinema.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [100, 30],
        iconAnchor: [50, 15],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="font-weight: 800; margin: 0 0 4px; font-size: 13px;">${cinema.name}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #666;">${cinema.address}</p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${cinema.amenities.slice(0, 3).map((a) => `<span style="font-size: 10px; background: #eee; padding: 2px 4px; font-weight: bold;">${a}</span>`).join('')}
          </div>
          <a href="/cinemas/${cinema.id}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 4px 8px; font-size: 11px; font-weight: bold;">Ver Sessões →</a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectCinema) onSelectCinema(cinema);
      });

      markersRef.current[cinema.id] = marker;
    });
  }, [cinemas, onSelectCinema]);

  // Centralizar quando um cinema é selecionado
  useEffect(() => {
    if (!selectedCinemaId || !mapInstanceRef.current) return;
    const coords = CINEMA_COORDS[selectedCinemaId];
    if (coords) {
      mapInstanceRef.current.flyTo(coords, 14, { duration: 1 });
      const marker = markersRef.current[selectedCinemaId];
      if (marker) marker.openPopup();
    }
  }, [selectedCinemaId]);

  return (
    <div className={`relative border-4 border-border shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full min-h-[420px] bg-muted" />

      {/* Overlay legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm p-2 border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] text-xs font-mono font-bold flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>{cinemas.length} Cinemas no Mapa</span>
      </div>
    </div>
  );
};
