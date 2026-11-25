import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Ticket, MapPin, ShareNetwork, DownloadSimple, X, CaretRight,
  Trash, DotsThree, Wallet, MagnifyingGlass,
  CaretDown
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CinemaTicket } from '../components/custom/cinema-ticket';
import { EmptyState } from '../components/custom/empty-state';
import { SectionHeading } from '../components/custom/section-heading';
import { StatusModal } from '../components/custom/status-modal';
import { MOCK_USER_TICKETS } from '../mocks';
import type { BookingTransaction } from '../types/booking';

type HistoryFilter = 'ALL' | 'USED' | 'CANCELLED';

const makeHistoryExamples = (): BookingTransaction[] => {
  const raw = MOCK_USER_TICKETS.find((ticket) => ticket.movie_id === 'raw') ?? MOCK_USER_TICKETS[0];
  const dune = MOCK_USER_TICKETS.find((ticket) => ticket.movie_id === 'dune-part-two') ?? MOCK_USER_TICKETS[0];
  const chainsaw = MOCK_USER_TICKETS.find((ticket) => ticket.movie_id === 'chainsaw-man') ?? MOCK_USER_TICKETS[0];
  return [
    { ...raw, id: 'TXN-20260327-4410', session_date: '27 MAR', session_time: '21:00', status: 'USED', created_at: '2026-03-27T18:00:00Z', total_amount: 104, tickets: raw.tickets.slice(0, 1), snacks: [{ id: 'combo-duplo', name: 'Combo Duplo', price: 52, quantity: 1 }], qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=SCREEK-HIST-4410' },
    { ...dune, id: 'TXN-20260314-1288', movie_title: 'House', session_date: '14 MAR', session_time: '19:00', status: 'USED', created_at: '2026-03-14T16:00:00Z', total_amount: 26, qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=SCREEK-HIST-1288' },
    { ...chainsaw, id: 'TXN-20260102-9034', movie_title: 'Opera', movie_id: 'opera', cinema_name: 'Cinemark Bourbon Shopping', session_date: '02 JAN', session_time: '22:00', status: 'CANCELLED', created_at: '2026-01-02T19:00:00Z', total_amount: 52, qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=SCREEK-HIST-9034' },
  ];
};

const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const ticketSeats = (ticket: BookingTransaction) => ticket.tickets.map((item) => item.seatId).join(', ');
const qrImage = (ticket: BookingTransaction, size = 240) => ticket.qr_code.replace(/size=\d+x\d+/, `size=${size}x${size}`);

function DataPoint({ label, children, accent = false, light = false }: { label: string; children: React.ReactNode; accent?: boolean; light?: boolean }) {
  return <div><span className={`mb-0.5 block text-[9px] font-black uppercase tracking-[.14em] ${light ? 'text-white/60' : 'text-foreground/55'}`}>{label}</span><span className={`font-display text-sm font-black ${accent ? 'text-secondary' : light ? 'text-white' : 'text-foreground'}`}>{children}</span></div>;
}

function TicketActions({ ticket, onShare, onCancel }: { ticket: BookingTransaction; onShare: () => void; onCancel?: () => void }) {
  return <div className="flex items-center gap-2">
    <button type="button" onClick={onShare} className="inline-flex h-10 items-center justify-center gap-2 border-2 border-foreground px-3 text-[10px] font-black uppercase hover:bg-foreground/5"><ShareNetwork size={15}/> Compartilhar</button>
    <details className="relative">
      <summary aria-label="Mais opções do ingresso" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center border-2 border-foreground/40 hover:bg-foreground/5"><DotsThree size={21} weight="bold"/></summary>
      <div className="absolute right-0 top-full z-20 mt-1 min-w-44 border-2 border-foreground/30 bg-background p-1 shadow-lg">
        <button type="button" onClick={() => toast.success('Comprovante de compra baixado em PDF!')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-black uppercase hover:bg-muted/40"><DownloadSimple size={14}/> Baixar comprovante</button>
        {onCancel && <button type="button" onClick={onCancel} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-black uppercase text-destructive hover:bg-destructive/10"><Trash size={14}/> Cancelar ingresso</button>}
        {!onCancel && ticket.status === 'CANCELLED' && <span className="block px-3 py-2 text-[10px] font-bold text-foreground/60">Ingresso cancelado</span>}
      </div>
    </details>
  </div>;
}

export function Tickets() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>(() => searchParams.get('status') === 'history' ? 'history' : 'active');
  useEffect(() => setActiveTab(searchParams.get('status') === 'history' ? 'history' : 'active'), [searchParams]);
  const selectTab = (tab: 'active' | 'history') => {
    setActiveTab(tab);
    setSearchParams(tab === 'history' ? { status: 'history' } : {}, { replace: false });
  };
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [ticketList, setTicketList] = useState<BookingTransaction[]>(() => [
    ...MOCK_USER_TICKETS.map((ticket, index) => ({ ...ticket, status: 'PAID' as const, session_date: ['28 NOV', '27 NOV', '02 DEZ', '06 DEZ'][index] ?? ticket.session_date })),
    ...makeHistoryExamples(),
  ]);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<BookingTransaction | null>(
    id ? ticketList.find((ticket) => ticket.id === id) || null : null
  );
  const [cancelingTicket, setCancelingTicket] = useState<BookingTransaction | null>(null);
  const activeTickets = ticketList.filter((ticket) => ticket.status === 'PAID');
  const historyTickets = ticketList.filter((ticket) => ticket.status === 'USED' || ticket.status === 'CANCELLED');
  const filteredHistory = useMemo(() => historyTickets
    .filter((ticket) => historyFilter === 'ALL' || ticket.status === historyFilter)
    .filter((ticket) => `${ticket.movie_title} ${ticket.cinema_name}`.toLowerCase().includes(historySearch.toLowerCase()))
    .sort((a, b) => sortNewest ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)),
  [historyTickets, historyFilter, historySearch, sortNewest]);

  const handleShareTicket = (ticket: BookingTransaction) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(`Meu ingresso para ${ticket.movie_title} no ${ticket.cinema_name} (${ticket.session_date} às ${ticket.session_time})! Código: ${ticket.id}`);
      toast.success('Informações do ingresso copiadas para a área de transferência!');
    }
  };
  const handleConfirmCancelTicket = () => {
    if (!cancelingTicket) return;
    setTicketList((previous) => previous.map((ticket) => ticket.id === cancelingTicket.id ? { ...ticket, status: 'CANCELLED' as const } : ticket));
    toast.success(`Ingresso cancelado. Reembolso de ${money(cancelingTicket.total_amount)} processado.`);
    setCancelingTicket(null);
  };

  if (id) {
    const ticket = ticketList.find((item) => item.id === id);
    if (!ticket) return <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center gap-3 px-4 text-center"><h1 className="font-display text-2xl font-black uppercase">Ingresso não encontrado</h1><p className="text-sm text-foreground/65">Confira o código do ingresso e tente novamente.</p><Link to="/tickets" className="bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground">Meus ingressos</Link></main>;
    return <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8"><Link to="/tickets" className="text-xs font-black uppercase text-primary hover:underline">← Voltar aos ingressos</Link><SectionHeading title="Detalhe do ingresso" size="medium"/><CinemaTicket featured movieTitle={ticket.movie_title} cinemaName={ticket.cinema_name} roomName={ticket.room_name} seats={ticketSeats(ticket).split(', ')} date={ticket.session_date} time={ticket.session_time} ticketType={ticket.status === 'USED' ? 'used' : ticket.status === 'CANCELLED' ? 'cancelled' : 'standard'} ticketCategory={ticket.tickets.map((item) => item.type).join(' · ')} price={ticket.total_amount} audioFormat={ticket.audio_format} screenFormat={ticket.screen_format} code={ticket.id} qrCodeUrl={ticket.qr_code} onQrClick={() => setSelectedTicketForQr(ticket)} snacks={ticket.snacks.map(({ name, quantity }) => ({ name, quantity }))} notice={ticket.status === 'PAID' ? 'Apresente o QR Code na entrada. Chegue 20 minutos antes.' : ticket.status === 'USED' ? 'Este ingresso já foi utilizado.' : 'Este ingresso foi cancelado e reembolsado.'}/><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(ticket.cinema_name)}`, '_blank')} className="border-2 border-foreground px-4 py-3 text-[10px] font-black uppercase">Como chegar</button><TicketActions ticket={ticket} onShare={() => handleShareTicket(ticket)} onCancel={ticket.status === 'PAID' ? () => setCancelingTicket(ticket) : undefined}/></div>{selectedTicketForQr && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="QR Code do ingresso"><div className="w-full max-w-sm space-y-4 border-4 border-foreground bg-background p-5 text-center text-foreground"><button type="button" onClick={() => setSelectedTicketForQr(null)} className="float-right" aria-label="Fechar QR">×</button><h2 className="font-display font-black uppercase">Apresente na catraca</h2><img src={qrImage(selectedTicketForQr, 420)} alt="QR Code de entrada" className="mx-auto h-64 w-64 border-2 border-foreground bg-white p-2"/><span className="font-mono text-[10px]">{selectedTicketForQr.id}</span></div></div>}<StatusModal isOpen={!!cancelingTicket} type="destruction" headerTitle="CANCELAR INGRESSO" description="Seu ingresso será invalidado na catraca e os assentos serão liberados para o público." deletionDetails={cancelingTicket ? { title: cancelingTicket.movie_title, subtitle: `${cancelingTicket.cinema_name} · ${cancelingTicket.session_date} às ${cancelingTicket.session_time}`, highlightText: `Reembolso integral de ${money(cancelingTicket.total_amount)} será estornado` } : undefined} primaryActionLabel="CONFIRMAR CANCELAMENTO E ESTORNO" secondaryActionLabel="MANTER MEU INGRESSO" onPrimaryAction={handleConfirmCancelTicket} onSecondaryAction={() => setCancelingTicket(null)} onClose={() => setCancelingTicket(null)}/></main>;
  }

  const renderQrButton = (ticket: BookingTransaction, large = false) => (
    <button type="button" onClick={() => setSelectedTicketForQr(ticket)} title="Ampliar QR Code" className={`${large ? 'h-[150px] w-[150px] sm:h-[176px] sm:w-[176px]' : 'h-[62px] w-[62px]'} shrink-0 border-2 border-foreground bg-white p-1.5`}>
      <img src={qrImage(ticket, large ? 360 : 180)} alt={`QR Code do ingresso de ${ticket.movie_title}`} className="h-full w-full object-contain" />
    </button>
  );

  return <div className="bg-background text-foreground">
    <header className="border-b-2 border-foreground/25 px-4 py-6 sm:px-0">
      <div className="mx-auto max-w-4xl space-y-5 md:max-w-5xl lg:max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-display text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">Meus ingressos</h1><p className="mt-1 text-xs text-foreground/70">Chegue 20 minutos antes. Cancelamento e reembolso até 2 horas antes da sessão.</p></div>
          <Link to="/movies" className="inline-flex items-center gap-1 bg-primary px-4 py-3 text-[10px] font-black uppercase text-primary-foreground">Explorar sessões <CaretRight weight="bold"/></Link>
        </div>
        <nav className="flex border-b-2 border-foreground/35" aria-label="Seções dos ingressos">
          <button type="button" onClick={() => selectTab('active')} className={`px-5 py-3 text-xs font-black uppercase ${activeTab === 'active' ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:text-primary'}`}>Próximos ({activeTickets.length})</button>
          <button type="button" onClick={() => selectTab('history')} className={`px-5 py-3 text-xs font-black uppercase ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:text-primary'}`}>Histórico ({historyTickets.length})</button>
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-7 md:max-w-5xl lg:max-w-6xl sm:px-0">
      {activeTab === 'active' ? <div className="space-y-7">
        {activeTickets.length === 0 ? <EmptyState icon={<Ticket size={42}/>} title="Você não tem ingressos próximos" description="Explore as sessões e escolha seu próximo filme." actionLabel="Explorar filmes" onAction={() => navigate('/movies')} className="mx-auto max-w-lg"/> : <>
          {activeTickets[0] && <section>
            <SectionTitle title="Hoje" />
            {(() => { const ticket = activeTickets[0]; const snackSummary = ticket.snacks.length ? ticket.snacks.map((snack) => `${snack.quantity}x ${snack.name}`).join(' · ') : 'Sem bomboniere'; return <>
              <article className="grid min-h-[250px] overflow-hidden border-2 border-[#1d2948] bg-[#1d2948] md:grid-cols-[1fr_270px]" style={{ backgroundColor: '#1d2948' }}>
                <div className="p-5 text-[#f1e5d8] sm:p-7">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase"><span className="bg-secondary px-2 py-1 text-secondary-foreground">Começa em 1h 20</span><span className="text-[#f1e5d8]/75">{ticket.cinema_name}</span></div>
                  <h2 className="mb-3 font-display text-3xl font-black uppercase leading-none text-[#f1e5d8] sm:text-4xl">{ticket.movie_title}</h2>
                  <div className="mb-5 flex flex-wrap gap-2">{[ticket.audio_format, ticket.screen_format].map((format) => <span key={format} className="border border-[#f1e5d8]/60 px-2 py-1 text-[9px] font-black uppercase text-[#f1e5d8]">{format}</span>)}</div>
                  <div className="grid max-w-xl grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4"><DataPoint light label="Data">{ticket.session_date} · {ticket.session_time}</DataPoint><DataPoint light label="Sala">{ticket.room_name}</DataPoint><DataPoint light label="Poltronas">{ticketSeats(ticket)}</DataPoint><DataPoint light label="Total" accent>{money(ticket.total_amount)}</DataPoint></div>
                  <p className="mt-4 text-[11px] font-bold text-[#f1e5d8]/80">{snackSummary}</p>
                  <p className="mt-4 inline-flex border-2 border-secondary px-3 py-2 text-[10px] font-bold text-secondary">Chegue até 15:55 · Cancelamento disponível até 14:15</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-[#1d2948]/30 bg-[#f1e5d8] p-5 text-foreground md:border-l-2 md:border-t-0">
                  {renderQrButton(ticket, true)}<span className="font-mono text-[9px] tracking-widest text-foreground/65">{ticket.id}</span><button type="button" onClick={() => setSelectedTicketForQr(ticket)} className="bg-primary px-4 py-2.5 text-[10px] font-black uppercase text-primary-foreground">Ampliar QR</button>
                </div>
              </article>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(ticket.cinema_name)}`, '_blank')} className="inline-flex h-10 items-center gap-2 border-2 border-foreground px-3 text-[10px] font-black uppercase"><MapPin size={15}/> Como chegar</button>
                <button type="button" onClick={() => toast.success('Ingresso adicionado à carteira digital.')} className="inline-flex h-10 items-center gap-2 border-2 border-foreground px-3 text-[10px] font-black uppercase"><Wallet size={15}/> Adicionar à carteira</button>
                <TicketActions ticket={ticket} onShare={() => handleShareTicket(ticket)} onCancel={() => setCancelingTicket(ticket)}/>
              </div>
            </>; })()}
          </section>}
          {activeTickets.length > 1 && <section><SectionTitle title="Próximos" count={`${activeTickets.length - 1} sessões`}/><div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">{activeTickets.slice(1).map((ticket) => <CinemaTicket key={ticket.id} compact movieTitle={ticket.movie_title} cinemaName={ticket.cinema_name} roomName={ticket.room_name} seats={ticketSeats(ticket).split(', ')} date={ticket.session_date} time={ticket.session_time} ticketType={ticket.tickets.some((item) => item.type === 'VIP') ? 'vip' : 'standard'} ticketCategory={ticket.tickets.map((item) => item.type).join(' · ')} price={ticket.total_amount} audioFormat={ticket.audio_format} screenFormat={ticket.screen_format} code={ticket.id} qrCodeUrl={ticket.qr_code} onQrClick={() => setSelectedTicketForQr(ticket)} snacks={ticket.snacks.map(({ name, quantity }) => ({ name, quantity }))} notice="Cancelamento disponível até 2h antes da sessão" actionButtons={<><button type="button" onClick={() => setSelectedTicketForQr(ticket)} className="bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground">Ver QR</button><TicketActions ticket={ticket} onShare={() => handleShareTicket(ticket)} onCancel={() => setCancelingTicket(ticket)}/></>}/>)}</div></section>}
        </>}
      </div> : <HistoryView tickets={filteredHistory} historyTickets={historyTickets} historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} search={historySearch} setSearch={setHistorySearch} sortNewest={sortNewest} setSortNewest={setSortNewest} onQr={setSelectedTicketForQr} onShare={handleShareTicket}/>}
    </main>

    {selectedTicketForQr && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="QR Code do ingresso"><div className="w-full max-w-sm space-y-4 border-4 border-foreground bg-background p-5 text-center text-foreground">
      <div className="flex items-center justify-between border-b-2 border-foreground/30 pb-3 text-left"><div><span className="block text-[10px] font-black uppercase text-foreground/60">Apresente na catraca</span><h2 className="font-display font-black uppercase">{selectedTicketForQr.movie_title}</h2></div><button type="button" onClick={() => setSelectedTicketForQr(null)} aria-label="Fechar"><X size={22}/></button></div>
      <div className="mx-auto flex w-fit flex-col items-center gap-2 border-2 border-foreground bg-white p-3"><img src={qrImage(selectedTicketForQr, 420)} alt="QR Code de entrada" className="h-64 w-64 object-contain"/><span className="font-mono text-[10px] tracking-widest text-black">{selectedTicketForQr.id}</span></div>
      <p className="text-xs font-bold">{selectedTicketForQr.cinema_name} · {selectedTicketForQr.room_name}<br/><span className="text-primary">Assentos: {ticketSeats(selectedTicketForQr)}</span><br/>{selectedTicketForQr.session_date} às {selectedTicketForQr.session_time}</p><button type="button" onClick={() => setSelectedTicketForQr(null)} className="w-full bg-foreground py-2.5 text-xs font-black uppercase text-background">Fechar</button>
    </div></div>}

    <StatusModal isOpen={!!cancelingTicket} type="destruction" headerTitle="CANCELAR INGRESSO" description="Seu ingresso será invalidado na catraca e os assentos serão liberados para o público." deletionDetails={cancelingTicket ? { title: cancelingTicket.movie_title, subtitle: `${cancelingTicket.cinema_name} · ${cancelingTicket.session_date} às ${cancelingTicket.session_time}`, highlightText: `Reembolso integral de ${money(cancelingTicket.total_amount)} será estornado` } : undefined} primaryActionLabel="CONFIRMAR CANCELAMENTO E ESTORNO" secondaryActionLabel="MANTER MEU INGRESSO" onPrimaryAction={handleConfirmCancelTicket} onSecondaryAction={() => setCancelingTicket(null)} onClose={() => setCancelingTicket(null)}/>
  </div>;
}

function SectionTitle({ title, count }: { title: string; count?: string }) {
  return <SectionHeading title={title} size="medium" titleClassName="text-lg sm:text-xl" actions={count && <span className="font-mono text-[10px] text-foreground/65">{count}</span>} className="mb-4" />;
}

function HistoryView({ tickets, historyTickets, historyFilter, setHistoryFilter, search, setSearch, sortNewest, setSortNewest, onQr, onShare }: { tickets: BookingTransaction[]; historyTickets: BookingTransaction[]; historyFilter: HistoryFilter; setHistoryFilter: (filter: HistoryFilter) => void; search: string; setSearch: (value: string) => void; sortNewest: boolean; setSortNewest: (value: boolean) => void; onQr: (ticket: BookingTransaction) => void; onShare: (ticket: BookingTransaction) => void }) {
  const usedCount = historyTickets.filter((ticket) => ticket.status === 'USED').length;
  const cancelledCount = historyTickets.filter((ticket) => ticket.status === 'CANCELLED').length;
  const groups = tickets.reduce<Record<string, BookingTransaction[]>>((acc, ticket) => {
    const date = new Date(ticket.created_at);
    const label = `${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date)} ${date.getFullYear()}`;
    (acc[label] ??= []).push(ticket);
    return acc;
  }, {});

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'Todos' },
          { id: 'USED', label: `Utilizados (${usedCount})` },
          { id: 'CANCELLED', label: `Cancelados (${cancelledCount})` },
        ].map((option) => <button key={option.id} type="button" onClick={() => setHistoryFilter(option.id as HistoryFilter)} className={`border-2 px-3 py-2 text-[10px] font-black uppercase ${historyFilter === option.id ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/50 hover:border-primary'}`}>{option.label}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex h-10 items-center gap-2 border-2 border-foreground/40 px-3"><MagnifyingGlass size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar filme ou cinema" className="w-40 bg-transparent text-xs outline-none sm:w-52"/></label>
        <button type="button" onClick={() => setSortNewest(!sortNewest)} className="inline-flex h-10 items-center gap-2 border-2 border-foreground/40 px-3 text-[10px] font-bold">{sortNewest ? 'Mais recentes' : 'Mais antigos'} <CaretDown size={14}/></button>
      </div>
    </div>

    {tickets.length === 0 ? <div className="border-2 border-foreground/30 p-10 text-center text-sm text-foreground/70">Nenhum ingresso encontrado com esses filtros.</div> : Object.entries(groups).map(([month, monthTickets]) => <section key={month}>
      <SectionTitle title={month} count={`${monthTickets.length} ${monthTickets.length === 1 ? 'ingresso' : 'ingressos'}`}/>
      <div className="grid min-w-0 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {monthTickets.map((ticket) => {
          const isUsed = ticket.status === 'USED';
          return <CinemaTicket
            key={ticket.id}
            compact
            movieTitle={ticket.movie_title}
            cinemaName={ticket.cinema_name}
            roomName={ticket.room_name}
            seats={ticketSeats(ticket).split(', ')}
            date={ticket.session_date}
            time={ticket.session_time}
            ticketType={isUsed ? 'used' : 'cancelled'}
            ticketCategory={ticket.tickets.map((item) => item.type).join(' · ')}
            price={ticket.total_amount}
            audioFormat={ticket.audio_format}
            screenFormat={ticket.screen_format}
            code={ticket.id}
            qrCodeUrl={ticket.qr_code}
            onQrClick={() => onQr(ticket)}
            snacks={ticket.snacks.map(({ name, quantity }) => ({ name, quantity }))}
            notice={isUsed ? 'Sessão utilizada' : `Reembolsado ${money(ticket.total_amount)} · PIX · 03 jan`}
            actionButtons={isUsed ? <TicketActions ticket={ticket} onShare={() => onShare(ticket)}/> : <><button type="button" onClick={() => toast.success('Comprovante de reembolso baixado.')} className="border-2 border-foreground px-3 py-2 text-[10px] font-black uppercase">Ver comprovante</button><TicketActions ticket={ticket} onShare={() => onShare(ticket)}/></>}
          />;
        })}
      </div>
    </section>)}
    <p className="text-xs text-foreground/65">Ingressos utilizados podem virar cartas na sua coleção.</p>
  </div>;
}
