import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Ticket,
  MapPin,
  ShareNetwork,
  DownloadSimple,
  FilmStrip,
  X,
  CaretRight,
  Clock,
  ShieldCheck,
  Trash
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CinemaTicket } from '../components/custom/cinema-ticket';
import { StatusModal } from '../components/custom/status-modal';
import { MOCK_USER_TICKETS } from '../mocks';
import type { BookingTransaction } from '../types/booking';

export function Tickets() {
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [ticketList, setTicketList] = useState<BookingTransaction[]>(MOCK_USER_TICKETS);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<BookingTransaction | null>(
    id ? ticketList.find((t) => t.id === id) || null : null
  );
  const [cancelingTicket, setCancelingTicket] = useState<BookingTransaction | null>(null);

  // Active tickets vs Past History
  const activeTickets = ticketList.filter((t) => t.status === 'PAID');
  const historyTickets = ticketList.filter((t) => t.status !== 'PAID');

  const displayedTickets = activeTab === 'active' ? activeTickets : historyTickets;

  const handleShareTicket = (ticket: BookingTransaction) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Meu ingresso para ${ticket.movie_title} no ${ticket.cinema_name} (${ticket.session_date} às ${ticket.session_time})! Código: ${ticket.id}`
      );
      toast.success('Informações do ingresso copiadas para a área de transferência!');
    }
  };

  const handleConfirmCancelTicket = () => {
    if (!cancelingTicket) return;

    setTicketList((prev) =>
      prev.map((t) => (t.id === cancelingTicket.id ? { ...t, status: 'CANCELLED' as const } : t))
    );
    toast.success(`Ingresso ${cancelingTicket.id} cancelado com sucesso! Reembolso de R$ ${cancelingTicket.total_amount.toFixed(2)} processado.`);
    setCancelingTicket(null);
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. TOP HEADER & TABS ─── */}
      <section className="bg-background px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ticket size={24} weight="bold" className="text-primary" />
                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                  Cine-Pass Wallet
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
                Meus Ingressos
              </h1>
            </div>

            {/* Quick action to explore movies */}
            <Link
              to="/movies"
              className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Explorar Sessões</span>
              <CaretRight size={14} weight="bold" />
            </Link>
          </div>

          {/* Guidelines Box */}
          <div className="p-3.5 bg-muted/20 border-2 border-foreground/20 flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-foreground/80">
            <div className="flex items-center gap-2">
              <Clock size={16} weight="bold" className="text-primary shrink-0" />
              <span>Chegue com <strong>20 minutos de antecedência</strong> para validar o QR Code na catraca.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} weight="bold" className="text-secondary shrink-0" />
              <span>Cancelamento e reembolso disponíveis até <strong>2 horas antes</strong> da sessão.</span>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                activeTab === 'active'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              Sessões Ativas ({activeTickets.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              Histórico &amp; Cancelados ({historyTickets.length})
            </button>
          </div>

        </div>
      </section>

      {/* ─── 2. TICKETS GRID ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        {displayedTickets.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-4 shadow-[6px_6px_0px_0px_var(--border)] max-w-xl mx-auto">
            <Ticket size={48} className="text-foreground/40 mx-auto" weight="bold" />
            <h3 className="text-lg font-black uppercase text-foreground">
              {activeTab === 'active' ? 'Você não tem ingressos ativos no momento' : 'Nenhum ingresso no histórico'}
            </h3>
            <p className="font-sans text-xs text-foreground/70 leading-relaxed">
              {activeTab === 'active'
                ? 'Navegue pelo nosso catálogo de estreias e garanta seus assentos com som e imagem de alta fidelidade.'
                : 'Seus ingressos anteriores aparecerão aqui após as sessões.'}
            </p>
            <Link
              to="/movies"
              className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--border)] hover:bg-primary/90 transition-all"
            >
              Ver Filmes em Cartaz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {displayedTickets.map((ticket) => {
              const isActive = ticket.status === 'PAID';

              return (
                <div key={ticket.id} className="space-y-3 w-full max-w-[340px]">
                  {/* CinemaTicket Boarding Pass Component */}
                  <CinemaTicket
                    id={ticket.id}
                    movieTitle={ticket.movie_title}
                    cinemaName={ticket.cinema_name}
                    roomName={ticket.room_name}
                    date={ticket.session_date}
                    time={ticket.session_time}
                    ticketType={ticket.status === 'CANCELLED' ? 'cancelled' : 'standard'}
                    price={ticket.total_amount}
                    audioFormat={ticket.audio_format}
                    screenFormat={ticket.screen_format}
                    code={ticket.id}
                    qrCodeUrl={ticket.qr_code}
                    seats={ticket.tickets.map((t) => t.seatId)}
                    snacks={ticket.snacks}
                    onQrClick={() => setSelectedTicketForQr(ticket)}
                  />

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isActive ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://maps.google.com/?q=${encodeURIComponent(ticket.cinema_name)}`,
                              '_blank'
                            )
                          }
                          className="flex-1 py-2 px-3 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-[11px] uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MapPin size={15} weight="bold" className="text-primary" />
                          <span>Como Chegar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancelingTicket(ticket)}
                          className="py-2 px-3 bg-background hover:bg-destructive/10 border-2 border-destructive text-destructive font-black text-[11px] uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] flex items-center justify-center gap-1 cursor-pointer"
                          title="Cancelar ingresso e solicitar reembolso"
                        >
                          <Trash size={14} weight="bold" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/movies/${ticket.movie_id}`}
                        className="flex-1 py-2 px-3 bg-primary text-primary-foreground font-black text-[11px] uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] flex items-center justify-center gap-1.5"
                      >
                        <FilmStrip size={15} weight="bold" />
                        <span>Avaliar Filme</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleShareTicket(ticket)}
                      title="Compartilhar ingresso"
                      className="w-9 h-9 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                    >
                      <ShareNetwork size={16} weight="bold" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toast.success('Comprovante de compra baixado em PDF!')}
                      title="Baixar comprovante PDF"
                      className="w-9 h-9 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_var(--border)] cursor-pointer"
                    >
                      <DownloadSimple size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── 3. EXPANDED QR CODE MODAL FOR CINEMA TURNSTILES ─── */}
      {selectedTicketForQr && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border-4 border-foreground text-foreground max-w-sm w-full p-6 space-y-4 shadow-[8px_8px_0px_0px_var(--border)] text-center animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-foreground/30 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-foreground/60 block">
                  Apresente na Catraca
                </span>
                <h3 className="text-base font-black uppercase text-foreground">
                  {selectedTicketForQr.movie_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForQr(null)}
                className="text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X size={22} weight="bold" />
              </button>
            </div>

            {/* QR Code Container with High-Contrast White Background */}
            <div className="p-4 bg-white border-4 border-foreground shadow-[4px_4px_0px_0px_var(--border)] flex flex-col items-center justify-center space-y-2">
              <img
                src={selectedTicketForQr.qr_code}
                alt="QR Code de Entrada"
                className="w-52 h-52 object-contain"
              />
              <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
                {selectedTicketForQr.id}
              </span>
            </div>

            {/* Session Summary */}
            <div className="text-xs font-bold text-foreground/80 space-y-0.5">
              <p>
                {selectedTicketForQr.cinema_name} • <strong>{selectedTicketForQr.room_name}</strong>
              </p>
              <p className="text-primary font-black">
                Assentos: {selectedTicketForQr.tickets.map((t) => t.seatId).join(', ')}
              </p>
              <p className="text-[11px] text-foreground/60">
                {selectedTicketForQr.session_date} às {selectedTicketForQr.session_time}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedTicketForQr(null)}
              className="w-full py-2.5 bg-foreground text-background font-black text-xs uppercase tracking-wider border-2 border-foreground hover:opacity-90 transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. STANDARDIZED CANCEL TICKET STATUS MODAL ─── */}
      <StatusModal
        isOpen={!!cancelingTicket}
        type="destruction"
        headerTitle="CANCELAR INGRESSO"
        description="Seu ingresso será invalidado na catraca e os assentos serão liberados imediatamente para o público."
        deletionDetails={
          cancelingTicket
            ? {
                title: cancelingTicket.movie_title,
                subtitle: `${cancelingTicket.cinema_name} · ${cancelingTicket.session_date} às ${cancelingTicket.session_time}`,
                highlightText: `Reembolso integral de R$ ${cancelingTicket.total_amount.toFixed(2)} será estornado`,
              }
            : undefined
        }
        primaryActionLabel="‹ CONFIRMAR CANCELAMENTO E ESTORNO"
        secondaryActionLabel="MANTER MEU INGRESSO"
        onPrimaryAction={handleConfirmCancelTicket}
        onSecondaryAction={() => setCancelingTicket(null)}
        onClose={() => setCancelingTicket(null)}
      />

    </div>
  );
}
