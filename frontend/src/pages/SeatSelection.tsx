import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  Copy,
  CheckCircle,
  CaretRight,
  FilmStrip
} from '@phosphor-icons/react';
import { OrderSummary, type OrderItem } from '../components/custom/order-summary';
import { toast } from 'sonner';

import posterSpeedRacer from '../assets/posters/29389-angel-dust-0-1000-0-1500-crop.jpg';

type BookingStep = 'seats' | 'tickets' | 'payment' | 'confirmation';
type TicketType = 'inteira' | 'meia' | 'itau' | 'club';
type PaymentMethod = 'pix' | 'credit_card';

interface SeatConfig {
  id: string;
  row: string;
  col: number;
  type: 'standard' | 'vip';
  isOccupied: boolean;
}

interface SnackItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

// Seat Row Layout matching the stadium curve in reference image:
const ROW_CONFIG: { row: string; count: number; startCol: number; isVip?: boolean }[] = [
  { row: 'A', count: 8, startCol: 3 },
  { row: 'B', count: 10, startCol: 2 },
  { row: 'C', count: 12, startCol: 1 },
  { row: 'D', count: 12, startCol: 1 },
  { row: 'E', count: 12, startCol: 1 },
  { row: 'F', count: 12, startCol: 1, isVip: true },
];

const INITIAL_OCCUPIED = new Set(['B4', 'C2', 'C6', 'C7', 'D1', 'D3', 'E5', 'E6', 'E9', 'F4', 'F5']);

const generateSeatMap = (): SeatConfig[] => {
  const seats: SeatConfig[] = [];

  ROW_CONFIG.forEach(({ row, count, startCol, isVip }) => {
    for (let i = 0; i < count; i++) {
      const col = startCol + i;
      const id = `${row}${col}`;
      seats.push({
        id,
        row,
        col,
        type: isVip ? 'vip' : 'standard',
        isOccupied: INITIAL_OCCUPIED.has(id),
      });
    }
  });

  return seats;
};

