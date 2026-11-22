import { useState } from 'react';
import {
  Flame,
  Lightbulb,
  WarningCircle,
  DownloadSimple,
  CaretDown
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  LineChartPlaceholder,
  BarChartPlaceholder,
  DonutsChartPlaceholder,
  ScatterplotPlaceholder
} from '../components/custom/charts';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const TIME_BUCKETS = ['10-14h', '14-16h', '16-18h', '18-20h', '20-22h', '22-00h', '00-02h'];

const HEATMAP_MATRIX = [
  // Seg
  [null, '28%', '34%', '52%', '66%', '71%', '44%'],
  // Ter
  [null, '28%', '34%', '52%', '66%', '71%', '44%'],
  // Qua
  ['30%', '48%', '57%', '70%', '84%', '88%', '61%'],
  // Qui
  ['35%', '52%', '62%', '79%', '87%', '90%', '68%'],
  // Sex
  ['55%', '72%', '85%', '96%', '100%', '100%', '89%'],
  // Sáb
  ['64%', '80%', '88%', '98%', '100%', '100%', '92%'],
  // Dom
  ['48%', '65%', '78%', '84%', '95%', '88%', '72%'],
];

const TOP_MOVIES = [
  { rank: 1, title: 'Duna: Parte II', genre: 'Ficção · 2h46', revenue: 'R$95k', tickets: '1.842', share: '40%', occupancy: '88%' },
  { rank: 2, title: 'Deadpool & W.', genre: 'Ação · 2h07', revenue: 'R$78k', tickets: '1.390', share: '33%', occupancy: '96%' },
  { rank: 3, title: 'Alien: Romulus', genre: 'Terror · 1h59', revenue: 'R$38k', tickets: '842', share: '16%', occupancy: '62%' },
  { rank: 4, title: 'Conclave', genre: 'Suspense · 2h01', revenue: 'R$26k', tickets: '561', share: '11%', occupancy: '78%' },
  { rank: 5, title: 'Furiosa', genre: 'Ação · 2h28', revenue: 'R$18k', tickets: '310', share: '7%', occupancy: '39%' },
];

