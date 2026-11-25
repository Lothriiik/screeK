import { useState } from 'react';
import {
  MagnifyingGlass,
  MapPin,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { CinemaListingCard, getCinemaListings } from '../components/custom/cinema-listing-card';

const AMENITY_FILTERS = [
  'IMAX',
  'VIP',
  '4DX',
  'DOLBY',
  'D-BOX',
  'CINÉPIC',
  'ESTACIONAMENTO',
];

export function Cinemas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Build cinema list with their current sessions from mock store
  const cinemasWithSessions = getCinemaListings();

  // Filter cinemas
  const filteredCinemas = cinemasWithSessions.filter((cinema) => {
    const matchesSearch =
      cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cinema.chain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((a) =>
        cinema.amenities.some((ca) => ca.toUpperCase().includes(a.toUpperCase()))
      );

    return matchesSearch && matchesAmenities;
  });

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. TOP HEADER & SEARCH ─── */}
      <section className="bg-background py-8 px-4 sm:px-0">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-primary tracking-tight">
                Cinemas
              </h1>
            </div>
          </div>

          {/* Search Bar + Icon-only Filter Toggle Button */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/50"
                weight="bold"
              />
              <input
                type="text"
                placeholder="Buscar por cinema, shopping, rede ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-foreground/40 text-xs sm:text-sm font-sans text-foreground placeholder:text-foreground/50 outline-none focus:border-primary shadow-[3px_3px_0px_0px_var(--border)]"
              />
            </div>

            {/* Filter Toggle Button (Icon Only) */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              title="Filtros de Comodidades"
              className={`w-11 h-11 border-2 flex items-center justify-center cursor-pointer transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 shrink-0 ${
                showFilters || selectedAmenities.length > 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-foreground/40 hover:bg-muted'
              }`}
            >
              <SlidersHorizontal size={18} weight="bold" />
            </button>
          </div>

          {/* Expandable Filter Chips Drawer */}
          {showFilters && (
            <div className="bg-background space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="block text-[11px] font-black uppercase text-foreground/60">
                Filtrar por Comodidades &amp; Recursos:
              </span>
              <div className="flex flex-wrap gap-2">
                {AMENITY_FILTERS.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 text-xs font-black uppercase transition-all cursor-pointer border ${
                        isChecked
                          ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                          : 'bg-background text-foreground/80 border-foreground/30 hover:bg-muted'
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}

                {selectedAmenities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAmenities([])}
                    className="px-2.5 py-1 text-xs font-black uppercase text-foreground/60 hover:text-foreground border border-transparent underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Summary line */}
          <div className="flex items-center justify-between text-xs font-bold text-foreground/60 pt-1">
            <span>
              {filteredCinemas.length} {filteredCinemas.length === 1 ? 'complexo encontrado' : 'complexos encontrados'}
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. CINEMA LISTINGS ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 space-y-8">
        {filteredCinemas.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)]">
            <MapPin size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhum cinema encontrado</h3>
            <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
              Tente alterar os termos de busca ou remover alguns filtros de recursos.
            </p>
          </div>
        ) : (
          filteredCinemas.map((cinema) => (
            <CinemaListingCard key={cinema.id} cinema={cinema} />
          ))
        )}
      </main>
    </div>
  );
}
