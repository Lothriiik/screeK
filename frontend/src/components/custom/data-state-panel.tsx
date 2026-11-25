import { ArrowClockwise, CheckCircle, MagnifyingGlass, WarningCircle, WifiSlash } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

export type DataState = 'loading' | 'empty' | 'error' | 'offline' | 'maintenance' | 'validation';

const STATE_CONTENT: Record<Exclude<DataState, 'validation'>, { title: string; description: string; icon: typeof WarningCircle }> = {
  loading: { title: 'Carregando informações', description: 'Isso pode levar alguns segundos.', icon: ArrowClockwise },
  empty: { title: 'Nada por aqui ainda', description: 'Quando houver informações, elas aparecerão nesta área.', icon: MagnifyingGlass },
  error: { title: 'Não foi possível carregar', description: 'O serviço encontrou um erro. Tente novamente em instantes.', icon: WarningCircle },
  offline: { title: 'Sem conexão', description: 'Confira sua internet. Seus dados serão carregados quando a conexão voltar.', icon: WifiSlash },
  maintenance: { title: 'Estamos em manutenção', description: 'Esta área está temporariamente indisponível. Tente novamente mais tarde.', icon: WarningCircle },
};

export function DataStatePanel({ state, title, description, actionLabel, onAction, className }: {
  state: DataState;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  if (state === 'validation') {
    return <div role="alert" className={cn('border-2 border-destructive/60 bg-destructive/5 p-4 text-sm', className)}><strong className="flex items-center gap-2 font-black text-destructive"><WarningCircle size={18}/> Confira os dados</strong><p className="mt-1 text-xs text-foreground/70">{description || 'Revise os campos destacados e tente novamente.'}</p></div>;
  }
  const content = STATE_CONTENT[state];
  const Icon = content.icon;
  return <div role={state === 'error' || state === 'offline' ? 'alert' : 'status'} aria-live="polite" className={cn('flex min-h-40 flex-col items-center justify-center border-2 border-dashed border-foreground/25 bg-background p-6 text-center', className)}>
    <Icon size={25} weight="bold" className={state === 'error' || state === 'offline' || state === 'maintenance' ? 'text-warning' : 'text-primary'}/>
    <strong className="mt-2 font-display text-sm font-black uppercase">{title || content.title}</strong>
    <p className="mt-1 max-w-md text-xs leading-relaxed text-foreground/60">{description || content.description}</p>
    {actionLabel && onAction && <button type="button" onClick={onAction} className="mt-4 inline-flex items-center gap-2 border-2 border-foreground/40 px-3 py-2 text-[10px] font-black uppercase hover:border-primary hover:text-primary"><CheckCircle size={14}/>{actionLabel}</button>}
  </div>;
}
