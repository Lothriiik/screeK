import { Link } from 'react-router-dom';
import { LockKey, ArrowLeft, House } from '@phosphor-icons/react';

export function Forbidden() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 font-display">
      <div className="max-w-md w-full border-4 border-foreground/40 bg-background p-8 text-center space-y-6 shadow-[8px_8px_0px_0px_var(--border)]">
        <div className="w-16 h-16 bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto text-destructive">
          <LockKey size={36} weight="bold" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase text-destructive tracking-widest block">
            Erro 403 • Acesso Restrito
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-foreground">
            Área de Acesso Restrito
          </h1>
          <p className="text-xs font-sans text-foreground/60">
            Você não possui as permissões necessárias para acessar este painel ou recurso. Esta área é restrita a exibidores e administradores do screeK.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase flex items-center justify-center gap-2 border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <House size={16} weight="bold" />
            <span>Voltar ao Início</span>
          </Link>
          <Link
            to="/feed"
            className="w-full sm:w-auto px-5 py-2.5 bg-background hover:bg-muted font-black text-xs uppercase flex items-center justify-center gap-2 border-2 border-foreground/30 shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Ir para o Feed</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
