import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowSquareOut,
  Sun,
  Moon,
  CaretDown,
  SignOut,
} from '@phosphor-icons/react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import logoFull from '../assets/logos/logo-full.svg';

export function AdminLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const selectedCinemaId = searchParams.get('cinemaId') || MOCK_CINEMAS[0]?.id || '';
  const managementPath = (path: string) => `${path}?cinemaId=${encodeURIComponent(selectedCinemaId)}`;

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const isCinemas = location.pathname.startsWith('/management/cinemas');
  const isSchedule = (location.pathname.startsWith('/management') || location.pathname.startsWith('/management/schedule')) && !isCinemas;
  const isStats = location.pathname.startsWith('/statistics') || location.pathname.startsWith('/management/stats');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-display selection:bg-secondary selection:text-secondary-foreground">
      
      {/* ─── DEDICATED B2B ADMIN HEADER ─── */}
      <header className="z-40 h-16 shrink-0 border-b-2 border-foreground/30 bg-[#1A2744] px-4 text-white sm:px-12">
        <div className="mx-auto grid h-full w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:max-w-5xl lg:max-w-6xl sm:px-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link to={managementPath('/management/cinemas')} className="group flex shrink-0 items-center">
              <img src={logoFull} alt="screeK" className="h-6 w-auto" />
            </Link>
          </div>

          <nav className="flex h-full items-center justify-center gap-1 sm:gap-3 xl:gap-6">
            <Link
              to={managementPath('/management/cinemas')}
              className={`flex h-full items-center border-y-4 px-2 text-[10px] font-display font-extrabold uppercase tracking-wider transition-colors sm:px-3 sm:text-xs ${isCinemas ? 'border-secondary text-secondary' : 'border-transparent text-white/55 hover:text-white'}`}
            >
              Cinema
            </Link>
            <Link
              to={managementPath('/management/schedule')}
              className={`flex h-full items-center border-y-4 px-2 text-[10px] font-display font-extrabold uppercase tracking-wider transition-colors sm:px-3 sm:text-xs ${isSchedule ? 'border-secondary text-secondary' : 'border-transparent text-white/55 hover:text-white'}`}
            >
              Sessões
            </Link>
            <Link
              to={managementPath('/statistics')}
              className={`flex h-full items-center border-y-4 px-2 text-[10px] font-display font-extrabold uppercase tracking-wider transition-colors sm:px-3 sm:text-xs ${isStats ? 'border-secondary text-secondary' : 'border-transparent text-white/55 hover:text-white'}`}
            >
              Métricas
            </Link>
          </nav>

          {/* Right: Quick actions, Status, Theme & Admin Profile */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
          
          {/* Public App Switch */}
          <Link
            to="/"
            className="hidden border border-white/20 p-1.5 text-white/70 transition-colors hover:border-white/40 hover:text-secondary md:flex"
            title="Voltar para a experiência do usuário"
            aria-label="Ir para o app público"
          >
            <ArrowSquareOut size={17} weight="bold" />
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-white/30 text-white/70 transition-colors hover:border-secondary hover:text-secondary"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={15} weight="bold" className="text-warning" /> : <Moon size={15} weight="bold" className="text-primary" />}
          </button>

          {/* Admin Avatar Badge */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-expanded={isUserMenuOpen}
              className="flex cursor-pointer items-center gap-2 border-2 border-white/30 bg-transparent px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.35)] transition-colors hover:border-secondary"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/40 bg-white/10 text-[10px] font-black text-white">
                {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user?.username.slice(0, 2).toUpperCase() || 'AD'}
              </span>
              <span className="hidden max-w-24 truncate text-xs font-black uppercase tracking-wider text-white sm:block">{user?.username || 'Operador'}</span>
              <CaretDown size={14} weight="bold" className={`text-white/70 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 border-2 border-foreground/40 bg-background py-1 text-foreground shadow-[4px_4px_0px_0px_var(--border)]">
                <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-xs font-bold hover:bg-muted">Meu perfil</Link>
                <button type="button" onClick={() => { setIsUserMenuOpen(false); logout(); }} className="flex w-full items-center gap-2 border-t border-foreground/10 px-4 py-2 text-left text-xs font-bold text-destructive hover:bg-destructive/10">
                  <SignOut size={14} weight="bold" /> Sair
                </button>
              </div>
            )}
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
