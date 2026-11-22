import { useState } from 'react';
import {
  Warning,
  Plus,
  MagnifyingGlass,
  ArrowRight,
  PencilSimple,
  Copy,
  Trash,
  X,
  Armchair
} from '@phosphor-icons/react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export function ManagementScreens() {
  const [viewMode, setViewMode] = useState<'gantt' | 'table'>('gantt');
  const [selectedDay, setSelectedDay] = useState<string>('Hoje');
  const [selectedCinema, setSelectedCinema] = useState<string>('Cinemark Shopping');
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cinema selector */}
          <select
            value={selectedCinema}
            onChange={(e) => setSelectedCinema(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-bold focus:border-primary outline-none"
          >
            <option>Cinemark Shopping Plaza</option>
            <option>Kinoplex Maceió</option>
            <option>Cinesystem Arapiraca Garden</option>
          </select>

          {/* Weekday strip */}
          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/60">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Hoje', 'Sáb', 'Dom'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedDay === day
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar filme ou sala..."
              className="bg-background border border-border pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Action buttons & View mode switch */}
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                viewMode === 'gantt' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Visão Gantt
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded ${
                viewMode === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Visão Tabela
            </button>
          </div>

          <Button size="sm" onClick={() => setShowNewSessionModal(true)}>
            <Plus size={16} className="mr-1" weight="bold" /> Nova Sessão
          </Button>
        </div>
      </div>

      {/* 3-Column Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operational Alerts & Room Occupancy (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Operational Alerts */}
          <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-1.5 text-amber-500">
                <Warning size={18} weight="fill" />
                Alertas Operacionais
              </h3>
              <Badge variant="destructive" className="text-[10px]">1 Crítico</Badge>
            </div>

            {/* Critical Overlap Alert */}
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-red-500">Sobreposição de Sala</span>
                <span className="text-[10px] text-muted-foreground">Sala 04 IMAX</span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                <strong>Duna II</strong> colide 46 min com <strong>Deadpool & W.</strong>
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => setShowConflictModal(true)}
              >
                Resolver Conflito <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>

            {/* Warning Alert */}
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Baixa Ocupação (18%)</span>
              <p className="text-xs text-muted-foreground">Sessão das 14:00 (Sala 1) abaixo do ponto de equilíbrio.</p>
            </div>

            {/* Maintenance Alert */}
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Manutenção Agendada</span>
              <p className="text-xs text-muted-foreground">Sala 03 VIP: Troca de filtros às 12h-14h.</p>
            </div>
          </div>

          {/* Room Live Status */}
          <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm space-y-3">
            <h3 className="font-black text-sm">Status das Salas</h3>
            
            <div className="space-y-2.5">
              {[
                { name: 'Sala 01 Standard', tech: '2D DUB', cap: '180 lugares', occ: 42, status: 'Ativa' },
                { name: 'Sala 02 4DX', tech: '4DX 3D', cap: '120 lugares', occ: 96, status: 'Quase Lotada' },
                { name: 'Sala 03 VIP', tech: 'VIP LEG', cap: '60 lugares', occ: 74, status: 'Ativa' },
                { name: 'Sala 04 IMAX', tech: 'IMAX Laser', cap: '240 lugares', occ: 88, status: 'Em Conflito' },
              ].map((room, idx) => (
                <div key={idx} className="p-2.5 bg-muted/20 border border-border rounded-lg space-y-1.5">
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-bold">{room.name}</span>
                    <Badge variant={room.occ > 85 ? 'destructive' : 'secondary'} className="text-[9px]">
                      {room.occ}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        room.occ > 85 ? 'bg-primary' : room.occ > 60 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${room.occ}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Gantt Timeline or Table View (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {viewMode === 'gantt' ? (
            <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <h3 className="font-black text-base">Grade de Programação (Gantt)</h3>
                  <p className="text-xs text-muted-foreground">Linha do tempo proporcional por sala de exibição</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Agora: <strong>16:45</strong></span>
                </div>
              </div>

              {/* Time header axis (13h to 22h) */}
              <div className="grid grid-cols-9 text-[11px] font-mono text-muted-foreground border-b border-border pb-1 text-center">
                <span>13h</span>
                <span>14h</span>
                <span>15h</span>
                <span>16h</span>
                <span>17h</span>
                <span>18h</span>
                <span>19h</span>
                <span>20h</span>
                <span>21h+</span>
              </div>

              {/* Room Timelines */}
              <div className="space-y-4">
                {/* Sala 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Sala 01 Standard</span>
                    <span>Cap: 180</span>
                  </div>
                  <div className="h-12 bg-muted/20 border border-border rounded relative flex items-center p-1">
                    {/* Session block 1 */}
                    <div className="absolute left-[5%] w-[30%] h-10 bg-primary/20 border border-primary text-primary rounded p-1.5 text-[10px] font-bold flex flex-col justify-center">
                      <span className="truncate">Speed Racer</span>
                      <span className="text-[9px] opacity-80">13:30 - 15:58 • 42%</span>
                    </div>
                    {/* Session block 2 */}
                    <div className="absolute left-[45%] w-[35%] h-10 bg-green-500/20 border border-green-500 text-green-700 dark:text-green-300 rounded p-1.5 text-[10px] font-bold flex flex-col justify-center">
                      <span className="truncate">Chainsaw Man: Reze</span>
                      <span className="text-[9px] opacity-80">17:00 - 19:15 • 78%</span>
                    </div>
                  </div>
                </div>

                {/* Sala 2 4DX */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Sala 02 4DX</span>
                    <span>Cap: 120</span>
                  </div>
                  <div className="h-12 bg-muted/20 border border-border rounded relative flex items-center p-1">
                    <div className="absolute left-[15%] w-[40%] h-10 bg-primary/80 text-white rounded p-1.5 text-[10px] font-bold flex flex-col justify-center shadow">
                      <span className="truncate">Deadpool & Wolverine (4DX)</span>
                      <span className="text-[9px] opacity-90">14:15 - 16:45 • LOTADO 🔥</span>
                    </div>
                    <div className="absolute left-[60%] w-[35%] h-10 bg-primary/20 border border-primary text-primary rounded p-1.5 text-[10px] font-bold flex flex-col justify-center">
                      <span className="truncate">Furiosa 4DX</span>
                      <span className="text-[9px] opacity-80">18:30 - 21:00 • 96%</span>
                    </div>
                  </div>
                </div>

                {/* Sala 4 IMAX (with Conflict highlight) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-red-500">
                    <span>Sala 04 IMAX (CONFLITO DETECTADO)</span>
                    <span>⚠️ 46 min sobreposição</span>
                  </div>
                  <div className="h-14 bg-red-500/5 border-2 border-dashed border-red-500/50 rounded relative flex items-center p-1">
                    {/* Colliding session A */}
                    <div className="absolute left-[30%] w-[42%] h-11 bg-red-500/20 border border-red-500 text-red-700 dark:text-red-300 rounded p-1 text-[9px] font-bold z-10">
                      <span className="truncate block">Duna: Parte 2 (15:30 - 18:40)</span>
                      <span className="text-[8px] opacity-80">IMAX Laser • 240 lugares</span>
                    </div>
                    {/* Colliding session B */}
                    <div className="absolute left-[60%] w-[35%] h-11 bg-amber-500/30 border border-amber-500 text-amber-900 dark:text-amber-200 rounded p-1 text-[9px] font-bold opacity-90 z-20">
                      <span className="truncate block">Deadpool (17:54 - 20:10)</span>
                      <span className="text-[8px] text-red-600 font-black">COLISÃO AQUI ⚠️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-[11px] pt-3 border-t border-border text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/20 border border-primary" /> Agendada</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary" /> Lotada / Em Alta</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" /> Conflito</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted" /> Intervalo / Troca</div>
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm space-y-3">
              <h3 className="font-black text-base">Tabela Operacional de Sessões</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Filme</th>
                      <th className="p-2">Sala</th>
                      <th className="p-2">Horário</th>
                      <th className="p-2">Formato</th>
                      <th className="p-2">Ocupação</th>
                      <th className="p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-bold">Speed Racer</td>
                      <td className="p-2">Sala 01</td>
                      <td className="p-2 font-mono">13:30</td>
                      <td className="p-2"><Badge variant="outline">2D DUB</Badge></td>
                      <td className="p-2 font-semibold text-green-600">42% (75/180)</td>
                      <td className="p-2 flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><PencilSimple size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy size={14} /></Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-bold">Deadpool & Wolverine</td>
                      <td className="p-2">Sala 02</td>
                      <td className="p-2 font-mono">14:15</td>
                      <td className="p-2"><Badge variant="default">4DX 3D</Badge></td>
                      <td className="p-2 font-black text-primary">100% (120/120)</td>
                      <td className="p-2 flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><PencilSimple size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy size={14} /></Button>
                      </td>
                    </tr>
                    <tr className="bg-red-500/10 hover:bg-red-500/15">
                      <td className="p-2 font-bold text-red-600">Duna: Parte 2 (Conflito)</td>
                      <td className="p-2">Sala 04</td>
                      <td className="p-2 font-mono">15:30</td>
                      <td className="p-2"><Badge variant="destructive">IMAX Laser</Badge></td>
                      <td className="p-2 font-bold text-amber-500">88% (211/240)</td>
                      <td className="p-2">
                        <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => setShowConflictModal(true)}>
                          Resolver
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Session Drawer / Selected Detail (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <Badge variant="default" className="mb-1">DETALHES DA SESSÃO</Badge>
                <h4 className="font-black text-base">Speed Racer (2008)</h4>
                <p className="text-xs text-muted-foreground">Sala 01 • Hoje às 19:30</p>
              </div>
            </div>

            {/* 2x2 Financials & Projection Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Faturamento</span>
                <p className="text-sm font-black text-primary">R$ 2.850,00</p>
                <span className="text-[10px] text-green-600 font-semibold">↑ +14% vs meta</span>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Projeção 100%</span>
                <p className="text-sm font-black text-foreground">R$ 6.840,00</p>
                <span className="text-[10px] text-muted-foreground">180 ingressos</span>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Cancelamentos</span>
                <p className="text-sm font-black text-foreground">2 (R$ 76)</p>
                <span className="text-[10px] text-muted-foreground">Taxa 1.1%</span>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Preço Unitário</span>
                <p className="text-sm font-black text-foreground">R$ 38,00</p>
                <span className="text-[10px] text-muted-foreground">Inteira padrão</span>
              </div>
            </div>

            {/* Mini Seat Occupancy Map */}
            <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1"><Armchair size={15} /> Mapa Rápido</span>
                <span className="text-primary">75 ocupados / 105 livres</span>
              </div>
              <div className="grid grid-cols-8 gap-1 py-2">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-sm ${
                      i % 3 === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <PencilSimple size={14} className="mr-1" /> Editar Horário e Sala
              </Button>
              <Button variant="destructive" size="sm" className="w-full text-xs">
                <Trash size={14} className="mr-1" /> Cancelar Sessão com Estorno
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-red-500 max-w-xl w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2 text-red-500 font-black text-lg">
                <Warning size={22} weight="fill" />
                <span>Resolução de Conflito de Horário</span>
              </div>
              <button onClick={() => setShowConflictModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs space-y-1">
              <p className="font-bold text-red-600">Sobreposição de 46 minutos detectada na Sala 04 IMAX:</p>
              <p className="text-muted-foreground">O término de Duna: Parte 2 colide com o início agendado de Deadpool & Wolverine.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <span className="font-bold text-primary">Sessão A (Em Venda)</span>
                <p className="font-black text-sm">Duna: Parte 2</p>
                <p className="text-muted-foreground">15:30 às 18:40 (211 ingressos vendidos)</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <span className="font-bold text-amber-500">Sessão B (Conflitante)</span>
                <p className="font-black text-sm">Deadpool & Wolverine</p>
                <p className="text-muted-foreground">17:54 às 20:10 (0 ingressos vendidos)</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Ações Recomendadas:</p>
              <Button className="w-full text-xs font-bold" onClick={() => setShowConflictModal(false)}>
                Mover Deadpool para 19:00 (Ajuste Automático com 20 min de Limpeza)
              </Button>
              <Button variant="outline" className="w-full text-xs" onClick={() => setShowConflictModal(false)}>
                Transferir Deadpool para a Sala 02 4DX
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">Criar Nova Sessão</h3>
              <button onClick={() => setShowNewSessionModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Filme:</label>
                <select className="w-full bg-background border border-border p-2 rounded-lg">
                  <option>Speed Racer (2008) - 148 min</option>
                  <option>Duna: Parte 2 (2024) - 166 min</option>
                  <option>Parasita (2019) - 132 min</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Sala:</label>
                  <select className="w-full bg-background border border-border p-2 rounded-lg">
                    <option>Sala 01 Standard</option>
                    <option>Sala 02 4DX</option>
                    <option>Sala 03 VIP</option>
                    <option>Sala 04 IMAX</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Horário de Início:</label>
                  <input type="time" defaultValue="19:30" className="w-full bg-background border border-border p-2 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Preço do Ingresso (R$):</label>
                <input type="number" defaultValue="38.00" className="w-full bg-background border border-border p-2 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewSessionModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 font-bold" onClick={() => setShowNewSessionModal(false)}>
                Salvar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
