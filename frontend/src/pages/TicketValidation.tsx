import { useMemo, useState, type FormEvent } from 'react';
import { Barcode, CheckCircle, Clock, MagnifyingGlass, ShieldCheck, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_USER_TICKETS } from '../mocks/tickets';
import { DataStatePanel } from '../components/custom/data-state-panel';

export function TicketValidation() {
  const [code, setCode] = useState('');
  const [tickets, setTickets] = useState(MOCK_USER_TICKETS.map((ticket) => ({ ...ticket })));
  const [submittedCode, setSubmittedCode] = useState('');
  const ticket = useMemo(() => tickets.find((item) => item.id.toLowerCase() === submittedCode.trim().toLowerCase()), [tickets, submittedCode]);
  const lookup = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmittedCode(code); };
  const isValid = ticket?.status === 'PAID';

  const confirmEntry = () => {
    if (!ticket || !isValid) return;
    setTickets((items) => items.map((item) => item.id === ticket.id ? { ...item, status: 'USED' as const } : item));
    toast.success('Entrada confirmada e ingresso validado.');
  };

  return <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-0">
    <div><h1 className="font-display text-3xl font-black uppercase text-primary sm:text-4xl">Validar ingresso</h1><p className="mt-2 max-w-2xl text-sm text-foreground/65">Confirme o ingresso e a sessão sem exibir preço ou faturamento para a equipe de portaria.</p></div>
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <section className="space-y-4 border-4 border-foreground/30 bg-background p-5 sm:p-6">
        <div className="flex items-start gap-3"><Barcode size={25} className="text-primary"/><div><h2 className="text-sm font-black uppercase">Leitura manual / leitor USB</h2><p className="mt-1 text-xs text-foreground/60">Foco no campo e escaneie o QR; o leitor preencherá o código.</p></div></div>
        <form onSubmit={lookup} className="space-y-3"><label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Código do ingresso</span><div className="relative"><MagnifyingGlass size={16} className="absolute left-3 top-3 text-foreground/50"/><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="TXN-20260822-4419" className="h-11 w-full border-2 border-foreground/35 bg-background pl-10 pr-3 font-mono text-xs outline-none focus:border-primary"/></div></label><button type="submit" className="h-11 w-full border-2 border-primary bg-primary px-4 text-xs font-black uppercase text-primary-foreground">Consultar ingresso</button></form>
        <div className="border-l-4 border-primary bg-muted/20 p-3 text-[10px] leading-relaxed text-foreground/65"><strong className="mb-1 block text-foreground">Dados visíveis para portaria</strong>Filme, cinema, sala, horário, assentos e estado do ingresso. Preço, CPF e dados financeiros ficam ocultos.</div>
        <button type="button" onClick={() => { setCode('TXN-20260822-4419'); setSubmittedCode('TXN-20260822-4419'); }} className="text-[10px] font-black uppercase text-primary hover:underline">Carregar exemplo válido</button>
      </section>
      <section className="min-w-0">
        {!submittedCode && <div className="flex min-h-72 flex-col items-center justify-center border-2 border-dashed border-foreground/25 p-6 text-center"><ShieldCheck size={30} className="text-primary"/><h2 className="mt-3 text-sm font-black uppercase">Aguardando leitura</h2><p className="mt-1 text-xs text-foreground/60">O resultado da validação aparecerá nesta área.</p></div>}
        {submittedCode && !ticket && <DataStatePanel state="error" title="Ingresso não encontrado" description="Confira o código e consulte novamente. Em caso de dúvida, encaminhe para o atendimento."/>}
        {ticket && <div className={`border-4 p-5 ${isValid ? 'border-success/70 bg-success/5' : ticket.status === 'USED' ? 'border-warning/70 bg-warning/5' : 'border-destructive/70 bg-destructive/5'}`}>
          <div className="flex items-center gap-3">{isValid ? <CheckCircle size={30} className="text-success"/> : ticket.status === 'USED' ? <Clock size={30} className="text-warning"/> : <XCircle size={30} className="text-destructive"/>}<div><p className="text-[10px] font-black uppercase tracking-wider text-foreground/55">Resultado da consulta</p><h2 className={`font-display text-xl font-black uppercase ${isValid ? 'text-success' : ticket.status === 'USED' ? 'text-warning' : 'text-destructive'}`}>{isValid ? 'Ingresso válido' : ticket.status === 'USED' ? 'Já utilizado' : ticket.status === 'CANCELLED' ? 'Cancelado' : 'Pagamento pendente'}</h2></div></div>
          <div className="mt-5 grid gap-3 border-t border-foreground/15 pt-4 sm:grid-cols-2">{[['Filme', ticket.movie_title], ['Cinema', ticket.cinema_name], ['Sessão', `${ticket.session_date} · ${ticket.session_time}`], ['Sala', ticket.room_name], ['Assentos', ticket.tickets.map((item) => item.seatId).join(', ')], ['Código', ticket.id]].map(([label, value]) => <div key={label}><span className="block text-[9px] font-black uppercase text-foreground/50">{label}</span><strong className="text-xs">{value}</strong></div>)}</div>
          {isValid && <button type="button" onClick={confirmEntry} className="mt-5 h-11 w-full border-2 border-success bg-success px-4 text-xs font-black uppercase text-white">Confirmar entrada</button>}
          <p className="mt-3 text-[10px] text-foreground/55">Operador autenticado · validação registrada por unidade e horário.</p>
        </div>}
      </section>
    </div>
  </main>;
}
