import { useState } from 'react';
import { DataStatePanel, type DataState } from '../components/custom/data-state-panel';
import { SectionHeading } from '../components/custom/section-heading';

const OPTIONS: { state: DataState; label: string }[] = [
  { state: 'loading', label: 'Carregando' },
  { state: 'empty', label: 'Vazio' },
  { state: 'error', label: 'Erro 500' },
  { state: 'offline', label: 'Sem conexão' },
  { state: 'maintenance', label: 'Manutenção' },
  { state: 'validation', label: 'Erro de formulário' },
];

export function StateGallery() {
  const [active, setActive] = useState<DataState>('loading');
  const [retry, setRetry] = useState(0);
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-0"><div><p className="mb-1 text-[10px] font-black uppercase tracking-[.18em] text-primary">Desenvolvimento · biblioteca de interface</p><h1 className="font-display text-3xl font-black uppercase">Estados de tela</h1><p className="mt-2 max-w-2xl text-sm text-foreground/65">Padrões compartilhados para carregamento, vazio, falha de API, conexão, manutenção e validação.</p></div><nav aria-label="Exemplos de estado" className="flex flex-wrap gap-2">{OPTIONS.map((item) => <button key={item.state} type="button" onClick={() => setActive(item.state)} aria-pressed={active === item.state} className={`border-2 px-3 py-2 text-[10px] font-black uppercase ${active === item.state ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/35'}`}>{item.label}</button>)}</nav><section className="grid gap-6 lg:grid-cols-2"><div className="space-y-3"><SectionHeading title="Exemplo em uma seção" size="medium"/><DataStatePanel state={active} onAction={() => setRetry((count) => count + 1)} actionLabel={active === 'loading' ? undefined : 'Tentar novamente'}/><p className="text-[10px] text-foreground/50">Tentativas nesta demonstração: {retry}</p></div><div className="space-y-3"><SectionHeading title="Erro de formulário" size="medium"/><label className="block text-[10px] font-black uppercase">E-mail<input className="mt-1 h-10 w-full border-2 border-destructive bg-background px-3 text-sm outline-none" value="email-inválido" readOnly/></label><DataStatePanel state="validation" description="Informe um endereço de e-mail válido para continuar."/><div className="border-2 border-warning/40 bg-warning/5 p-3 text-[10px] leading-relaxed text-foreground/65">Escolha estado conforme a causa: erro do servidor, falha de conexão e manutenção são mensagens diferentes e devem oferecer ações adequadas.</div></div></section></main>;
}
