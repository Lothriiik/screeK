import { useState } from 'react';
import { Armchair, FilmStrip, Plus, Trash } from '@phosphor-icons/react';
import type { Room, RoomType } from '../../types/cinema';

function buildSeatMap(room: Room) {
  const columns = 10;
  const rows = Math.ceil(room.capacity / columns);
  return Array.from({ length: room.capacity }, (_, index) => {
    const rowIndex = Math.floor(index / columns);
    const number = (index % columns) + 1;
    return { id: `${String.fromCharCode(65 + rowIndex)}${number}`, numeric_id: index + 1, room_id: room.id, row: String.fromCharCode(65 + rowIndex), number, pos_x: number, pos_y: rowIndex, type: 'standard' as const, price_multiplier: 1, is_occupied: false };
  }).slice(0, rows * columns);
}

interface CinemaRoomEditorProps {
  rooms: Room[];
  roomTypes: RoomType[];
  projectionAudioOptions: string[];
  onAddRoom: () => void;
  onUpdateRoom: (index: number, field: keyof Room, value: unknown) => void;
  onRemoveRoom: (index: number) => void;
}

export function CinemaRoomEditor({
  rooms,
  roomTypes,
  projectionAudioOptions,
  onAddRoom,
  onUpdateRoom,
  onRemoveRoom,
}: CinemaRoomEditorProps) {
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);
  return (
    <section className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
      <div className="border-b-2 border-foreground/20 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilmStrip size={20} weight="bold" className="text-secondary" />
          <h3 className="text-base font-black uppercase text-foreground">
            4. Salas do Complexo ({rooms.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onAddRoom}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground font-black text-xs uppercase flex items-center gap-1.5 border-2 border-secondary shadow-[2px_2px_0px_0px_var(--border)] hover:bg-secondary/90 transition-all cursor-pointer"
        >
          <Plus size={15} weight="bold" />
          <span>Adicionar Nova Sala</span>
        </button>
      </div>

      <div className="space-y-3">
        {rooms.map((room, idx) => (
          <div key={room.id || idx} className="border-2 border-foreground/30 bg-muted/20 p-4">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1.4fr)_auto]">
            <div className="hidden w-6 pb-2 text-xs font-black text-foreground/40 font-mono xl:block">#{idx + 1}</div>

            <div className="min-w-0 space-y-1">
              <label className="text-[10px] font-black uppercase text-foreground/60 block">Nome da Sala</label>
              <input
                type="text"
                value={room.name}
                onChange={(event) => onUpdateRoom(idx, 'name', event.target.value)}
                placeholder="Sala 1"
                className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div className="min-w-0 space-y-1">
              <label className="text-[10px] font-black uppercase text-foreground/60 block">Tipo / Categoria</label>
              <select
                value={room.type}
                onChange={(event) => onUpdateRoom(idx, 'type', event.target.value as RoomType)}
                className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold uppercase focus:outline-none focus:border-primary cursor-pointer"
              >
                {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="min-w-0 space-y-1">
              <label className="text-[10px] font-black uppercase text-foreground/60 block">Poltronas</label>
              <input
                type="number"
                min={10}
                max={800}
                value={room.capacity}
                onChange={(event) => onUpdateRoom(idx, 'capacity', parseInt(event.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold text-center focus:outline-none focus:border-primary"
              />
            </div>

            <div className="min-w-0 space-y-1">
              <label className="text-[10px] font-black uppercase text-foreground/60 block">Especificação de Projeção &amp; Áudio</label>
              <select
                value={room.screen_name || ''}
                onChange={(event) => onUpdateRoom(idx, 'screen_name', event.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs focus:outline-none focus:border-primary"
              >
                {!projectionAudioOptions.includes(room.screen_name || '') && room.screen_name && (
                  <option value={room.screen_name}>{room.screen_name}</option>
                )}
                {projectionAudioOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="flex justify-end sm:col-span-2 xl:col-span-1">
              <button
                type="button"
                onClick={() => onRemoveRoom(idx)}
                className="p-2 border border-foreground/30 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Remover Sala"
                aria-label={`Remover sala ${room.name}`}
              >
                <Trash size={16} weight="bold" />
              </button>
            </div>
            </div>
            <div className="mt-3 border-t border-foreground/20 pt-3">
              <button type="button" onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-primary hover:underline"><Armchair size={15}/>{expandedRoomId === room.id ? 'Fechar mapa de assentos' : 'Configurar mapa de assentos'}</button>
              {expandedRoomId === room.id && (() => {
                const seats = room.seats?.length ? room.seats : buildSeatMap(room);
                const rows = [...new Set(seats.map((seat) => seat.row))];
                return <div className="mt-3 border-2 border-foreground/20 bg-background p-3">
                  <div className="mx-auto mb-4 max-w-sm border-y-2 border-foreground/30 py-1 text-center text-[9px] font-black uppercase tracking-[.18em] text-foreground/50">Tela</div>
                  <div className="space-y-1.5">{rows.map((row) => <div key={row} className="flex flex-wrap items-center justify-center gap-1"><span className="w-4 text-[9px] font-black text-foreground/50">{row}</span>{seats.filter((seat) => seat.row === row).map((seat) => <button key={seat.id} type="button" title={`${seat.id} · ${seat.type}`} onClick={() => { const next = seats.map((item) => item.id === seat.id ? { ...item, type: item.type === 'standard' ? 'wheelchair' as const : item.type === 'wheelchair' ? 'vip' as const : 'standard' as const, price_multiplier: item.type === 'standard' ? 1 : item.type === 'wheelchair' ? 1.5 : 1 } : item); onUpdateRoom(idx, 'seats', next); }} className={`h-6 min-w-6 border text-[8px] font-bold ${seat.type === 'wheelchair' ? 'border-secondary bg-secondary/20' : seat.type === 'vip' ? 'border-primary bg-primary/20' : 'border-foreground/25 bg-muted/30'}`}>{seat.number}</button>)}</div>)}</div>
                  <p className="mt-3 text-[9px] text-foreground/60">Clique nos assentos para alternar Padrão → Acessível → VIP. O mapa é uma configuração demonstrativa do protótipo.</p>
                </div>;
              })()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
