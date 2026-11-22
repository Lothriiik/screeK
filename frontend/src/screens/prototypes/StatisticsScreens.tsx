import { useState } from 'react';
import {
  Sparkle,
  DownloadSimple,
  Warning,
  Trophy
} from '@phosphor-icons/react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { KPICard } from '../../components/custom/analytics-charts';

export function StatisticsScreens() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week');

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-card border-2 border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Dashboard BI & Performance</h2>
            <Badge variant="default" className="text-[10px]">● Atualizado em tempo real</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Mostrando 25–31 Março • 84 sessões realizadas • 4 salas ativas</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-bold rounded capitalize transition-all ${
                  period === p ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="text-xs">
            <DownloadSimple size={15} className="mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* 5 Official KPICards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          title="FATURAMENTO"
          value="R$ 48.350"
          change="+12.4%"
          isPositive={true}
        />
        <KPICard
          title="INGRESSOS"
          value="3.412"
          change="+8.1%"
          isPositive={true}
        />
        <KPICard
          title="OCUPAÇÃO MÉDIA"
          value="73.2%"
          change="+5.2pp"
          isPositive={true}
        />
        <KPICard
          title="TICKET MÉDIO"
          value="R$ 41,20"
          change="+R$ 3,20"
          isPositive={true}
        />
        <KPICard
          title="SESSÕES ATIVAS"
          value="84"
          change="4 salas"
          isPositive={true}
        />
      </div>

      {/* 3 Automated Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-primary/10 border-2 border-primary/40 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase">
            <Sparkle size={16} weight="fill" />
            Destaque de Alta Demanda
          </div>
          <h4 className="font-bold text-sm">Duna: Parte 2 (IMAX Laser)</h4>
          <p className="text-xs text-muted-foreground">Ocupação de 98% nas sessões noturnas. Recomendado abrir sessão extra às 22:30.</p>
        </div>

        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-amber-600 font-black text-xs uppercase">
            <Warning size={16} weight="fill" />
            Atenção: Horário Ocioso
          </div>
          <h4 className="font-bold text-sm">Terça-feira à Tarde (14h-17h)</h4>
          <p className="text-xs text-muted-foreground">Ocupação de apenas 28%. Recomendado aplicar promoção 'Quarta/Terça Mais Cinema'.</p>
        </div>

        <div className="p-4 bg-green-500/10 border-2 border-green-500/40 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-green-600 font-black text-xs uppercase">
            <Trophy size={16} weight="fill" />
            Sucesso de Formato 4DX
          </div>
          <h4 className="font-bold text-sm">Deadpool & Wolverine 4DX</h4>
          <p className="text-xs text-muted-foreground">Ticket médio de R$ 56,00 gerando 28% do faturamento total do cinema.</p>
        </div>
      </div>

      {/* Charts Grid: Daily Revenue SVG curve + Daily Tickets Vertical Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Interactive SVG Chart */}
        <div className="bg-card border-2 border-border p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h3 className="font-black text-base">Receita Diária da Semana</h3>
              <p className="text-xs text-muted-foreground">Pico na Sexta-feira: R$ 11.240 ★</p>
            </div>
            <Badge variant="secondary">+12.4% vs anterior</Badge>
          </div>

          {/* SVG Line & Gradient Curve */}
          <div className="h-52 w-full pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary, #EB2F61)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary, #EB2F61)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
              <line x1="0" y1="160" x2="600" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />

              {/* Area fill under curve */}
              <polygon
                points="0,170 85,150 170,140 255,145 340,110 425,30 510,70 600,100 600,190 0,190"
                fill="url(#revenueGrad)"
              />

              {/* Main Line curve */}
              <polyline
                points="0,170 85,150 170,140 255,145 340,110 425,30 510,70 600,100"
                fill="none"
                stroke="var(--primary, #EB2F61)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Dots on points */}
              {[
                { x: 0, y: 170, val: 'R$ 4.2k' },
                { x: 85, y: 150, val: 'R$ 4.8k' },
                { x: 170, y: 140, val: 'R$ 5.1k' },
                { x: 255, y: 145, val: 'R$ 5.0k' },
                { x: 340, y: 110, val: 'R$ 7.4k' },
                { x: 425, y: 30, val: 'R$ 11.2k ★' },
                { x: 510, y: 70, val: 'R$ 9.8k' },
                { x: 600, y: 100, val: 'R$ 8.2k' },
              ].map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill="var(--primary, #EB2F61)" stroke="#fff" strokeWidth="2" />
                </g>
              ))}
            </svg>
          </div>

          {/* Days label axis */}
          <div className="grid grid-cols-7 text-[11px] font-bold text-muted-foreground text-center pt-2">
            <span>Seg (4.2k)</span>
            <span>Ter (4.8k)</span>
            <span>Qua (5.1k)</span>
            <span>Qui (7.4k)</span>
            <span className="text-primary font-black">Sex (11.2k)</span>
            <span>Sáb (9.8k)</span>
            <span>Dom (8.2k)</span>
          </div>
        </div>

        {/* 7x7 Occupancy Heatmap */}
        <div className="bg-card border-2 border-border p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h3 className="font-black text-base">Heatmap de Ocupação por Horário</h3>
              <p className="text-xs text-muted-foreground">Densidade de público por dia da semana e faixa horária</p>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase">
                  <th className="p-1">Hora</th>
                  <th className="p-1">Seg</th>
                  <th className="p-1">Ter</th>
                  <th className="p-1">Qua</th>
                  <th className="p-1">Qui</th>
                  <th className="p-1">Sex</th>
                  <th className="p-1">Sáb</th>
                  <th className="p-1">Dom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  { hour: '12h-14h', values: [15, 18, 22, 30, 45, 60, 55] },
                  { hour: '14h-16h', values: [25, 28, 35, 42, 65, 80, 75] },
                  { hour: '16h-18h', values: [35, 38, 48, 55, 82, 92, 88] },
                  { hour: '18h-20h', values: [55, 60, 70, 85, 98, 100, 95] },
                  { hour: '20h-22h', values: [65, 72, 80, 92, 100, 98, 90] },
                  { hour: '22h+', values: [40, 45, 50, 68, 88, 85, 70] },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-1 font-mono text-[10px] text-muted-foreground">{row.hour}</td>
                    {row.values.map((v, i) => {
                      const bg =
                        v >= 90
                          ? 'bg-primary text-white font-black'
                          : v >= 70
                          ? 'bg-primary/60 text-white font-bold'
                          : v >= 50
                          ? 'bg-amber-500/50 text-foreground font-semibold'
                          : v >= 30
                          ? 'bg-muted/60 text-muted-foreground'
                          : 'bg-muted/20 text-muted-foreground/50';
                      return (
                        <td key={i} className="p-1">
                          <div className={`py-1 rounded text-[10px] ${bg}`}>{v}%</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border">
            <span>Legenda:</span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-muted/20" /> &lt;30%</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-500/50" /> 50%</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-primary" /> 90%+ Lotado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
