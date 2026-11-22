import { useState } from 'react';
import {
  FilmStrip,
  Sparkle,
  Ticket,
  CalendarBlank,
  ChartBar
} from '@phosphor-icons/react';
import { Badge } from '../components/ui/badge';
import { UserAppScreens } from './prototypes/UserAppScreens';
import { ManagementScreens } from './prototypes/ManagementScreens';
import { StatisticsScreens } from './prototypes/StatisticsScreens';
import { IntelligenceScreens } from './prototypes/IntelligenceScreens';

type MasterModule = 'user_app' | 'management' | 'statistics' | 'intelligence';

export function ScreenPrototypes() {
  const [activeModule, setActiveModule] = useState<MasterModule>('user_app');

  const modules = [
    {
      id: 'user_app' as const,
      label: '1. App screeK (Telas do Usuário)',
      icon: <Ticket size={16} weight="bold" />,
      desc: 'Home, Sessões, Assentos, Checkout, Ingresso QR, Detalhes, Avaliações, Perfil',
    },
    {
      id: 'management' as const,
      label: '2. Gestão & Operação (Gantt)',
      icon: <CalendarBlank size={16} weight="bold" />,
      desc: 'Timetable Gantt, Conflitos de Sala, Tabela de Sessões e Drawer Financeiro',
    },
    {
      id: 'statistics' as const,
      label: '3. BI & Estatísticas (Heatmap)',
      icon: <ChartBar size={16} weight="bold" />,
      desc: 'KPIs, Curva de Receita SVG, Heatmap 7x7 de Horários e Desempenho de Salas',
    },
    {
      id: 'intelligence' as const,
      label: '4. screeK Intelligence & Onboarding',
      icon: <Sparkle size={16} weight="fill" />,
      desc: 'IA Semântica, Niche Breaker 80/20, Mood NLP, Onboarding e Letterboxd CSV',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Sticky Top Master Hub Navigation */}
      <header className="sticky top-0 z-50 bg-card border-b-2 border-border shadow-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground font-black px-2.5 py-1 text-sm rounded border border-border flex items-center gap-1.5 shadow-sm">
              <FilmStrip size={18} weight="bold" />
              <span>screeK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black leading-none">Protótipos Oficiais de Telas (React + Tailwind)</h1>
                <Badge variant="default" className="text-[10px] px-1.5 py-0">FIGMA REFERENCE</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Todas as telas adaptadas e renderizadas nativamente em componentes React para consulta e design.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
            <span>Módulo Ativo:</span>
            <strong className="text-primary uppercase">{activeModule.replace('_', ' ')}</strong>
          </div>
        </div>

        {/* Master Module Selector Tabs */}
        <div className="max-w-7xl mx-auto mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {modules.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                    : 'border-border bg-card/60 hover:bg-card hover:border-primary/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {mod.icon}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {mod.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {mod.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {activeModule === 'user_app' && <UserAppScreens />}
        {activeModule === 'management' && <ManagementScreens />}
        {activeModule === 'statistics' && <StatisticsScreens />}
        {activeModule === 'intelligence' && <IntelligenceScreens />}
      </main>
    </div>
  );
}
