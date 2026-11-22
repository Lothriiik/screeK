import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  CalendarBlank,
  ChartBar,
  Buildings,
  ArrowSquareOut,
  Sun,
  Moon
} from '@phosphor-icons/react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

export function AdminLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useThemeStore();

  const isCinemas = location.pathname.startsWith('/management/cinemas');
  const isSchedule = (location.pathname.startsWith('/management') || location.pathname.startsWith('/management/schedule')) && !isCinemas;
  const isStats = location.pathname.startsWith('/statistics') || location.pathname.startsWith('/management/stats');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-display selection:bg-secondary selection:text-secondary-foreground">
      
      {/* ─── DEDICATED B2B ADMIN HEADER ─── */}
      <header className="bg-[#1A2744] text-white border-b-2 border-foreground/30 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4 z-40 shrink-0">
        
        {/* Left: Brand & Main Admin Navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          
          <Link to="/management/cinemas" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary text-primary-foreground font-black text-sm flex items-center justify-center border border-white/20 shadow-sm shrink-0">
              SK
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-white group-hover:text-primary transition-colors leading-none">
                screeK B2B
              </span>
              <span className="text-[10px] text-white/50 font-sans leading-tight">
                Painel do Cinema
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <Link
              to="/management/cinemas"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase flex items-center gap-1.5 transition-all border ${
                isCinemas
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                  : 'text-white/70 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <Buildings size={15} weight="bold" />
              <span>Cinemas &amp; Salas</span>
            </Link>

            <Link
              to="/management/schedule"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase flex items-center gap-1.5 transition-all border ${
                isSchedule
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                  : 'text-white/70 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <CalendarBlank size={15} weight="bold" />
              <span>Sessões</span>
            </Link>

            <Link
              to="/statistics"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase flex items-center gap-1.5 transition-all border ${
                isStats
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                  : 'text-white/70 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <ChartBar size={15} weight="bold" />
              <span>BI / Métricas</span>
            </Link>
          </nav>

        </div>

        {/* Right: Quick actions, Status, Theme & Admin Profile */}
        <div className="flex items-center gap-3">
          
          {/* Public App Switch */}
          <Link
            to="/"
            className="px-2.5 py-1 text-[11px] font-bold text-white/70 hover:text-white flex items-center gap-1 border border-white/20 hover:border-white/40 transition-colors hidden md:flex"
            title="Voltar para a experiência do usuário"
          >
            <span>Ir para o App Público</span>
            <ArrowSquareOut size={13} weight="bold" />
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-white/70 hover:text-white border border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={15} weight="bold" className="text-warning" /> : <Moon size={15} weight="bold" className="text-primary" />}
          </button>

          {/* Admin Avatar Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            <div className="w-7 h-7 bg-secondary text-secondary-foreground font-black text-xs flex items-center justify-center border border-white/30">
              {user ? user.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-black uppercase leading-tight text-white">
                {user ? user.username : 'Gerente Operacional'}
              </span>
              <span className="text-[9px] text-[#34A853] font-bold leading-none flex items-center gap-1">
                ● Operador Ativo
              </span>
            </div>
          </div>

        </div>

      </header>

      {/* ─── MAIN CONTENT AREA (WITHOUT CONSUMER FOOTER) ─── */}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>

    </div>
  );
}