export function SeatSelection() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<BookingStep>('seats');
  const [seats] = useState<SeatConfig[]>(generateSeatMap);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketTypes, setTicketTypes] = useState<Record<string, TicketType>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [timerStarted, setTimerStarted] = useState<boolean>(false);
  const [pixGenerated, setPixGenerated] = useState<boolean>(false);

  // Optional snack combos
  const [snacks, setSnacks] = useState<SnackItem[]>([
    {
      id: 'snack-1',
      name: 'Combo Duplo (Pipoca G + 2 Refris 700ml)',
      description: 'Pipoca na manteiga crocante e 2 refrigerantes à escolha',
      price: 38.0,
      quantity: 0,
    },
    {
      id: 'snack-2',
      name: 'Balde de Colecionador Speed Racer',
      description: 'Balde metálico oficial em alto-relevo com pipoca doce/salgada',
      price: 46.0,
      quantity: 0,
    },
  ]);

  // Buyer information
  const [buyerName, setBuyerName] = useState('Uander Silva');
  const [buyerCpf, setBuyerCpf] = useState('123.456.789-00');
  const [buyerEmail, setBuyerEmail] = useState('uander@cinepass.com');

  // Countdown timer - only start after first seat selected
  useEffect(() => {
    if (!timerStarted || selectedSeatIds.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('O tempo de reserva expirou. Selecione seus assentos novamente.');
          setSelectedSeatIds([]);
          setTicketTypes({});
          setCurrentStep('seats');
          setTimerStarted(false);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted, selectedSeatIds.length]);

  const handleSeatClick = (seat: SeatConfig) => {
    if (seat.isOccupied) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      setTicketTypes((prev) => {
        const next = { ...prev };
        delete next[seat.id];
        return next;
      });
      // Stop timer if no seats selected
      if (selectedSeatIds.length === 1) {
        setTimerStarted(false);
      }
    } else {
      if (selectedSeatIds.length >= 8) {
        toast.warning('Limite máximo de 8 assentos por compra.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
      setTicketTypes((prev) => ({ ...prev, [seat.id]: 'inteira' }));
      
      // Start timer on first seat selection
      if (selectedSeatIds.length === 0) {
        setTimerStarted(true);
        toast.success(`Assento ${seat.id} selecionado! Timer iniciado.`);
      } else {
        toast.success(`Assento ${seat.id} selecionado!`);
      }
    }
  };

  const handleTicketTypeChange = (seatId: string, type: TicketType) => {
    setTicketTypes((prev) => ({ ...prev, [seatId]: type }));
  };

  const updateSnackQuantity = (id: string, delta: number) => {
    setSnacks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s))
    );
  };

  // Price calculations
  const calculateItems = (): OrderItem[] => {
    const ticketItems: OrderItem[] = selectedSeatIds.map((seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      const isVip = seat?.type === 'vip';
      const basePrice = isVip ? 64.0 : 52.0;
      const type = ticketTypes[seatId] || 'inteira';

      let price = basePrice;
      let labelType = 'Inteira';

      if (type === 'meia') {
        price = basePrice / 2;
        labelType = 'Meia-Entrada';
      } else if (type === 'itau') {
        price = basePrice / 2;
        labelType = 'Itaú 50%';
      } else if (type === 'club') {
        price = basePrice / 2;
        labelType = 'Cine-Pass Club';
      }

      return {
        label: `1x ${labelType} (${seatId}${isVip ? ' VIP' : ''})`,
        price,
      };
    });

    const snackItems: OrderItem[] = snacks
      .filter((s) => s.quantity > 0)
      .map((s) => ({
        label: `${s.quantity}x ${s.name}`,
        price: s.price * s.quantity,
      }));

    return [...ticketItems, ...snackItems];
  };

  const items = calculateItems();
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = selectedSeatIds.length > 0 ? 5.0 : 0.0;
  const totalPrice = subtotal + serviceFee;

  const handleNextStep = () => {
    if (currentStep === 'seats') {
      if (selectedSeatIds.length === 0) {
        toast.warning('Por favor, selecione ao menos 1 assento.');
        return;
      }
      setCurrentStep('tickets');
    } else if (currentStep === 'tickets') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (paymentMethod === 'pix') {
        // Check if time is too low for PIX
        if (timeLeft < 90) {
          toast.error('Tempo insuficiente para pagamento via PIX. Por favor, resete a seleção ou escolha cartão.');
          return;
        }
        
        if (!pixGenerated) {
          toast.warning('Clique em "Gerar Código PIX" para continuar.');
          return;
        }
      }
      
      toast.success('Pagamento confirmado com sucesso!');
      setCurrentStep('confirmation');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'tickets') {
      setCurrentStep('seats');
    } else if (currentStep === 'payment') {
      setCurrentStep('tickets');
    } else if (currentStep === 'seats') {
      navigate(-1);
    }
  };

  return (
    <div className="bg-background text-foreground pb-6 font-display">
      {/* ─── 1. TOP HEADER NAVIGATION (CENTERED STEP PROGRESS ONLY) ─── */}
      <section className=" sticky top-0 z-30 pt-4">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-center">
          {/* Stepper Progress Indicator Centered */}
          <div className="flex items-center gap-2 text-xs font-black">
            <span
              onClick={() => setCurrentStep('seats')}
              className={`cursor-pointer px-3 py-1.5 border transition-all ${
                currentStep === 'seats'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground/70 border-foreground/30 hover:bg-muted'
              }`}
            >
              1. Sala
            </span>
            <CaretRight size={12} weight="bold" className="self-center" />
            <span
              onClick={() => selectedSeatIds.length > 0 && setCurrentStep('tickets')}
              className={`cursor-pointer px-3 py-1.5 border transition-all ${
                currentStep === 'tickets'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground/70 border-foreground/30 hover:bg-muted'
              }`}
            >
              2. Tipo de Ingresso
            </span>
            <CaretRight size={12} weight="bold" className="self-center" />
            <span
              onClick={() => selectedSeatIds.length > 0 && setCurrentStep('payment')}
              className={`cursor-pointer px-3 py-1.5 border transition-all ${
                currentStep === 'payment' || currentStep === 'confirmation'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground/70 border-foreground/30 hover:bg-muted'
              }`}
            >
              3. Pagamento
            </span>
          </div>
        </div>
      </section>

      {/* ─── 2. MAIN 2-COLUMN LAYOUT: ETAPA NA ESQUERDA + RESUMO FIXO NA DIREITA ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ◄◄ ESQUERDA: CONTEÚDO DA ETAPA ATUAL (SALA > TIPO DE INGRESSO > PAGAMENTO) ◄◄ */}
          <div className="lg:col-span-9 xl:col-span-8 w-full space-y-6">

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ETAPA 1: SALA & SELEÇÃO DE ASSENTOS (STADIUM CURVED MAP)          */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {currentStep === 'seats' && (
              <div className="bg-background border-4 border-foreground/40 p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--border)] space-y-8 flex flex-col items-center">
                {/* Screen Projection Header */}
                <div className="w-full text-center space-y-3">
                  <span className="font-display font-black text-xs uppercase tracking-[0.3em] text-foreground/50">
                    TELA
                  </span>
                  <div className="w-full max-w-lg mx-auto h-2 bg-foreground/20 rounded-full" />
                </div>

                {/* Stadium Curved Grid matching Image 1 */}
                <div className="w-full overflow-x-auto pb-4 flex justify-center scrollbar-thin">
                  <div className="space-y-2.5 sm:space-y-3 min-w-[340px]">
                    {ROW_CONFIG.map(({ row, isVip }) => {
                      const rowSeats = seats.filter((s) => s.row === row);

                      return (
                        <div key={row} className="flex items-center justify-center gap-3 sm:gap-4">
                          <span className="w-4 text-center font-bold text-xs text-foreground/50">{row}</span>

                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            {rowSeats.map((seat) => {
                              const isSelected = selectedSeatIds.includes(seat.id);

                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  onClick={() => handleSeatClick(seat)}
                                  disabled={seat.isOccupied}
                                  title={`Assento ${seat.id}${isVip ? ' (VIP)' : ''}`}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] sm:rounded-[8px] transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold ${
                                    seat.isOccupied
                                      ? 'bg-foreground/15 text-transparent border border-transparent cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-secondary text-white border-2 border-secondary shadow-sm scale-105'
                                      : isVip
                                      ? 'border-2 border-primary bg-primary/10 text-transparent hover:border-secondary hover:scale-105'
                                      : 'bg-background border border-foreground/30 text-transparent hover:border-secondary hover:scale-105'
                                  }`}
                                />
                              );
                            })}
                          </div>

                          <span className="w-4 text-center font-bold text-xs text-foreground/50">{row}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Legend matching Image 1 */}
                <div className="pt-4 border-t-2 border-foreground/10 flex flex-wrap items-center justify-center gap-6 text-xs font-bold font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[4px] bg-background border border-foreground/30" />
                    <span className="text-foreground/80">Livre</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[4px] bg-secondary border-2 border-secondary" />
                    <span className="text-foreground/80">Selecionado</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[4px] bg-foreground/15" />
                    <span className="text-foreground/80">Ocupado</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[4px] border-2 border-primary bg-primary/10" />
                    <span className="text-foreground/80">VIP</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ETAPA 2: ESCOLHA DO TIPO DE INGRESSO (INTEIRA / MEIA / CLUBE)     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {currentStep === 'tickets' && (
              <div className="space-y-6">
                <div className="bg-background border-4 border-foreground/40 p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">
                      Escolha o tipo de ingresso
                    </h2>
                    <p className="font-sans text-xs text-foreground/70 mt-1">
                      Defina a modalidade de entrada para cada um dos assentos selecionados.
                    </p>
                  </div>

                  {/* Cards per selected seat */}
                  <div className="space-y-4">
                    {selectedSeatIds.map((seatId) => {
                      const seat = seats.find((s) => s.id === seatId);
                      const isVip = seat?.type === 'vip';
                      const basePrice = isVip ? 64.0 : 52.0;
                      const halfPrice = basePrice / 2;
                      const currentType = ticketTypes[seatId] || 'inteira';

                      return (
                        <div
                          key={seatId}
                          className="p-4 bg-background border-2 border-foreground/40 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-foreground/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                                Assento {seatId}
                              </span>
                              {isVip && (
                                <span className="bg-secondary text-secondary-foreground font-black text-[10px] px-2 py-0.5 uppercase">
                                  Poltrona VIP
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-sans text-muted-foreground">
                              Valor Base: <strong>R$ {basePrice.toFixed(2).replace('.', ',')}</strong>
                            </span>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Inteira */}
                            <button
                              type="button"
                              onClick={() => handleTicketTypeChange(seatId, 'inteira')}
                              className={`p-3 text-left border-2 transition-all cursor-pointer ${
                                currentType === 'inteira'
                                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                                  : 'bg-background text-foreground border-foreground/30 hover:bg-muted/30'
                              }`}
                            >
                              <div className="font-black text-xs uppercase">Inteira</div>
                              <div className="font-sans text-[11px] opacity-80">Padrão sem desconto</div>
                              <div className="text-sm font-black mt-2">R$ {basePrice.toFixed(2).replace('.', ',')}</div>
                            </button>

                            {/* Meia */}
                            <button
                              type="button"
                              onClick={() => handleTicketTypeChange(seatId, 'meia')}
                              className={`p-3 text-left border-2 transition-all cursor-pointer ${
                                currentType === 'meia'
                                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                                  : 'bg-background text-foreground border-foreground/30 hover:bg-muted/30'
                              }`}
                            >
                              <div className="font-black text-xs uppercase">Meia-Entrada</div>
                              <div className="font-sans text-[11px] opacity-80">Estudante / Idoso / PCD</div>
                              <div className="text-sm font-black mt-2">R$ {halfPrice.toFixed(2).replace('.', ',')}</div>
                            </button>

                            {/* Itaú 50% */}
                            <button
                              type="button"
                              onClick={() => handleTicketTypeChange(seatId, 'itau')}
                              className={`p-3 text-left border-2 transition-all cursor-pointer ${
                                currentType === 'itau'
                                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                                  : 'bg-background text-foreground border-foreground/30 hover:bg-muted/30'
                              }`}
                            >
                              <div className="font-black text-xs uppercase">Itaú 50%</div>
                              <div className="font-sans text-[11px] opacity-80">Cartões Itaú Débito/Crédito</div>
                              <div className="text-sm font-black mt-2">R$ {halfPrice.toFixed(2).replace('.', ',')}</div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Snacks & Combos Box */}
                <div className="bg-background border-4 border-foreground/40 p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-foreground">Bomboniere & Combos de Pipoca</h3>
                    <p className="font-sans text-xs text-foreground/70">
                      Adicione itens para retirar na fila expressa do cinema.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {snacks.map((snack) => (
                      <div
                        key={snack.id}
                        className="p-4 bg-background border-2 border-foreground/40 flex flex-col justify-between space-y-3 shadow-sm"
                      >
                        <div>
                          <h4 className="font-black text-sm text-foreground">{snack.name}</h4>
                          <p className="font-sans text-xs text-foreground/70 mt-0.5">{snack.description}</p>
                          <div className="text-sm font-black text-primary mt-2">
                            R$ {snack.price.toFixed(2).replace('.', ',')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-foreground/20">
                          <span className="font-sans text-xs font-bold text-foreground/70">Quantidade</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateSnackQuantity(snack.id, -1)}
                              disabled={snack.quantity === 0}
                              className="w-7 h-7 bg-background border-2 border-foreground/40 text-foreground font-black flex items-center justify-center hover:bg-muted/30 disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-black text-sm">{snack.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateSnackQuantity(snack.id, 1)}
                              className="w-7 h-7 bg-primary text-primary-foreground border-2 border-primary font-black flex items-center justify-center hover:bg-primary/90 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ETAPA 3: PAGAMENTO (DADOS PESSOAIS → PIX/CARTÃO)                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                
                {/* Buyer Information Section - FIRST */}
                <div className="bg-background border-4 border-foreground/40 p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">Dados para Envio do Ingresso</h2>
                    <p className="font-sans text-xs text-foreground/70 mt-1">
                      Insira suas informações para receber os vouchers digitais.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-foreground/70">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Nome Completo"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full bg-background border-2 border-foreground/30 px-3 py-2.5 text-sm font-sans text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-foreground/70">CPF</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={buyerCpf}
                        onChange={(e) => setBuyerCpf(e.target.value)}
                        className="w-full bg-background border-2 border-foreground/30 px-3 py-2.5 text-sm font-sans text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-foreground/70">E-mail</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="w-full bg-background border-2 border-foreground/30 px-3 py-2.5 text-sm font-sans text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Section - SECOND */}
                <div className="bg-background border-4 border-foreground/40 p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--border)] space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">Forma de Pagamento</h2>
                    <p className="font-sans text-xs text-foreground/70 mt-1">
                      Selecione o meio de pagamento para emitir seus ingressos digitais.
                    </p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('pix');
                        setPixGenerated(false);
                      }}
                      className={`p-4 border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)]'
                          : 'bg-background text-foreground border-foreground/40 hover:bg-muted'
                      }`}
                    >
                      <QrCode size={22} weight="bold" />
                      <span className="font-black text-sm">PIX Instantâneo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-4 border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'credit_card'
                          ? 'bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_var(--border)]'
                          : 'bg-background text-foreground border-foreground/40 hover:bg-muted'
                      }`}
                    >
                      <CreditCard size={22} weight="bold" />
                      <span className="font-black text-sm">Cartão de Crédito</span>
                    </button>
                  </div>

                  {/* PIX Content Area */}
                  {paymentMethod === 'pix' && (
                    <div className="p-6 bg-background border-2 border-foreground/40 space-y-5 text-center shadow-sm">
                      
                      {/* Warning if time is low */}
                      {timeLeft < 90 && (
                        <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-left">
                          <span className="font-black text-xs block mb-1">⚠️ TEMPO INSUFICIENTE</span>
                          <span className="font-sans text-xs">
                            Menos de 1:30 restante. Por favor, resete a seleção de assentos ou escolha pagamento por cartão.
                          </span>
                        </div>
                      )}
                      
                      {!pixGenerated ? (
                        <div className="space-y-4 py-6">
                          <div className="w-32 h-32 mx-auto bg-muted/20 border-2 border-dashed border-foreground/30 flex items-center justify-center">
                            <QrCode size={72} className="text-foreground/40" weight="bold" />
                          </div>
                          <p className="font-sans text-sm text-foreground/70 max-w-md mx-auto">
                            Clique no botão abaixo para gerar o código PIX e concluir o pagamento instantaneamente.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (timeLeft < 90) {
                                toast.error('Tempo insuficiente para PIX. Escolha cartão ou resete os assentos.');
                                return;
                              }
                              setPixGenerated(true);
                              toast.success('Código PIX gerado com sucesso!');
                            }}
                            disabled={timeLeft < 90}
                            className="px-8 py-3 bg-primary text-primary-foreground font-black text-sm uppercase shadow-[3px_3px_0px_0px_var(--border)] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Gerar Código PIX
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-44 h-44 mx-auto bg-background border-2 border-foreground/40 p-2 flex items-center justify-center shadow-sm">
                            {/* Visual QR Code Mock */}
                            <div className="w-full h-full border-2 border-dashed border-foreground/30 flex flex-col items-center justify-center p-2 bg-foreground/5">
                              <QrCode size={96} className="text-primary" weight="bold" />
                              <span className="text-[9px] font-sans text-muted-foreground uppercase font-bold mt-1">
                                QR Code Dinâmico PIX
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="font-black text-xs text-foreground uppercase">Código Copia e Cola</span>
                            <div className="flex items-center gap-2 max-w-md mx-auto">
                              <input
                                type="text"
                                readOnly
                                value="00020126580014br.gov.bcb.pix0136cinepass-speed-racer-pix5204000053039865802BR"
                                className="flex-1 bg-muted/50 border-2 border-foreground/30 px-3 py-2 text-xs font-mono text-foreground/80 outline-none select-all"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText('00020126580014br.gov.bcb.pix0136cinepass-speed-racer-pix5204000053039865802BR');
                                  toast.success('Código PIX copiado!');
                                }}
                                className="px-3.5 py-2 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Copy size={16} />
                                <span>Copiar</span>
                              </button>
                            </div>
                          </div>

                          <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto">
                            Abra o app do seu banco, escolha <strong>Pagar com PIX</strong> e escaneie o código ou cole a chave acima. A aprovação é imediata!
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Credit Card Content Area */}
                  {paymentMethod === 'credit_card' && (
                    <div className="p-6 bg-background border-2 border-foreground/40 space-y-4 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-foreground/70">Número do Cartão</label>
                        <input
                          type="text"
                          placeholder="•••• •••• •••• ••••"
                          defaultValue="4532 •••• •••• 8892"
                          className="w-full bg-background border-2 border-foreground/30 px-3.5 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-black uppercase text-foreground/70">Validade</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            defaultValue="08/29"
                            className="w-full bg-background border-2 border-foreground/30 px-3.5 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-black uppercase text-foreground/70">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            defaultValue="789"
                            className="w-full bg-background border-2 border-foreground/30 px-3.5 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-foreground/70">Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          defaultValue="UANDER SILVA"
                          className="w-full bg-background border-2 border-foreground/30 px-3.5 py-2.5 text-sm font-sans uppercase text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ETAPA 4: INGRESSO DIGITAL EMITIDO COM SUCESSO!                   */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {currentStep === 'confirmation' && (
                <div className="bg-background border-4 border-foreground/40 p-8 shadow-[6px_6px_0px_0px_var(--border)] text-center space-y-6">
                <div className="w-16 h-16 bg-success text-white rounded-none border-2 border-foreground/40 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle size={36} weight="fill" />
                </div>

                <div>
                  <span className="text-xs font-black uppercase text-primary tracking-widest block">
                    Compra Realizada com Sucesso!
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                    Seu Ingresso Digital Está Pronto
                  </h2>
                  <p className="font-sans text-xs text-foreground/70 max-w-md mx-auto mt-2">
                    Enviamos uma cópia com os vouchers e comprovante para <strong>{buyerEmail}</strong>.
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="max-w-md mx-auto bg-background border-4 border-foreground/40 p-6 space-y-4 shadow-[4px_4px_0px_0px_var(--border)] text-left">
                  <div className="flex items-center justify-between border-b-2 border-foreground/30 pb-3">
                    <div className="flex items-center gap-2">
                      <FilmStrip size={22} className="text-primary" weight="bold" />
                      <span className="font-black text-base text-foreground">SPEED RACER</span>
                    </div>
                    <span className="bg-[#3B82F6] text-white font-black text-[10px] px-2 py-0.5">10</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Cinema</span>
                      <strong className="text-foreground font-display">Cinemark Bourbon</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Sala & Formato</span>
                      <strong className="text-foreground font-display">Sala 4 • IMAX Laser (LEG)</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Data & Horário</span>
                      <strong className="text-foreground font-display">Hoje, 20 Ago • 16:15</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Assentos</span>
                      <strong className="text-primary font-display text-sm">{selectedSeatIds.join(', ')}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-dashed border-foreground/30 text-center space-y-2">
                    <div className="w-36 h-36 mx-auto bg-background border-2 border-foreground/40 p-2 flex items-center justify-center shadow-sm">
                      <QrCode size={110} className="text-primary" weight="bold" />
                    </div>
                    <span className="font-mono text-xs font-black tracking-widest text-foreground/80 block">
                      CP-8842-SPEED-IMAX
                    </span>
                    <span className="font-sans text-[10px] text-muted-foreground block">
                      Apresente este QR Code direto na entrada da sala
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase shadow-[3px_3px_0px_0px_var(--border)] hover:bg-primary/90 cursor-pointer"
                  >
                    Voltar para a Home
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ►► DIREITA: COMPONENTE RESUMO DO PEDIDO FIXO NA DIREITA COM LARGURA ADAPTADA ►► */}
          <div className="lg:col-span-5 xl:col-span-4 w-full sticky top-20">
            <OrderSummary
              movieTitle="SPEED RACER"
              moviePoster={posterSpeedRacer}
              cinemaName="Cinemark Bourbon"
              cinemaLocation="Perdizes, São Paulo"
              sessionRoomTime="Sala 4 · Sex 20/08 · 16:15"
              ratingBadge="10"
              formatBadges={['IMAX', 'LEGENDADO']}
              seats={selectedSeatIds}
              items={items}
              subtotal={subtotal}
              serviceFee={serviceFee}
              totalPrice={totalPrice}
              showTimer={currentStep !== 'confirmation' && timerStarted}
              timerSeconds={timeLeft}
              onConfirm={currentStep === 'confirmation' ? () => navigate('/') : handleNextStep}
              confirmButtonText={
                currentStep === 'seats'
                  ? 'Avançar →'
                  : currentStep === 'tickets'
                  ? 'Pagamento →'
                  : currentStep === 'payment'
                  ? paymentMethod === 'pix' 
                    ? (pixGenerated ? 'Confirmar Pagamento PIX' : 'Aguardando Código PIX')
                    : 'Pagar com Cartão →'
                  : 'Voltar para Home'
              }
              disabledConfirm={
                selectedSeatIds.length === 0 || 
                (currentStep === 'payment' && paymentMethod === 'pix' && !pixGenerated)
              }
            />
            
            {/* Back Button below summary */}
            {currentStep !== 'confirmation' && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-full mt-3 px-4 py-2.5 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Voltar</span>
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
