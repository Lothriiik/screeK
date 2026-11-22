import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Buildings,
  Plus,
  PencilSimple,
  Trash,
  CalendarBlank,
  ChartBar,
  MagnifyingGlass,
  MapPin,
  Phone,
  FilmStrip
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import type { Cinema } from '../types/cinema';
import { StatusModal } from '../components/custom/status-modal';

export function ManagementCinemas() {
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState('ALL');
  const [deletingCinema, setDeletingCinema] = useState<Cinema | null>(null);

  // Filtered cinemas
  const filteredCinemas = useMemo(() => {
    return cinemas.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChain = selectedChain === 'ALL' || c.chain === selectedChain;
      return matchesSearch && matchesChain;
    });
  }, [cinemas, searchQuery, selectedChain]);

  const chains = useMemo(() => {
    return Array.from(new Set(cinemas.map((c) => c.chain)));
  }, [cinemas]);

  // Confirm delete cinema
  const handleConfirmDelete = () => {
    if (!deletingCinema) return;
    setCinemas((prev) => prev.filter((c) => c.id !== deletingCinema.id));
    // Also remove from global mock store
    const idx = MOCK_CINEMAS.findIndex((c) => c.id === deletingCinema.id);
    if (idx !== -1) {
      MOCK_CINEMAS.splice(idx, 1);
    }
    toast.success('Cinema excluído da rede', {
      description: `${deletingCinema.name} foi desativado e removido.`,
    });
    setDeletingCinema(null);
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. TOP HEADER & METRICS ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Buildings size={22} weight="bold" className="text-secondary" />
                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                  Rede de Exibição • screeK B2B
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                Gerenciamento de Cinemas &amp; Salas
              </h1>
            </div>

            {/* Create Cinema Button (Navigates to dedicated page) */}
            <Link
              to="/management/cinemas/new"
              className="px-4 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-primary/90 transition-all"
            >
              <Plus size={16} weight="bold" />
              <span>Cadastrar Novo Cinema</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 bg-muted/20 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)]">
              <span className="text-[11px] font-black uppercase text-foreground/60 block">Total de Cinemas</span>
              <span className="text-2xl font-black text-foreground">{cinemas.length}</span>
            </div>
            <div className="p-3.5 bg-muted/20 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)]">
              <span className="text-[11px] font-black uppercase text-foreground/60 block">Salas Cadastradas</span>
              <span className="text-2xl font-black text-secondary">
                {cinemas.reduce((acc, c) => acc + (c.rooms?.length || c.rooms_count || 0), 0)}
              </span>
            </div>
            <div className="p-3.5 bg-muted/20 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)]">
              <span className="text-[11px] font-black uppercase text-foreground/60 block">Poltronas / Capacidade</span>
              <span className="text-2xl font-black text-foreground">
                {cinemas
                  .reduce(
                    (acc, c) =>
                      acc +
                      (c.rooms ? c.rooms.reduce((rAcc, r) => rAcc + r.capacity, 0) : c.rooms_count * 150),
                    0
                  )
                  .toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 bg-muted/20 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)]">
              <span className="text-[11px] font-black uppercase text-foreground/60 block">Salas Especiais (IMAX/VIP/4DX)</span>
              <span className="text-2xl font-black text-[#34A853]">
                {cinemas.reduce(
                  (acc, c) =>
                    acc +
                    (c.rooms ? c.rooms.filter((r) => r.type !== 'STANDARD').length : 2),
                  0
                )}
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlass
                size={16}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do cinema, cidade ou bairro..."
                className="w-full pl-9 pr-4 py-2 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-foreground/60">Rede:</span>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="px-3 py-2 bg-background border-2 border-foreground/30 text-xs font-bold font-display uppercase focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">Todas as Redes</option>
                {chains.map((chain) => (
                  <option key={chain} value={chain}>
                    {chain}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 2. CINEMA CARDS LIST ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-6">
        
        {filteredCinemas.length === 0 ? (
          <div className="p-12 text-center border-4 border-foreground/30 bg-muted/20 space-y-4">
            <Buildings size={48} weight="duotone" className="mx-auto text-foreground/40" />
            <h3 className="text-lg font-black uppercase text-foreground">Nenhum cinema encontrado</h3>
            <p className="text-xs font-sans text-foreground/60 max-w-md mx-auto">
              Nenhum complexo corresponde à sua pesquisa. Tente ajustar os filtros ou cadastre um novo cinema.
            </p>
            <Link
              to="/management/cinemas/new"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground font-black text-xs uppercase"
            >
              Cadastrar Primeiro Cinema
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCinemas.map((cinema) => {
              const roomsList = cinema.rooms || [];
              const totalSeats = roomsList.reduce((acc, r) => acc + r.capacity, 0);

              return (
                <div
                  key={cinema.id}
                  className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-5 sm:p-6 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b-2 border-foreground/20 pb-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-black uppercase">
                            {cinema.chain}
                          </span>
                          <span className="px-2 py-0.5 bg-[#34A853]/20 text-[#34A853] text-[10px] font-black uppercase border border-[#34A853]/40">
                            Ativo
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground truncate">
                          {cinema.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-sans text-foreground/60">
                          <MapPin size={14} weight="bold" className="shrink-0 text-secondary" />
                          <span className="truncate">{cinema.address}</span>
                        </div>
                      </div>

                      {/* Actions: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/management/cinemas/${cinema.id}/edit`}
                          className="p-2 border border-foreground/30 hover:bg-muted hover:text-primary transition-colors inline-block"
                          title="Editar Cinema & Salas"
                        >
                          <PencilSimple size={16} weight="bold" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingCinema(cinema)}
                          className="p-2 border border-foreground/30 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                          title="Excluir / Desativar Cinema"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Rooms / Salas Overview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-foreground/70 flex items-center gap-1.5">
                          <FilmStrip size={15} weight="bold" className="text-primary" />
                          <span>Salas Disponíveis ({roomsList.length})</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground/50">
                          {totalSeats} poltronas totais
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {roomsList.map((room) => (
                          <div
                            key={room.id}
                            className="p-2 bg-muted/20 border border-foreground/20 text-xs space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-foreground">{room.name}</span>
                              <span className={`text-[9px] font-black uppercase px-1 py-0.2 ${
                                room.type === 'IMAX'
                                  ? 'bg-[#6A1B4D] text-white'
                                  : room.type === 'VIP'
                                  ? 'bg-[#E5A93C] text-black'
                                  : room.type === '4DX'
                                  ? 'bg-[#009688] text-white'
                                  : 'bg-foreground/10 text-foreground'
                              }`}>
                                {room.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-foreground/50 block font-sans">
                              {room.capacity} assentos • {room.screen_name || 'Standard'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities Badges */}
                    {cinema.amenities && cinema.amenities.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-foreground/50 block">Comodidades:</span>
                        <div className="flex flex-wrap gap-1">
                          {cinema.amenities.map((am) => (
                            <span
                              key={am}
                              className="px-1.5 py-0.5 bg-foreground/5 border border-foreground/20 text-[10px] font-bold uppercase text-foreground/70"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Bottom Navigation Shortcuts */}
                  <div className="pt-4 border-t-2 border-foreground/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-foreground/50 font-sans">
                      <Phone size={13} />
                      <span>{cinema.phone || 'Sem telefone'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/management/schedule?cinemaId=${cinema.id}`}
                        className="px-3 py-1.5 bg-background hover:bg-muted border-2 border-foreground/40 text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <CalendarBlank size={14} weight="bold" />
                        <span>Sessões</span>
                      </Link>
                      <Link
                        to={`/statistics?cinemaId=${cinema.id}`}
                        className="px-3 py-1.5 bg-primary text-primary-foreground border-2 border-primary text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-primary/90"
                      >
                        <ChartBar size={14} weight="bold" />
                        <span>Métricas</span>
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ─── 3. MODAL DESTRUTIVO: CONFIRMAÇÃO DE EXCLUSÃO DE CINEMA ─── */}
      <StatusModal
        isOpen={Boolean(deletingCinema)}
        onClose={() => setDeletingCinema(null)}
        type="destruction"
        headerTitle="screeK B2B — Zona de Risco"
        title="Desativar & Excluir Cinema"
        description={`Você está prestes a desativar e excluir permanentemente o complexo ${deletingCinema?.name || ''} da rede.`}
        primaryActionLabel="Confirmar Exclusão"
        onPrimaryAction={handleConfirmDelete}
        deletionDetails={
          deletingCinema
            ? {
                title: deletingCinema.name,
                subtitle: `${deletingCinema.chain} • ${deletingCinema.city}/${deletingCinema.state} (${deletingCinema.rooms?.length || deletingCinema.rooms_count || 0} salas)`,
                highlightText: 'Sessões ativas serão canceladas e os ingressos vendidos serão estornados automaticamente aos clientes.',
              }
            : undefined
        }
      />

    </div>
  );
}
