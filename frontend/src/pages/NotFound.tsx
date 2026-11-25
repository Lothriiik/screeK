import { Link } from 'react-router-dom';
import { FilmSlate, House } from '@phosphor-icons/react';
import { useState } from 'react';

export function NotFound() {
  const [query, setQuery] = useState('');
  return (
    <div className="bg-background text-foreground flex min-h-[70vh] flex-col items-center justify-center p-4 text-center font-display">
      
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 bg-primary/10 border-4 border-primary text-primary mx-auto flex items-center justify-center shadow-[4px_4px_0px_0px_var(--border)]">
          <FilmSlate size={40} weight="bold" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl sm:text-6xl font-black text-primary font-mono block">
            404
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            Cena Cortada! Página Não Encontrada
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/70 leading-relaxed">
            O link que você tentou acessar não existe no catálogo ou foi movido para outra sala.
          </p>
        </div>

        <form action="/search" className="flex w-full border-2 border-primary bg-background p-1">
          <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar filmes, cinemas, pessoas..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs outline-none" />
          <button type="submit" className="bg-primary px-3 text-xs font-black uppercase text-primary-foreground">Buscar</button>
        </form>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-6 py-3 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
          >
            <House size={16} weight="bold" />
            <span>Voltar ao Início</span>
          </Link>

          <Link
            to="/movies"
            className="px-5 py-3 bg-background hover:bg-muted border-2 border-foreground text-foreground font-black text-xs uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_var(--border)]"
          >
            Explorar Filmes
          </Link>
        </div>
      </div>

    </div>
  );
}