export function ManagementStatistics() {
  const [period, setPeriod] = useState<'Hoje' | 'Semana' | 'Mês' | 'Ano' | 'Custom'>('Semana');

  const getHeatmapBg = (val: string | null) => {
    if (!val) return 'bg-muted/20 text-foreground/30';
    const num = parseInt(val);
    if (num === 100) return 'bg-[#8B1A4A] text-white font-black';
    if (num >= 85) return 'bg-[#8B1A4A]/80 text-white font-bold';
    if (num >= 70) return 'bg-[#D4A373]/80 text-foreground font-bold';
    if (num >= 50) return 'bg-[#A3B18A] text-foreground font-bold';
    return 'bg-[#CCD5AE]/60 text-foreground/80';
  };

  const handleExport = () => {
    toast.success('Relatório CSV de performance exportado com sucesso!');
  };

  return (
    <div className="flex-1 bg-background text-foreground font-display">
      {/* ─── CONTROLS BAR ─── */}
      <div className="bg-background border-b-2 border-foreground/20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period buttons */}
          <div className="flex items-center border-2 border-foreground/30 bg-background overflow-hidden shadow-[2px_2px_0px_0px_var(--border)]">
            {(['Hoje', 'Semana', 'Mês', 'Ano', 'Custom'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 font-black uppercase transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground/70'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Cinema dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)] font-bold uppercase cursor-pointer">
            <span>Cinemark Bourbon</span>
            <CaretDown size={14} weight="bold" />
          </div>

          {/* Rooms dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)] font-bold uppercase cursor-pointer">
            <span>Todas as salas</span>
            <CaretDown size={14} weight="bold" />
          </div>
        </div>

        {/* Right date range + export */}
        <div className="flex items-center gap-3">
          <span className="text-foreground/60 font-sans text-xs hidden sm:inline">
            Mostrando <strong>25–31 mar 2024</strong> · 84 sessões · 4 salas
          </span>

          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 bg-background hover:bg-muted border-2 border-foreground/30 text-foreground font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <DownloadSimple size={15} weight="bold" />
            <span>Exportar CSV</span>
          </button>
        </div>

      </div>

      {/* ─── 3. MAIN DASHBOARD CONTENT ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {/* ── SECTION 1: KPIS DA SEMANA ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              KPIs da Semana
            </h2>
            <span className="text-xs font-sans text-foreground/50">
              25–31 mar 2024 vs. 18–24 mar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* KPI 1 */}
            <div className="bg-background border-4 border-foreground/40 p-4 space-y-1 shadow-[4px_4px_0px_0px_var(--border)]">
              <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block">FATURAMENTO</span>
              <h3 className="text-2xl font-mono font-black text-primary leading-tight">R$48.3k</h3>
              <div className="flex items-center gap-1 text-[#34A853] text-[11px] font-mono font-bold">
                <span>↑ +12.4%</span>
                <span className="text-foreground/40 font-normal">vs. R$43k</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-background border-4 border-foreground/40 p-4 space-y-1 shadow-[4px_4px_0px_0px_var(--border)]">
              <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block">INGRESSOS</span>
              <h3 className="text-2xl font-mono font-black text-secondary leading-tight">3.412</h3>
              <div className="flex items-center gap-1 text-[#34A853] text-[11px] font-mono font-bold">
                <span>↑ +8.1%</span>
                <span className="text-foreground/40 font-normal">vs. 3.157</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-background border-4 border-foreground/40 p-4 space-y-1 shadow-[4px_4px_0px_0px_var(--border)]">
              <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block">OCUPAÇÃO MÉDIA</span>
              <h3 className="text-2xl font-mono font-black text-foreground leading-tight">73%</h3>
              <div className="flex items-center gap-1 text-[#34A853] text-[11px] font-mono font-bold">
                <span>↑ +5.2pp</span>
                <span className="text-foreground/40 font-normal">vs. 67.8%</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-background border-4 border-foreground/40 p-4 space-y-1 shadow-[4px_4px_0px_0px_var(--border)]">
              <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block">TICKET MÉDIO</span>
              <h3 className="text-2xl font-mono font-black text-primary leading-tight">R$41</h3>
              <div className="flex items-center gap-1 text-[#34A853] text-[11px] font-mono font-bold">
                <span>↑ +R$3</span>
                <span className="text-foreground/40 font-normal">vs. R$38</span>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="bg-background border-4 border-foreground/40 p-4 space-y-1 shadow-[4px_4px_0px_0px_var(--border)]">
              <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block">SESSÕES</span>
              <h3 className="text-2xl font-mono font-black text-foreground leading-tight">84</h3>
              <div className="flex items-center gap-1 text-foreground/50 text-[11px] font-mono font-bold">
                <span>↓ -2</span>
                <span className="text-foreground/40 font-normal">vs. 86</span>
              </div>
            </div>

          </div>

          {/* 3 Insight Banners (Figma Exact) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Banner 1 (Atenção / Pink) */}
            <div className="p-3.5 bg-secondary/10 border-2 border-secondary/40 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-black uppercase text-secondary">
                <WarningCircle size={16} weight="fill" />
                <span>Atenção: queda de vendas</span>
              </div>
              <p className="font-sans text-[11px] text-foreground/80 leading-snug">
                Alien: Romulus com 52% abaixo do esperado. Avalie cancelar sessões de baixa demanda nas manhãs.
              </p>
            </div>

            {/* Banner 2 (Melhor desempenho / Green) */}
            <div className="p-3.5 bg-[#34A853]/10 border-2 border-[#34A853]/40 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-black uppercase text-[#34A853]">
                <Flame size={16} weight="fill" />
                <span>Melhor desempenho da semana</span>
              </div>
              <p className="font-sans text-[11px] text-foreground/80 leading-snug">
                Duna II no IMAX atingiu 98% de ocupação nas últimas 5 sessões. Considere adicionar mais horários.
              </p>
            </div>

            {/* Banner 3 (Oportunidade / Amber) */}
            <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/40 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-black uppercase text-amber-700 dark:text-amber-400">
                <Lightbulb size={16} weight="fill" />
                <span>Oportunidade detectada</span>
              </div>
              <p className="font-sans text-[11px] text-foreground/80 leading-snug">
                Terças à tarde têm ocupação 34% abaixo da média. Sessões especiais ou promoções podem reverter.
              </p>
            </div>

          </div>
        </section>

        {/* ── SECTION 2: SÉRIE HISTÓRICA (COMPONENTS CHART RECHARTS) ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Série Histórica
            </h2>
            <span className="text-xs font-sans text-foreground/50">
              Faturamento e volume de ingressos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartPlaceholder />
            <BarChartPlaceholder />
          </div>
        </section>

        {/* ── SECTION 3: HEATMAP & DISTRIBUIÇÃO POR SALA (FIGMA EXACT) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Heatmap */}
          <div className="lg:col-span-7 bg-background border-4 border-foreground/40 p-5 space-y-4 shadow-[4px_4px_0px_0px_var(--border)]">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
              <h3 className="font-black uppercase text-sm text-foreground">Heatmap de Ocupação</h3>
              <span className="text-xs font-mono text-foreground/50">Taxa %</span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <table className="w-full min-w-[480px] text-center border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-1.5 text-left text-[11px] font-black uppercase text-foreground/50">Dia</th>
                    {TIME_BUCKETS.map((tb) => (
                      <th key={tb} className="p-1.5 text-[10px] font-mono font-bold text-foreground/60">
                        {tb}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dIdx) => (
                    <tr key={day} className="border-t border-foreground/5">
                      <td className="p-1.5 text-left font-black uppercase text-foreground text-xs">{day}</td>
                      {HEATMAP_MATRIX[dIdx].map((val, bIdx) => (
                        <td key={bIdx} className="p-1">
                          <div className={`py-2 px-1 text-[11px] font-mono rounded ${getHeatmapBg(val)}`}>
                            {val || '—'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-foreground/10 text-[10px] font-sans text-foreground/60">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-muted/30 border" />
                <span>Sem sessão</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#CCD5AE]" />
                <span>&lt;40%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#A3B18A]" />
                <span>40–60%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#D4A373]" />
                <span>60–80%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#8B1A4A]/80" />
                <span>80–95%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#8B1A4A]" />
                <span>Lotada</span>
              </div>
            </div>
          </div>

          {/* Right Distribution (Donut Recharts) */}
          <div className="lg:col-span-5 space-y-4">
            <DonutsChartPlaceholder />
          </div>

        </section>

        {/* ── SECTION 4: RANKINGS & QUADRANTES DE EFICIÊNCIA ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Rankings e Eficiência
            </h2>
            <span className="text-xs font-sans text-foreground/50">
              Por filme, sala e padrão de sessão
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Top Movies Table */}
            <div className="lg:col-span-7 bg-background border-4 border-foreground/40 p-5 space-y-4 shadow-[4px_4px_0px_0px_var(--border)]">
              <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
                <h3 className="font-black uppercase text-sm text-foreground">Top Filmes</h3>
                <span className="text-xs text-foreground/50 uppercase font-bold">Ver todos →</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/10 text-[10px] font-black uppercase text-foreground/50">
                      <th className="p-2">#</th>
                      <th className="p-2">FILME</th>
                      <th className="p-2">RECEITA ↓</th>
                      <th className="p-2">INGR.</th>
                      <th className="p-2">PART.</th>
                      <th className="p-2">OCU.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 font-sans">
                    {TOP_MOVIES.map((movie) => (
                      <tr key={movie.rank} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2 font-mono font-bold text-foreground/40">{movie.rank}</td>
                        <td className="p-2 font-display">
                          <span className="font-black uppercase block text-xs">{movie.title}</span>
                          <span className="text-[10px] text-foreground/50 font-sans">{movie.genre}</span>
                        </td>
                        <td className="p-2 font-mono font-black text-primary">{movie.revenue}</td>
                        <td className="p-2 font-mono text-foreground/70">{movie.tickets}</td>
                        <td className="p-2 font-mono text-foreground/70">{movie.share}</td>
                        <td className="p-2 font-mono font-bold text-[#34A853]">{movie.occupancy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scatterplot Quadrant Component */}
            <div className="lg:col-span-5">
              <ScatterplotPlaceholder />
            </div>

          </div>
        </section>

      </main>

    </div>
  );
}
