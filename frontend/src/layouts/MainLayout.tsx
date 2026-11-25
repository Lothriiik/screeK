import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  MagnifyingGlass, 
  User, 
  SignOut, 
  MapPin,
  YoutubeLogo,
  TwitterLogo,
  InstagramLogo,
  FacebookLogo,
  Sun,
  Moon,
  Ticket,
  Heart,
  CaretUp,
  CaretDown,
  Gear,
  Buildings,
  List as MenuIcon,
  X as XIcon
} from '@phosphor-icons/react';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';
import { useThemeStore } from '../stores/themeStore';
import logoFull from '../assets/logos/logo-full.svg';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Button } from '../components/ui/button';

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const openModal = useAuthModalStore((state) => state.openModal);
  const { theme, toggleTheme } = useThemeStore();

  const [openDropdown, setOpenDropdown] = useState<'cinema' | 'social' | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Arapiraca');
  const [activeFooterTab, setActiveFooterTab] = useState<'cinema' | 'social' | 'politicas' | 'redes' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const path = location.pathname;
  const isCinemaActive = path === '/' || path.startsWith('/movies') || path.startsWith('/cinemas');
  const isSocialActive = path.startsWith('/feed') || path.startsWith('/lists') || path.startsWith('/reviews') || path.startsWith('/users');
  const isBookingFunnel = path.includes('/seats') || path.includes('/checkout');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (menu: 'cinema' | 'social') => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const toggleFooterTab = (tab: 'cinema' | 'social' | 'politicas' | 'redes') => {
    setActiveFooterTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-16 md:pb-0 overflow-x-hidden">
      
      {path !== '/onboarding' && <header className="sticky top-0 z-40 bg-background border-b-2 border-foreground/30 px-4 sm:px-12">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl px-4 sm:px-0 mx-auto flex items-center justify-between w-full h-16 sm:h-16">
          
          <div className="flex md:hidden items-center justify-between w-full">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 text-foreground hover:text-primary transition-colors cursor-pointer"
              title="Abrir Menu"
            >
              <MenuIcon size={26} weight="bold" />
            </button>

            <Link to="/" className="flex items-center">
              <img 
                src={logoFull} 
                alt="screeK Logo" 
                className="h-7 w-auto" 
              />
            </Link>

            <button
              onClick={() => navigate('/search')}
              className="p-1 text-foreground hover:text-primary transition-colors cursor-pointer"
              title="Buscar"
            >
              <MagnifyingGlass size={24} weight="bold" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={logoFull} 
                alt="screeK Logo" 
                className="h-8 sm:h-7 w-auto hover:opacity-90 transition-opacity" 
              />
            </Link>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[145px] min-w-[145px] sm:h-10">
                <MapPin size={16} weight="bold" className="text-foreground/70 mr-1 shrink-0" />
                <SelectValue>{selectedCity}</SelectValue>
              </SelectTrigger>

              <SelectContent>
                {['Arapiraca', 'Maceió', 'Recife', 'São Paulo'].map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav ref={dropdownRef} className="hidden md:flex items-center justify-center gap-8 relative">
            
            {/* Menu Cinema (o que ver e onde) */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('cinema')}
                className={`px-3 py-1 h-16 text-sm font-display font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  isCinemaActive 
                    ? 'text-primary border-y-4 border-primary' 
                    : 'text-foreground/40 border-y-4 border-transparent hover:text-foreground'
                }`}
              >
                CINEMA
              </button>

              {openDropdown === 'cinema' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] z-50 py-2">
                  <Link
                    to="/movies?status=now_playing"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Em Cartaz
                  </Link>
                  <Link
                    to="/movies?status=upcoming"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Em Breve
                  </Link>
                  <Link
                    to="/movies"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Catálogo Geral
                  </Link>
                  <Link
                    to="/cinemas"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Cinemas
                  </Link>
                  <Link
                    to="/tickets/find"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Localizar ingresso
                  </Link>
                  <Link
                    to="/management/request-access"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Sou responsável por um cinema
                  </Link>
                  <div className="h-px bg-foreground/10 my-1" />
                  <Link
                    to="/intelligence"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center justify-between px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-primary hover:text-primary transition-colors"
                  >
                    <span>Para Você</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-primary/20 text-primary font-black">IA</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Menu Social (o que a comunidade está fazendo) */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('social')}
                className={`px-3 py-1 h-16 text-sm font-display font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  isSocialActive 
                    ? 'text-primary border-y-4 border-primary' 
                    : 'text-foreground/40 border-y-4 border-transparent hover:text-foreground'
                }`}
              >
                SOCIAL
              </button>

              {openDropdown === 'social' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] z-50 py-2">
                  <Link
                    to="/feed"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Feed
                  </Link>
                  <Link
                    to="/lists"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Listas
                  </Link>
                  <Link
                    to="/collections"
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-xs font-bold font-display uppercase tracking-wide hover:bg-primary/10 text-foreground/70 hover:text-primary transition-colors"
                  >
                    Coleções
                  </Link>
                </div>
              )}
            </div>

          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
            >
              {theme === 'dark' ? <Sun size={20} weight="bold" className="text-secondary" /> : <Moon size={20} weight="bold" className="text-primary" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/search')}
              title="Buscar Filmes"
            >
              <MagnifyingGlass size={20} weight="bold" className="text-foreground/60" />
            </Button>

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1 bg-background hover:bg-muted/40 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)] transition-all cursor-pointer font-display"
                >
                  <div className="w-7 h-7 border border-foreground/40 overflow-hidden shrink-0 bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-black text-xs uppercase text-foreground tracking-wider">
                    {user.username}
                  </span>
                  {isUserMenuOpen ? (
                    <CaretUp size={14} weight="bold" className="text-foreground/60" />
                  ) : (
                    <CaretDown size={14} weight="bold" className="text-foreground/60" />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-background border-2 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] z-50 overflow-hidden font-display divide-y divide-foreground/10 text-foreground">
                    {/* Header */}
                    <div className="p-3 flex items-center gap-3 bg-muted/20">
                      <div className="w-9 h-9 border-2 border-foreground/40 overflow-hidden shrink-0 bg-muted">
                        <img
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase text-foreground truncate">
                          {user.username === 'lothrik' ? 'Lothrik Junior' : user.username}
                        </h4>
                        <span className="text-[10px] text-foreground/50 font-bold block truncate">
                          @{user.username}
                        </span>
                      </div>
                    </div>

                    {/* Navigation items - O que é meu */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <User size={16} weight="bold" className="text-foreground/60" />
                        <span>Meu Perfil Cinéfilo</span>
                      </Link>

                      <Link
                        to="/tickets"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Ticket size={16} weight="bold" className="text-foreground/60" />
                        <span>Meus Ingressos</span>
                        {/* TODO: Add ticket count badge here */}
                      </Link>

                      <Link
                        to="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Heart size={16} weight="bold" className="text-foreground/60" />
                        <span>Notificações</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Gear size={16} weight="bold" className="text-foreground/60" />
                        <span>Configurações</span>
                      </Link>
                    </div>

                    {/* Painel B2B (apenas para MANAGER e ADMIN) */}
                    {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
                      <div className="py-1">
                        <Link
                          to="/management"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Buildings size={16} weight="bold" className="text-secondary" />
                            <span>Painel do Exibidor</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 bg-secondary/20 text-secondary font-black">B2B</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                      >
                        <SignOut size={16} weight="bold" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openModal('register')}
                >
                  CRIAR CONTA
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openModal('login')}
                >
                  FAZER LOGIN
                </Button>
              </>
            )}

          </div>
        </div>
      </header>}

      {/* Mobile Side Drawer (Menu Hamburguer Lateral) */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-background border-r-4 border-foreground z-50 p-5 flex flex-col justify-between shadow-[10px_10px_0px_0px_var(--border)] overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Top Drawer Header */}
              <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-4">
                <img src={logoFull} alt="screeK Logo" className="h-7 w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border-2 border-foreground p-1 hover:bg-primary/20 text-foreground cursor-pointer shadow-[2px_2px_0px_0px_var(--border)]"
                >
                  <XIcon size={20} weight="bold" />
                </button>
              </div>

              {/* Seleção de Cidade */}
              <div className="space-y-2">
                <label className="text-xs font-display font-extrabold uppercase text-foreground/50">Cidade</label>
                <Select value={selectedCity} onValueChange={(val) => { setSelectedCity(val); setIsMobileMenuOpen(false); }}>
                  <SelectTrigger className="w-full">
                    <MapPin size={16} weight="bold" className="text-foreground/70 mr-1 shrink-0" />
                    <SelectValue>{selectedCity}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {['Arapiraca', 'Maceió', 'Recife', 'São Paulo'].map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modo Claro / Escuro */}
              <div className="space-y-2">
                <label className="text-xs font-display font-extrabold uppercase text-foreground/50">Tema</label>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 border-2 border-foreground bg-card hover:bg-card/80 text-foreground font-display font-bold text-xs uppercase shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun size={18} weight="bold" className="text-warning" /> : <Moon size={18} weight="bold" className="text-primary" />}
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Alternar</span>
                </button>
              </div>

              {/* Links de Navegação - Cinema */}
              <div className="space-y-3 pt-2 border-t-2 border-foreground/10">
                <label className="text-xs font-display font-black uppercase text-foreground/50">Cinema</label>
                <div className="space-y-1">
                  <Link
                    to="/movies?status=now_playing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Em Cartaz
                  </Link>
                  <Link
                    to="/movies?status=upcoming"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Em Breve
                  </Link>
                  <Link
                    to="/movies"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Catálogo Geral
                  </Link>
                  <Link
                    to="/cinemas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Cinemas
                  </Link>
                  <Link
                    to="/tickets/find"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Localizar ingresso
                  </Link>
                  <Link
                    to="/management/request-access"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Sou responsável por um cinema
                  </Link>
                  <div className="h-px bg-foreground/10 my-1" />
                  <Link
                    to="/intelligence"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase text-primary hover:bg-primary/10 transition-colors"
                  >
                    ⚡ Para Você (IA)
                  </Link>
                </div>
              </div>

              {/* Social Navigation */}
              <div className="space-y-3 pt-2 border-t-2 border-foreground/10">
                <label className="text-xs font-display font-black uppercase text-foreground/50">Social</label>
                <div className="space-y-1">
                  <Link
                    to="/feed"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Feed
                  </Link>
                  <Link
                    to="/lists"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Listas
                  </Link>
                  <Link
                    to="/collections"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs font-bold font-display uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                  >
                    Coleções
                  </Link>
                </div>
              </div>

              {/* Painel do Exibidor (B2B) - apenas para MANAGER e ADMIN */}
              {user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
                <div className="space-y-2 pt-2 border-t-2 border-foreground/10">
                  <label className="text-xs font-display font-black uppercase text-secondary">Exibidores / B2B</label>
                  <Link
                    to="/management/cinemas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 bg-muted/20 border-2 border-foreground/30 text-xs font-bold font-display uppercase hover:border-secondary text-foreground hover:text-secondary transition-all shadow-[2px_2px_0px_0px_var(--border)]"
                  >
                    <div className="flex items-center gap-2">
                      <Buildings size={16} weight="bold" className="text-secondary" />
                      <span>Painel do Exibidor</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 bg-secondary/20 text-secondary font-black">B2B</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom User Section in Mobile Drawer */}
            <div className="pt-6 border-t-2 border-foreground/20 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border-2 border-primary/30 bg-primary/5">
                    <div className="w-10 h-10 border-2 border-foreground/40 overflow-hidden shrink-0 bg-muted">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black uppercase text-foreground">
                        {user.username === 'lothrik' ? 'Lothrik Junior' : user.username}
                      </h4>
                      <span className="text-[10px] text-foreground/50 font-bold block">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick links for logged user */}
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                    >
                      <User size={16} weight="bold" className="text-foreground/60" />
                      <span>Meu Perfil</span>
                    </Link>
                    <Link
                      to="/tickets"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                    >
                      <Ticket size={16} weight="bold" className="text-foreground/60" />
                      <span>Meus Ingressos</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                    >
                      <Heart size={16} weight="bold" className="text-foreground/60" />
                      <span>Notificações</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-primary/10 text-foreground/80 hover:text-primary transition-colors"
                    >
                      <Gear size={16} weight="bold" className="text-foreground/60" />
                      <span>Configurações</span>
                    </Link>
                  </div>
                  
                  <Button
                    variant="destructive"
                    className="w-full justify-center text-xs"
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  >
                    <SignOut size={16} weight="bold" className="mr-2" />
                    SAIR DA CONTA
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-center text-xs"
                    onClick={() => { openModal('register'); setIsMobileMenuOpen(false); }}
                  >
                    CRIAR CONTA
                  </Button>
                  <Button
                    variant="default"
                    className="w-full justify-center text-xs"
                    onClick={() => { openModal('login'); setIsMobileMenuOpen(false); }}
                  >
                    FAZER LOGIN
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isBookingFunnel && path !== '/onboarding' && (
        <>
          <footer className="bg-background border-t-2 border-foreground/30 py-10 px-4 sm:px-12 mt-12 mb-16 md:mb-0">
            <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
              <div className="hidden md:flex flex-row justify-between items-start gap-12">
                <div className="space-y-4 pr-6 shrink-0">
                  <Link to="/" className="inline-block">
                    <img 
                      src={logoFull} 
                      alt="screeK Logo" 
                      className="h-12 w-auto" 
                    />
                  </Link>
                  <p className="text-xs text-foreground/60 font-extrabold tracking-wide max-w-[210px]">
                    © 2026 screeK Inc. Todos os direitos reservados.
                  </p>
                </div>

                {/* Right Columns Grid: Cinema, Social, Políticas, Redes Sociais */}
                <div className="grid grid-cols-4 gap-12 flex-1">
                  <div className="space-y-3">
                    <h3 className="text-primary font-display font-black text-base uppercase tracking-wider">Cinema</h3>
                    <ul className="space-y-1.5 text-xs font-bold text-foreground/70">
                      <li><Link to="/movies?status=now_playing" className="hover:text-primary underline transition-colors">Em Cartaz</Link></li>
                      <li><Link to="/movies?status=upcoming" className="hover:text-primary underline transition-colors">Em Breve</Link></li>
                      <li><Link to="/movies" className="hover:text-primary underline transition-colors">Catálogo Geral</Link></li>
                      <li><Link to="/cinemas" className="hover:text-primary underline transition-colors">Cinemas</Link></li>
                      <li><Link to="/intelligence" className="hover:text-primary underline transition-colors">Para Você (IA)</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-primary font-display font-black text-base uppercase tracking-wider">Social</h3>
                    <ul className="space-y-1.5 text-xs font-bold text-foreground/70">
                      <li><Link to="/feed" className="hover:text-primary underline transition-colors">Feed</Link></li>
                      <li><Link to="/lists" className="hover:text-primary underline transition-colors">Listas</Link></li>
                      <li><Link to="/collections" className="hover:text-primary underline transition-colors">Coleções</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-primary font-display font-black text-base uppercase tracking-wider">Políticas</h3>
                    <ul className="space-y-1.5 text-xs font-bold text-foreground/70">
                      <li><Link to="/terms" className="hover:text-primary underline transition-colors">Termos de Uso</Link></li>
                      <li><Link to="/privacy" className="hover:text-primary underline transition-colors">Privacidade</Link></li>
                      <li><Link to="/faq" className="hover:text-primary underline transition-colors">FAQ</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-primary font-display font-black text-base uppercase tracking-wider">Redes Sociais</h3>
                    <div className="flex items-center gap-3">
                      <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors shadow-sm" title="YouTube"><YoutubeLogo size={18} weight="fill" /></a>
                      <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors shadow-sm" title="Twitter / X"><TwitterLogo size={18} weight="fill" /></a>
                      <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors shadow-sm" title="Instagram"><InstagramLogo size={18} weight="fill" /></a>
                      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors shadow-sm" title="Facebook"><FacebookLogo size={18} weight="fill" /></a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Footer Accordion Tabs */}
              <div className="md:hidden flex flex-col space-y-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-2 text-xs font-display font-extrabold uppercase">
                    <button
                      onClick={() => toggleFooterTab('cinema')}
                      className={`py-1 px-2 transition-all cursor-pointer ${
                        activeFooterTab === 'cinema'
                          ? 'text-primary border-b-2 border-primary font-black scale-105'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      Cinema
                    </button>

                    <button
                      onClick={() => toggleFooterTab('social')}
                      className={`py-1 px-2 transition-all cursor-pointer ${
                        activeFooterTab === 'social'
                          ? 'text-primary border-b-2 border-primary font-black scale-105'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      Social
                    </button>

                    <button
                      onClick={() => toggleFooterTab('politicas')}
                      className={`py-1 px-2 transition-all cursor-pointer ${
                        activeFooterTab === 'politicas'
                          ? 'text-primary border-b-2 border-primary font-black scale-105'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      Políticas
                    </button>

                    <button
                      onClick={() => toggleFooterTab('redes')}
                      className={`py-1 px-2 transition-all cursor-pointer ${
                        activeFooterTab === 'redes'
                          ? 'text-primary border-b-2 border-primary font-black scale-105'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      Redes Sociais
                    </button>
                  </div>

                  {/* Expanded Content Drawer Below Active Tab (Mobile Only) */}
                  {activeFooterTab && (
                    <div className="pt-3 border-t border-foreground/10 flex justify-center text-center animate-in fade-in slide-in-from-top-1 duration-150">
                      {activeFooterTab === 'cinema' && (
                        <ul className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-foreground/80">
                          <li><Link to="/movies?status=now_playing" className="hover:text-primary underline">Filmes em Cartaz</Link></li>
                          <li><Link to="/movies?status=upcoming" className="hover:text-primary underline">Em Breve</Link></li>
                          <li><Link to="/movies" className="hover:text-primary underline">Catálogo</Link></li>
                          <li><Link to="/cinemas" className="hover:text-primary underline">Cinemas</Link></li>
                        </ul>
                      )}

                      {activeFooterTab === 'social' && (
                        <ul className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-foreground/80">
                          <li><Link to="/feed" className="hover:text-primary underline">Feed</Link></li>
                          <li><Link to="/lists" className="hover:text-primary underline">Minhas Listas</Link></li>
                          <li><Link to="/reviews" className="hover:text-primary underline">Reviews</Link></li>
                          <li><Link to="/users" className="hover:text-primary underline">Usuários</Link></li>
                        </ul>
                      )}

                      {activeFooterTab === 'politicas' && (
                        <ul className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-foreground/80">
                          <li><Link to="/terms" className="hover:text-primary underline">Termos de Uso</Link></li>
                          <li><Link to="/privacy" className="hover:text-primary underline">Privacidade</Link></li>
                          <li><Link to="/faq" className="hover:text-primary underline">FAQ</Link></li>
                        </ul>
                      )}

                      {activeFooterTab === 'redes' && (
                        <div className="flex items-center justify-center gap-3">
                          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors" title="YouTube"><YoutubeLogo size={20} weight="fill" /></a>
                          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors" title="Twitter / X"><TwitterLogo size={20} weight="fill" /></a>
                          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors" title="Instagram"><InstagramLogo size={20} weight="fill" /></a>
                          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 bg-foreground/70 hover:bg-primary text-background flex items-center justify-center transition-colors" title="Facebook"><FacebookLogo size={20} weight="fill" /></a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Bottom Centered Logo & Copyright */}
                <div className="flex flex-col items-center justify-center text-center space-y-3 pt-1">
                  <Link to="/" className="inline-block">
                    <img 
                      src={logoFull} 
                      alt="screeK Logo" 
                      className="h-12 w-auto" 
                    />
                  </Link>
                  <p className="text-xs text-foreground/60 font-extrabold tracking-wide">
                    © 2026 screeK Inc. Todos os direitos reservados.
                  </p>
                </div>
              </div>

            </div>
          </footer>

          {/* Mobile Bottom Navigation Bar (Figma Mobile Dock - Fits 100% Screen Width) */}
          <nav className="fixed bottom-0 left-0 right-0 w-full z-40 md:hidden bg-background border-t-4 border-foreground py-2 px-1 flex items-center justify-around text-center box-border overflow-hidden shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
            <Link
              to="/movies"
              className="flex flex-col items-center gap-0.5 text-foreground/60 hover:text-primary transition-colors cursor-pointer"
            >
              <Ticket size={22} weight="bold" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider">TICKET</span>
            </Link>

            <Link
              to="/"
              className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                isCinemaActive ? 'text-secondary font-black' : 'text-foreground/60 hover:text-primary'
              }`}
            >
              <MapPin size={22} weight="bold" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider">CINEMA</span>
            </Link>

            <Link
              to="/search"
              className="flex flex-col items-center gap-0.5 text-foreground/60 hover:text-primary transition-colors cursor-pointer"
            >
              <MagnifyingGlass size={22} weight="bold" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider">BUSCAR</span>
            </Link>

            <Link
              to="/feed"
              className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                isSocialActive ? 'text-secondary font-black' : 'text-foreground/60 hover:text-primary'
              }`}
            >
              <Heart size={22} weight="bold" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider">SOCIAL</span>
            </Link>

            <button
              onClick={() => (user ? navigate('/profile') : openModal('login'))}
              className="flex flex-col items-center gap-0.5 text-foreground/60 hover:text-primary transition-colors cursor-pointer"
            >
              <User size={22} weight="bold" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider">PERFIL</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};
