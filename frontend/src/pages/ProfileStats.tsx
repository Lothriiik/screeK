import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartBar, Clock, FilmStrip, ShareNetwork, Star, TrendUp } from '@phosphor-icons/react';
import { ShareableStoryModal } from '../components/custom/shareable-story-modal';
import { MOCK_STATS_ALL_TIME, MOCK_STATS_MONTH, MOCK_STATS_WEEK } from '../mocks/stats';
import type { PeriodStats } from '../types/stats';

type StatsPeriod = 'week' | 'month' | 'all';

const PERIODS: Record<StatsPeriod, PeriodStats> = {
  week: MOCK_STATS_WEEK,
  month: MOCK_STATS_MONTH,
  all: MOCK_STATS_ALL_TIME,
};

export function ProfileStats() {
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const stats = PERIODS[period];
  const maxGenreCount = Math.max(...stats.top_genres.map((item) => item.count));

  return (
    <div className="bg-background text-foreground font-display">
      <header className="border-b-4 border-foreground/30 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[11px] font-black uppercase tracking-widest text-primary">Diário cinéfilo</span>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-5xl">Minhas estatísticas</h1>
            <p className="mt-2 max-w-xl font-sans text-sm text-foreground/65">Um retrato do que você tem visto, avaliado e revisitado.</p>
          </div>
          <button type="button" onClick={() => setIsStoryOpen(true)} className="inline-flex items-center gap-2 self-start border-2 border-foreground bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground shadow-[3px_3px_0px_0px_var(--border)] sm:self-auto">
            <ShareNetwork size={16} weight="bold" /> Compartilhar período
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        <div className="flex gap-2 overflow-x-auto border-b-2 border-foreground/15 pb-2">
          {(['week', 'month', 'all'] as StatsPeriod[]).map((key) => (
            <button key={key} type="button" onClick={() => setPeriod(key)} className={`whitespace-nowrap border-2 px-4 py-2 text-xs font-black uppercase ${period === key ? 'border-primary bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]' : 'border-transparent text-foreground/60 hover:border-foreground/30'}`}>
              {key === 'week' ? 'Esta semana' : key === 'month' ? 'Este mês' : 'Geral'}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Filmes', value: stats.total_movies, icon: FilmStrip },
            { label: 'Horas no cinema', value: `${stats.total_hours}h`, icon: Clock },
            { label: 'Nota média', value: stats.average_rating.toFixed(1), icon: Star },
            { label: 'Período', value: period === 'all' ? 'Histórico' : period === 'month' ? 'Set/26' : 'Semana', icon: TrendUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border-4 border-foreground/35 bg-card p-4 shadow-[4px_4px_0px_0px_var(--border)]">
              <Icon size={22} weight="bold" className="mb-5 text-primary" />
              <strong className="block text-2xl font-black">{value}</strong>
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-foreground/55">{label}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="border-4 border-foreground/35 bg-card p-5 shadow-[6px_6px_0px_0px_var(--border)]">
            <div className="mb-5 flex items-center justify-between">
              <div><span className="font-mono text-[10px] font-black uppercase text-primary">Preferências</span><h2 className="text-xl font-black uppercase">Gêneros mais vistos</h2></div>
              <ChartBar size={24} weight="bold" />
            </div>
            <div className="space-y-4">
              {stats.top_genres.map((item) => (
                <div key={item.genre}>
                  <div className="mb-1 flex justify-between text-xs font-black uppercase"><span>{item.genre}</span><span>{item.count} filmes · {item.percentage}%</span></div>
                  <div className="h-3 border border-foreground/30 bg-background"><div className="h-full bg-primary" style={{ width: `${(item.count / maxGenreCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-4 border-foreground/35 bg-card p-5 shadow-[6px_6px_0px_0px_var(--border)]">
            <span className="font-mono text-[10px] font-black uppercase text-primary">Onde você assiste</span>
            <h2 className="mb-5 text-xl font-black uppercase">Cinemas favoritos</h2>
            <div className="space-y-3">{stats.top_cinemas.map((item, index) => <div key={item.name} className="flex items-center gap-3 border-b border-foreground/10 pb-3"><span className="font-mono text-sm font-black text-primary">0{index + 1}</span><span className="flex-1 text-sm font-bold">{item.name}</span><span className="font-mono text-xs text-foreground/55">{item.count}</span></div>)}</div>
          </div>
        </section>

        <section className="border-4 border-foreground/35 bg-card p-5 shadow-[6px_6px_0px_0px_var(--border)]">
          <div className="mb-5 flex items-center justify-between"><div><span className="font-mono text-[10px] font-black uppercase text-primary">Últimos registros</span><h2 className="text-xl font-black uppercase">Filmes do período</h2></div><Link to="/profile" className="text-xs font-black uppercase text-primary hover:underline">Ver diário</Link></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">{stats.logs.map((log) => <Link key={log.id} to={`/movies/${log.movie_id}`} className="group"><div className="aspect-[2/3] overflow-hidden border-2 border-foreground/30 bg-muted"><img src={log.movie.poster_url} alt={log.movie.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" /></div><div className="mt-2 truncate text-xs font-black">{log.movie.title}</div><div className="flex items-center gap-1 text-[10px] font-bold text-secondary"><Star size={11} weight="fill" />{log.user_rating.toFixed(1)}</div></Link>)}</div>
        </section>
      </main>

      <ShareableStoryModal isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} mode="grid" logs={stats.logs} title={stats.period_label} />
    </div>
  );
}