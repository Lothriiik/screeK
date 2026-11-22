import { Outlet, Link } from 'react-router-dom';
import logoFull from '../assets/logos/logo-full.svg';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-4 sm:p-6">
      <header className="pt-6 sm:pt-10 md:pt-16">
        <Link to="/">
          <img 
            src={logoFull} 
            alt="screeK Logo" 
            className="h-10 sm:h-14 md:h-16 w-auto hover:opacity-90 transition-opacity" 
          />
        </Link>
      </header>

      <main className="w-full max-w-[450px] my-auto py-6">
        <Outlet />
      </main>


      <footer className="pb-6 sm:pb-12 md:pb-32 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold font-display text-foreground/60">
        <Link to="/terms" className="underline hover:text-tertiary transition-colors">Termos de Uso</Link>
        <Link to="/faq" className="underline hover:text-tertiary transition-colors">FAQ</Link>
        <Link to="/privacy" className="underline hover:text-tertiary transition-colors">Privacidade</Link>
      </footer>

    </div>
  );
};

