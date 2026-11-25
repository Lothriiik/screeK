import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MagnifyingGlass, EnvelopeSimple, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_USER_TICKETS } from '../mocks/tickets';
import { CinemaTicket } from '../components/custom/cinema-ticket';
import { DataStatePanel } from '../components/custom/data-state-panel';

const formClass = 'h-11 w-full border-2 border-foreground/35 bg-background px-3 text-sm outline-none focus:border-primary';

export function TicketLookup() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const ticket = searched
    ? MOCK_USER_TICKETS.find((item) => item.id.toLowerCase() === query.trim().toLowerCase())
      ?? (query.trim().toLowerCase() === 'lothrik@screek.com' || query.trim() === '123.456.789-00' ? MOCK_USER_TICKETS.find((item) => item.status === 'PAID') : undefined)
    : undefined;

  const lookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) { setSearched(true); return; }
    setSearched(true);
  };

  return <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-0">
    <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground/65 hover:text-primary"><ArrowLeft size={15}/> Voltar ao início</Link>
    <div><h1 className="font-display text-3xl font-black uppercase text-primary sm:text-4xl">Encontrar meu ingresso</h1><p className="mt-2 max-w-2xl text-sm text-foreground/65">Informe o código do pedido ou localize a compra usando o e-mail e o CPF informados no checkout.</p></div>
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={lookup} className="space-y-4 border-4 border-foreground/30 bg-background p-5 sm:p-6">
        <label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Código do pedido, e-mail ou CPF</span><div className="relative"><MagnifyingGlass size={17} className="absolute left-3 top-3 text-foreground/50"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TXN-20260822-4419" className={`${formClass} pl-10`}/></div></label>
        <label className="block"><span className="mb-1 block text-[10px] font-black uppercase">E-mail usado na compra</span><div className="relative"><EnvelopeSimple size={16} className="absolute left-3 top-3 text-foreground/50"/><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@email.com" className={`${formClass} pl-10`}/></div></label>
        <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 border-2 border-primary bg-primary px-4 text-xs font-black uppercase text-primary-foreground hover:bg-primary/90">Buscar pedido</button>
        <p className="flex items-start gap-2 border-l-4 border-primary bg-muted/20 p-3 text-[10px] leading-relaxed text-foreground/60"><ShieldCheck size={16} className="shrink-0 text-primary"/>Para proteger seus dados, confirmamos os dados do pedido antes de exibir o QR Code de acesso.</p>
        {searched && Boolean(query.trim()) && !ticket && <DataStatePanel state="empty" title="Nenhum ingresso encontrado" description="Confira o código e o e-mail de compra. Se pagou há pouco, aguarde a confirmação." className="min-h-32"/>}
        {searched && !query.trim() && <DataStatePanel state="validation" description="Digite o código do pedido, e-mail ou CPF."/>}
      </form>
      <section className="min-w-0">
        {!searched && <div className="flex h-full min-h-72 flex-col justify-center border-2 border-dashed border-foreground/25 p-6 text-center"><MagnifyingGlass size={28} className="mx-auto text-primary"/><h2 className="mt-3 text-sm font-black uppercase">Sua compra fica aqui</h2><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-foreground/60">Após a confirmação, você pode abrir o ingresso e o QR Code diretamente por aqui.</p><button type="button" onClick={() => setQuery('TXN-20260822-4419')} className="mx-auto mt-4 border-2 border-foreground/35 px-3 py-2 text-[10px] font-black uppercase hover:border-primary hover:text-primary">Usar código de exemplo</button></div>}
        {ticket && <><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase">Ingresso localizado</h2><span className="text-[10px] font-mono text-foreground/55">{ticket.id}</span></div><CinemaTicket id={ticket.id} movieTitle={ticket.movie_title} cinemaName={ticket.cinema_name} roomName={ticket.room_name} seats={ticket.tickets.map((seat) => seat.seatId)} date={ticket.session_date} time={ticket.session_time} ticketType={ticket.status === 'USED' ? 'used' : ticket.status === 'CANCELLED' ? 'cancelled' : 'standard'} ticketCategory={ticket.tickets.map((seat) => seat.type).join(' · ')} price={ticket.total_amount} audioFormat={ticket.audio_format} screenFormat={ticket.screen_format} code={ticket.id} qrCodeUrl={ticket.qr_code} actionButtons={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => toast.success(`Link de ${ticket.id} copiado.`)} className="border-2 border-foreground/40 px-3 py-2 text-[10px] font-black uppercase">Compartilhar</button><button type="button" onClick={() => toast.success('Segunda via enviada para o e-mail da compra.')} className="border-2 border-primary bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground">Enviar por e-mail</button></div>}/></>}
      </section>
    </div>
    <p className="text-xs text-foreground/60">Já tem conta? <Link to="/tickets" className="font-black text-primary hover:underline">Acesse Meus ingressos</Link></p>
  </main>;
}
