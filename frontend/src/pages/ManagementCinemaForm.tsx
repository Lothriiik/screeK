import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Buildings,
  ArrowLeft,
  Plus,
  Trash,
  CheckCircle,
  MapPin,
  FloppyDisk,
  Armchair,
  Sparkle,
  Phone,
  EnvelopeSimple,
  Clock,
  Warning,
  Tag,
  Percent,
  CaretDown,
  Calendar as CalendarIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import type { Cinema, Room, RoomType, CinemaPricingItem } from '../types/cinema';
import { CinemaFormSectionHeading } from '../components/custom/cinema-form-section-heading';
import { CinemaRoomEditor } from '../components/custom/cinema-room-editor';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';

const AVAILABLE_AMENITIES = [
  'IMAX LASER',
  '4DX',
  'VIP',
  'DOLBY ATMOS',
  'D-BOX',
  'CINÉPIC LASER',
  'ESTACIONAMENTO',
  'ESTACIONAMENTO VIP',
  'AUTOATENDIMENTO',
  'SERVIÇO DE GARÇOM',
  'POLTRONAS NAMORADEIRAS',
  'PCD',
  'AR CONDICIONADO',
];

const ROOM_TYPES: RoomType[] = ['STANDARD', 'IMAX', 'VIP', '4DX', 'D-BOX', 'CINEPIC'];
const STATE_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const CITIES_BY_STATE: Record<string, string[]> = {
  AC: ['Rio Branco'], AL: ['Maceió', 'Arapiraca'], AP: ['Macapá'], AM: ['Manaus'], BA: ['Salvador', 'Feira de Santana'],
  CE: ['Fortaleza'], DF: ['Brasília'], ES: ['Vitória'], GO: ['Goiânia'], MA: ['São Luís'], MT: ['Cuiabá'],
  MS: ['Campo Grande'], MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'], PA: ['Belém'], PB: ['João Pessoa'],
  PR: ['Curitiba', 'Londrina', 'Maringá'], PE: ['Recife'], PI: ['Teresina'], RJ: ['Rio de Janeiro', 'Niterói', 'Petrópolis'],
  RN: ['Natal'], RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'], RO: ['Porto Velho'], RR: ['Boa Vista'],
  SC: ['Florianópolis', 'Joinville'], SP: ['São Paulo', 'Araraquara', 'Campinas', 'Santos', 'Ribeirão Preto'],
  SE: ['Aracaju'], TO: ['Palmas'],
};
const PROJECTION_AUDIO_OPTIONS = [
  'Digital 2K · Dolby 7.1',
  'Laser 4K · Dolby Atmos',
  'IMAX Laser · IMAX 12-Channel',
  '4DX · Dolby Atmos',
  'VIP Laser · Dolby Atmos',
  'Cinepic Laser · Dolby Atmos',
  'D-BOX · Dolby Atmos',
  'Digital 2K · Dolby 5.1',
  'Laser 4K · DTS:X',
  'Standard Digital · Stereo',
  'RealD 3D · Dolby Atmos',
  'ScreenX · Dolby Atmos',
];

export interface DaySchedule {
  day: string;
  shortDay: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ScheduleNotice {
  id: string;
  date: string;
  type: 'special_hours' | 'closed' | 'event';
  openTime?: string;
  closeTime?: string;
  message: string;
}

export interface CinemaPromotion {
  id: string;
  name: string;
  type: 'half_price' | 'fixed_price' | 'percentage_off' | 'value_off';
  discountValue?: number;
  days: string[];
  roomTypes: string[];
  description: string;
  isActive: boolean;
}

const DEFAULT_DAYS_SCHEDULE: DaySchedule[] = [
  { day: 'Segunda-feira', shortDay: 'SEG', isOpen: true, openTime: '13:00', closeTime: '23:30' },
  { day: 'Terça-feira', shortDay: 'TER', isOpen: true, openTime: '13:00', closeTime: '23:30' },
  { day: 'Quarta-feira', shortDay: 'QUA', isOpen: true, openTime: '13:00', closeTime: '23:30' },
  { day: 'Quinta-feira', shortDay: 'QUI', isOpen: true, openTime: '13:00', closeTime: '23:30' },
  { day: 'Sexta-feira', shortDay: 'SEX', isOpen: true, openTime: '13:00', closeTime: '00:00' },
  { day: 'Sábado', shortDay: 'SÁB', isOpen: true, openTime: '12:00', closeTime: '00:00' },
  { day: 'Domingo', shortDay: 'DOM', isOpen: true, openTime: '12:00', closeTime: '23:00' },
];

export function ManagementCinemaForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'dados' | 'salas' | 'precos'>('dados');

  const isEditing = Boolean(id);
  const existingCinema = useMemo(() => {
    return isEditing ? MOCK_CINEMAS.find((c) => c.id === id) : null;
  }, [id, isEditing]);

  // Operating Hours Config States
  const [hoursMode, setHoursMode] = useState<'UNIFIED' | 'BY_DAY'>('UNIFIED');
  const [unifiedOpenTime, setUnifiedOpenTime] = useState('13:00');
  const [unifiedCloseTime, setUnifiedCloseTime] = useState('23:30');
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_DAYS_SCHEDULE);
  
  // Specific day changes / notices (exceções, feriados, manutenções)
  const [scheduleNotices, setScheduleNotices] = useState<ScheduleNotice[]>([
    {
      id: 'notice-1',
      date: '2026-12-25',
      type: 'special_hours',
      openTime: '15:00',
      closeTime: '23:00',
      message: 'Abertura especial após as celebrações de Natal.',
    },
  ]);
  const [calendarOpenForNotice, setCalendarOpenForNotice] = useState<string | null>(null);

  // Promotions / Discounts state
  const [promotions, setPromotions] = useState<CinemaPromotion[]>([
    {
      id: 'promo-1',
      name: 'Quarta do Cinema (Todo Mundo Paga Meia)',
      type: 'half_price',
      days: ['QUA'],
      roomTypes: ['STANDARD', 'IMAX', 'VIP'],
      description: 'Ingressos pela metade do preço em todas as sessões e formatos.',
      isActive: true,
    },
    {
      id: 'promo-2',
      name: 'Segunda Irresistível',
      type: 'fixed_price',
      discountValue: 15.0,
      days: ['SEG'],
      roomTypes: ['STANDARD'],
      description: 'Preço único promocional de R$ 15,00 nas salas Standard.',
      isActive: true,
    },
  ]);

  const handleAddPromotion = () => {
    const newPromo: CinemaPromotion = {
      id: `promo-${Date.now()}`,
      name: 'Nova Promoção',
      type: 'percentage_off',
      discountValue: 50,
      days: ['TER', 'QUI'],
      roomTypes: ['STANDARD'],
      description: 'Desconto especial nas sessões selecionadas.',
      isActive: true,
    };
    setPromotions((prev) => [...prev, newPromo]);
  };

  const handleUpdatePromotion = (id: string, field: keyof CinemaPromotion, value: any) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  const [formData, setFormData] = useState({
    name: '',
    chain: 'Cinemark',
    address: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '',
    phone: '',
    email: '',
    hours: 'Aberto hoje das 13:00 às 23:30',
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
    amenities: ['IMAX LASER', 'AUTOATENDIMENTO', 'PCD', 'ESTACIONAMENTO'] as string[],
    rooms: [
      { id: 1, cinema_id: 0, name: 'Sala 1', capacity: 150, type: 'STANDARD' as RoomType, screen_name: 'Laser 4K' },
      { id: 2, cinema_id: 0, name: 'Sala 2', capacity: 280, type: 'IMAX' as RoomType, screen_name: 'IMAX Laser 12-Channel' },
    ] as Room[],
    pricing: [
      { type: 'Sala Standard (2D/3D)', inteira: 50.0, meia: 25.0 },
      { type: 'Sala IMAX Laser', inteira: 65.0, meia: 32.5 },
      { type: 'Sala VIP Premier', inteira: 80.0, meia: 40.0 },
    ] as CinemaPricingItem[],
  });

  // Calculate formatted public hours string
  const formattedHoursSummary = useMemo(() => {
    const activeDays = weeklySchedule.filter((day) => day.isOpen);
    const dayLabel = activeDays.length === weeklySchedule.length
      ? 'Todos os dias'
      : activeDays.map((day) => day.day.replace('-feira', '')).join(', ') || 'Sem dias ativos';
    const hoursLabel = hoursMode === 'UNIFIED'
      ? `das ${unifiedOpenTime} às ${unifiedCloseTime}`
      : 'com horários por dia';
    return `${dayLabel} ${hoursLabel}`;
  }, [hoursMode, unifiedOpenTime, unifiedCloseTime, weeklySchedule]);

  // Sync formatted hours to form data
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      hours: formattedHoursSummary,
    }));
  }, [formattedHoursSummary]);

  // Load existing cinema data if editing
  useEffect(() => {
    if (isEditing && existingCinema) {
      setFormData({
        name: existingCinema.name,
        chain: existingCinema.chain,
        address: existingCinema.address,
        neighborhood: existingCinema.neighborhood,
        city: existingCinema.city,
        state: existingCinema.state,
        zip_code: existingCinema.zip_code || '',
        phone: existingCinema.phone,
        email: existingCinema.email || '',
        hours: existingCinema.hours || 'Aberto hoje das 13:00 às 23:30',
        image_url: existingCinema.image_url,
        backdrop_url: existingCinema.backdrop_url,
        amenities: existingCinema.amenities || [],
        rooms: existingCinema.rooms ? [...existingCinema.rooms] : [],
        pricing: existingCinema.pricing ? [...existingCinema.pricing] : [],
      });
      document.title = `Editar: ${existingCinema.name} | screeK B2B`;
    } else {
      document.title = 'Cadastrar Novo Cinema | screeK B2B';
    }
  }, [isEditing, existingCinema]);

  // Toggle specific day open
  const handleToggleDay = (index: number) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isOpen: !updated[index].isOpen };
      return updated;
    });
  };

  // Update specific day time
  const handleUpdateDayTime = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Apply unified hours to all active days
  const handleApplyUnifiedToAll = () => {
    setWeeklySchedule((prev) =>
      prev.map((d) => ({
        ...d,
        openTime: unifiedOpenTime,
        closeTime: unifiedCloseTime,
      }))
    );
    toast.success('Horário padrão aplicado a todos os dias ativos!');
  };

  // Add Notice
  const handleAddNotice = () => {
    const newNotice: ScheduleNotice = {
      id: `notice-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'special_hours',
      openTime: '14:00',
      closeTime: '22:00',
      message: 'Aviso sobre a alteração de horário ou programação.',
    };
    setScheduleNotices((prev) => [...prev, newNotice]);
  };

  // Update Notice
  const handleUpdateNotice = (id: string, field: keyof ScheduleNotice, value: any) => {
    setScheduleNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [field]: value } : n))
    );
  };

  // Remove Notice
  const handleRemoveNotice = (id: string) => {
    setScheduleNotices((prev) => prev.filter((n) => n.id !== id));
  };

  // Toggle amenity selection
  const handleToggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Add room
  const handleAddRoom = () => {
    const nextNum = formData.rooms.length + 1;
    const newRoom: Room = {
      id: Date.now(),
      cinema_id: existingCinema ? existingCinema.numeric_id : 0,
      name: `Sala ${nextNum}`,
      capacity: 160,
      type: 'STANDARD',
      screen_name: 'Standard Digital 4K',
    };
    setFormData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
  };

  // Update room
  const handleUpdateRoom = (index: number, field: keyof Room, value: any) => {
    setFormData((prev) => {
      const updatedRooms = [...prev.rooms];
      updatedRooms[index] = {
        ...updatedRooms[index],
        [field]: value,
      };
      return { ...prev, rooms: updatedRooms };
    });
  };

  // Remove room
  const handleRemoveRoom = (index: number) => {
    if (formData.rooms.length <= 1) {
      toast.warning('O cinema precisa ter pelo menos 1 sala cadastrada.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index),
    }));
  };

  // Update pricing
  const handleUpdatePricing = (index: number, field: 'inteira' | 'meia', value: number) => {
    setFormData((prev) => {
      const updatedPricing = [...prev.pricing];
      updatedPricing[index] = {
        ...updatedPricing[index],
        [field]: value,
      };
      return { ...prev, pricing: updatedPricing };
    });
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      toast.warning('Preencha os campos obrigatórios (Nome e Endereço).');
      return;
    }

    if (formData.rooms.length === 0) {
      toast.warning('Adicione ao menos uma sala ao complexo.');
      return;
    }

    if (isEditing && existingCinema) {
      // Update in memory mock store
      const cinemaIndex = MOCK_CINEMAS.findIndex((c) => c.id === existingCinema.id);
      if (cinemaIndex !== -1) {
        MOCK_CINEMAS[cinemaIndex] = {
          ...existingCinema,
          ...formData,
          rooms_count: formData.rooms.length,
        };
      }
      toast.success('Cinema atualizado com sucesso!', {
        description: `${formData.name} teve suas alterações salvas.`,
      });
    } else {
      // Create new cinema and push to MOCK_CINEMAS
      const newId = `cinema-${formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      const newCinema: Cinema = {
        id: newId,
        numeric_id: Date.now(),
        ...formData,
        rooms_count: formData.rooms.length,
      };
      MOCK_CINEMAS.unshift(newCinema);
      toast.success('Novo cinema cadastrado com sucesso!', {
        description: `${formData.name} já está disponível na rede e grade de sessões.`,
      });
    }

    navigate('/management/cinemas');
  };

  const totalSeats = formData.rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* ─── 1. TOP HEADER & BREADCRUMB ─── */}
      <section className="bg-background page-divider px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          
          <div className="flex items-center gap-2 text-xs font-black uppercase text-foreground/60">
            <Link to="/management/cinemas" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft size={14} weight="bold" />
              <span>Voltar para Meus Cinemas</span>
            </Link>
            <span>/</span>
            <span className="text-foreground">{isEditing ? 'Editar Cinema' : 'Novo Cinema'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            {isEditing ? `Editar: ${existingCinema?.name || formData.name}` : 'Cadastrar Novo Cinema'}
          </h1>

        </div>
      </section>

      {/* ─── 2. MAIN FORM CONTENT & SIDEBAR ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT & CENTER: FORM SECTIONS (2 COLS) */}
          <div className="lg:col-span-2 space-y-8">

            <div role="tablist" aria-label="Seções da configuração do cinema" className="flex flex-wrap gap-2 border-b-2 border-foreground/20">
              {[
                { id: 'dados', label: 'Dados' },
                { id: 'salas', label: 'Salas' },
                { id: 'precos', label: 'Preços' },
              ].map((section) => (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === section.id}
                  onClick={() => setActiveSection(section.id as typeof activeSection)}
                  className={`border-b-4 px-5 py-3 text-xs font-black uppercase tracking-wide transition-colors ${
                    activeSection === section.id
                      ? 'border-secondary bg-secondary text-secondary-foreground'
                      : 'border-transparent text-foreground/60 hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {activeSection === 'dados' && <>
            
            {/* Section 1: Dados Gerais & Rede */}
            <div className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
              <CinemaFormSectionHeading icon={<Buildings size={20} weight="bold" className="text-primary" />} title={<>1. Identificação da Unidade &amp; Franquia</>} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">
                    Nome do Complexo / Cinema *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Cinemark Bourbon Shopping"
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">
                    Rede / Bandeira
                  </label>
                  <select
                    value={formData.chain}
                    onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-bold font-display uppercase focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Cinemark">Cinemark</option>
                    <option value="Cinépolis">Cinépolis</option>
                    <option value="UCI Cinemas">UCI Cinemas</option>
                    <option value="Cinesystem">Cinesystem</option>
                    <option value="Kinoplex">Kinoplex</option>
                    <option value="Reserva Cultural">Reserva Cultural</option>
                    <option value="Espaço Itaú">Espaço Itaú</option>
                    <option value="Independente">Independente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80 flex items-center gap-1.5">
                    <Phone size={14} />
                    <span>Telefone de Contato</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 3673-3000"
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80 flex items-center gap-1.5">
                    <EnvelopeSimple size={14} />
                    <span>E-mail da Gerência / Suporte</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="gerencia.bourbon@cinemark.com.br"
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* DIAS & HORÁRIOS DE FUNCIONAMENTO */}
              <div className="space-y-4 pt-4 border-t-2 border-foreground/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase text-foreground/80 flex items-center gap-1.5">
                    <Clock size={16} className="text-secondary" />
                    <span>Dias &amp; Horários de Funcionamento</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-secondary bg-secondary/10 px-2 py-0.5 border border-secondary/30">
                    {formattedHoursSummary}
                  </span>
                </div>

                {/* 1. SELETOR DE DIAS DA SEMANA */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-foreground/60 block">Dias ativos</span>
                  <div className="flex flex-wrap gap-2">
                    {weeklySchedule.map((day, index) => (
                      <button
                        key={day.day}
                        type="button"
                        aria-pressed={day.isOpen}
                        onClick={() => handleToggleDay(index)}
                        className={`h-10 min-w-12 border-2 px-2.5 text-[10px] font-black transition-colors ${
                          day.isOpen
                            ? 'border-secondary bg-secondary text-secondary-foreground'
                            : 'border-foreground/25 bg-background text-foreground/60 hover:border-secondary/60'
                        }`}
                      >
                        {day.shortDay}
                        <span className="sr-only">{day.day}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. MODO DE HORÁRIO (UNIFICADO OU POR DIA) */}
                <div className="p-4 bg-muted/20 border-2 border-foreground/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/10 pb-3">
                    <span className="text-xs font-black uppercase text-foreground">
                      Configuração de Horários
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHoursMode('UNIFIED')}
                        className={`px-2.5 py-1 text-[11px] font-black uppercase border transition-colors cursor-pointer ${
                          hoursMode === 'UNIFIED'
                            ? 'bg-secondary text-secondary-foreground border-secondary'
                            : 'bg-background border-foreground/30 text-foreground/70'
                        }`}
                      >
                        Horário Padrão Único
                      </button>
                      <button
                        type="button"
                        onClick={() => setHoursMode('BY_DAY')}
                        className={`px-2.5 py-1 text-[11px] font-black uppercase border transition-colors cursor-pointer ${
                          hoursMode === 'BY_DAY'
                            ? 'bg-secondary text-secondary-foreground border-secondary'
                            : 'bg-background border-foreground/30 text-foreground/70'
                        }`}
                      >
                        Horário Detalhado por Dia
                      </button>
                    </div>
                  </div>

                  {hoursMode === 'UNIFIED' ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black uppercase text-foreground/70">Abertura:</label>
                        <input
                          type="time"
                          value={unifiedOpenTime}
                          onChange={(e) => setUnifiedOpenTime(e.target.value)}
                          className="px-3 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black uppercase text-foreground/70">Fechamento:</label>
                        <input
                          type="time"
                          value={unifiedCloseTime}
                          onChange={(e) => setUnifiedCloseTime(e.target.value)}
                          className="px-3 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold focus:outline-none focus:border-primary"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyUnifiedToAll}
                        className="px-3 py-1.5 bg-background hover:bg-muted border border-foreground/40 text-[11px] font-black uppercase cursor-pointer"
                      >
                        Sincronizar com Todos os Dias
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {weeklySchedule.map((d, idx) => (
                        <div
                          key={d.day}
                          className={`p-2.5 border-2 text-xs space-y-2 transition-colors ${
                            d.isOpen
                              ? 'bg-background border-foreground/30'
                              : 'bg-muted/10 border-foreground/10 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 font-black uppercase cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={d.isOpen}
                                onChange={() => handleToggleDay(idx)}
                                className="accent-primary"
                              />
                              <span>{d.shortDay} • {d.day}</span>
                            </label>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 ${d.isOpen ? 'bg-[#34A853]/20 text-[#34A853]' : 'bg-destructive/20 text-destructive'}`}>
                              {d.isOpen ? 'Aberto' : 'Fechado'}
                            </span>
                          </div>

                          {d.isOpen && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <input
                                type="time"
                                value={d.openTime}
                                onChange={(e) => handleUpdateDayTime(idx, 'openTime', e.target.value)}
                                className="px-1.5 py-0.5 bg-background border border-foreground/30 text-xs font-mono font-bold"
                              />
                              <span>às</span>
                              <input
                                type="time"
                                value={d.closeTime}
                                onChange={(e) => handleUpdateDayTime(idx, 'closeTime', e.target.value)}
                                className="px-1.5 py-0.5 bg-background border border-foreground/30 text-xs font-mono font-bold"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. AVISOS & EXCEÇÕES EM DIAS ESPECÍFICOS (FERIADOS / MUDANÇAS) */}
                <div className="p-4 bg-muted/20 border-2 border-foreground/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Warning size={16} weight="bold" className="text-secondary" />
                      <span className="text-xs font-black uppercase text-foreground">
                        Avisos &amp; Exceções em Dias Específicos ({scheduleNotices.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNotice}
                      className="px-2.5 py-1 bg-background hover:bg-muted border border-foreground/40 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} weight="bold" />
                      <span>Adicionar Exceção</span>
                    </button>
                  </div>

                  {scheduleNotices.length === 0 ? (
                    <p className="text-xs text-foreground/50 font-sans italic py-2">
                      Nenhum aviso ou exceção cadastrado para feriados ou manutenções.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {scheduleNotices.map((notice) => (
                        <div
                          key={notice.id}
                          className="p-3.5 bg-background border-2 border-foreground/30 space-y-3 shadow-[2px_2px_0px_0px_var(--border)]"
                        >
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Date / Occasion - Calendar Picker */}
                            <div className="flex-1 min-w-[140px] relative">
                              <button
                                type="button"
                                onClick={() => setCalendarOpenForNotice(calendarOpenForNotice === notice.id ? null : notice.id)}
                                className="w-full px-2.5 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold text-left focus:outline-none focus:border-primary flex items-center justify-between gap-2 cursor-pointer hover:border-primary transition-colors"
                              >
                                <span>{notice.date ? format(new Date(notice.date), 'dd/MM/yyyy') : 'Selecione a data'}</span>
                                <CalendarIcon size={14} weight="bold" />
                              </button>
                              {calendarOpenForNotice === notice.id && (
                                <div className="absolute top-full left-0 mt-1 z-50 bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-2">
                                  <Calendar
                                    mode="single"
                                    selected={notice.date ? new Date(notice.date) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        handleUpdateNotice(notice.id, 'date', format(date, 'yyyy-MM-dd'));
                                        setCalendarOpenForNotice(null);
                                      }
                                    }}
                                    className="rounded-none"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Type */}
                            <select
                              value={notice.type}
                              onChange={(e) => handleUpdateNotice(notice.id, 'type', e.target.value as any)}
                              className="px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold uppercase focus:outline-none focus:border-primary cursor-pointer shrink-0"
                            >
                              <option value="special_hours">Horário Especial</option>
                              <option value="closed">Fechado o Dia Todo</option>
                              <option value="event">Sessão Especial / Evento</option>
                            </select>

                            {/* Special Hours inputs if special_hours */}
                            {notice.type === 'special_hours' && (
                              <div className="flex items-center gap-1.5 text-xs shrink-0">
                                <input
                                  type="time"
                                  value={notice.openTime || '14:00'}
                                  onChange={(e) => handleUpdateNotice(notice.id, 'openTime', e.target.value)}
                                  className="px-2 py-1 bg-background border border-foreground/30 text-xs font-mono font-bold"
                                />
                                <span className="text-[11px] font-bold text-foreground/70">às</span>
                                <input
                                  type="time"
                                  value={notice.closeTime || '22:00'}
                                  onChange={(e) => handleUpdateNotice(notice.id, 'closeTime', e.target.value)}
                                  className="px-2 py-1 bg-background border border-foreground/30 text-xs font-mono font-bold"
                                />
                              </div>
                            )}

                            {/* Remove Notice */}
                            <button
                              type="button"
                              onClick={() => handleRemoveNotice(notice.id)}
                              className="p-1.5 border border-foreground/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors shrink-0 cursor-pointer ml-auto"
                              title="Remover Aviso"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          </div>

                          {/* Notice Public Message */}
                          <input
                            type="text"
                            value={notice.message}
                            onChange={(e) => handleUpdateNotice(notice.id, 'message', e.target.value)}
                            placeholder="Mensagem explicativa exibida aos clientes no app..."
                            className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-sans text-foreground/80 focus:outline-none focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Section 2: Localização */}
            <div className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
              <CinemaFormSectionHeading icon={<MapPin size={20} weight="bold" className="text-secondary" />} title={<>2. Localização &amp; Endereço</>} />

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-foreground/80">
                  Endereço Completo &amp; Complemento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua Palestra Itália, 500 - Shopping Bourbon, Piso 3"
                  className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">Bairro</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Perdizes"
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">Cidade</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground focus:outline-none focus:border-primary"
                  >
                    {Array.from(new Set([formData.city, ...(CITIES_BY_STATE[formData.state] || [])])).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">Estado (UF)</label>
                  <select
                    value={formData.state}
                    onChange={(e) => {
                      const state = e.target.value;
                      setFormData((prev) => ({ ...prev, state, city: CITIES_BY_STATE[state]?.[0] || prev.city }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground focus:outline-none focus:border-primary uppercase"
                  >
                    {STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-foreground/80">CEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                    value={formData.zip_code}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, zip_code: digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits });
                    }}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2.5 bg-background border-2 border-foreground/30 text-xs font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Comodidades & Tecnologias */}
            <div className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
              <CinemaFormSectionHeading icon={<Sparkle size={20} weight="bold" className="text-primary" />} title={<>3. Comodidades &amp; Tecnologias do Complexo</>} actions={<span className="text-xs font-bold text-foreground/50">
                  {formData.amenities.length} selecionadas
                </span>} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isChecked = formData.amenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`flex items-center gap-2.5 p-2.5 border-2 text-xs font-bold uppercase cursor-pointer select-none transition-all shadow-[2px_2px_0px_0px_var(--border)] ${
                        isChecked
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/10 border-foreground/20 text-foreground/60 hover:bg-muted/30'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/40'
                        }`}
                      >
                        {isChecked && <CheckCircle size={14} weight="fill" />}
                      </div>
                      <span className="truncate">{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            </>}

            {activeSection === 'salas' && <CinemaRoomEditor
              rooms={formData.rooms}
              roomTypes={ROOM_TYPES}
              projectionAudioOptions={PROJECTION_AUDIO_OPTIONS}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onRemoveRoom={handleRemoveRoom}
            />}
            {/* Section 5: Tabela de Preços & Promoções */}
            {activeSection === 'precos' && <>
            <div className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-6">
              
              {/* 5.1 Tabela Base */}
              <div className="space-y-4">
                <CinemaFormSectionHeading icon={<Armchair size={20} weight="bold" className="text-primary" />} title={<>5. Tabela Base de Ingressos &amp; Promoções</>} />

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-primary block">
                    5.1 Preços Base por Formato de Sala (R$)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {formData.pricing.map((priceItem, pIdx) => (
                      <div key={priceItem.type} className="p-4 bg-muted/20 border-2 border-foreground/30 space-y-3">
                        <span className="text-xs font-black uppercase text-foreground block truncate">
                          {priceItem.type}
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground/60 block">Inteira (R$)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={priceItem.inteira}
                              onChange={(e) => handleUpdatePricing(pIdx, 'inteira', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold text-center focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground/60 block">Meia (R$)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={priceItem.meia}
                              onChange={(e) => handleUpdatePricing(pIdx, 'meia', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-background border border-foreground/30 text-xs font-bold text-center focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5.2 Gerenciador de Promoções da Unidade */}
              <div className="space-y-4 pt-4 border-t-2 border-foreground/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Tag size={18} weight="bold" className="text-secondary" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-secondary block">
                        5.2 Campanhas Promocionais &amp; Descontos ({promotions.length})
                      </span>
                      <span className="text-[11px] text-foreground/60 font-sans">
                        Configure dias de meia-entrada geral, parcerias, combos e preços promocionais.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPromotion}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground font-black text-xs uppercase flex items-center gap-1.5 border-2 border-secondary shadow-[2px_2px_0px_0px_var(--border)] hover:bg-secondary/90 transition-all cursor-pointer"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Adicionar Promoção</span>
                  </button>
                </div>

                {promotions.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-foreground/30 bg-muted/10 space-y-2">
                    <Percent size={28} className="mx-auto text-foreground/40" />
                    <p className="text-xs font-bold text-foreground/60">
                      Nenhuma campanha promocional cadastrada.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddPromotion}
                      className="px-3 py-1 bg-background border border-foreground/30 text-xs font-bold uppercase"
                    >
                      Cadastrar Primeira Promoção
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {promotions.map((promo) => (
                      <details
                        key={promo.id}
                        className={`promotion-accordion border-2 transition-all ${
                          promo.isActive
                            ? 'bg-muted/20 border-foreground/30'
                            : 'bg-muted/10 border-foreground/15 opacity-60'
                        }`}
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
                          <span className="text-xs font-black uppercase text-foreground">
                            {promo.type === 'half_price' ? 'MEIA-ENTRADA' : promo.type === 'fixed_price' ? 'PREÇO FIXO' : promo.type === 'percentage_off' ? 'DESCONTO PERCENTUAL' : 'DESCONTO EM REAIS'}
                            {' · '}{promo.days.length ? promo.days.join(' · ') : 'Sem dias'}
                          </span>
                          <span className={`ml-auto text-[10px] font-black uppercase ${promo.isActive ? 'text-[#34A853]' : 'text-foreground/40'}`}>
                            {promo.isActive ? 'Ativa' : 'Pausada'}
                          </span>
                          <CaretDown className="promotion-accordion-caret text-secondary transition-transform [[details[open]>summary>&]]:rotate-180" size={16} weight="bold" aria-hidden="true" />
                        </summary>
                        <div className="space-y-3 border-t border-foreground/10 p-4">
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-foreground/10 pb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-black uppercase">
                              Promoção
                            </span>
                            <input
                              type="text"
                              value={promo.name}
                              onChange={(e) => handleUpdatePromotion(promo.id, 'name', e.target.value)}
                              placeholder="Nome da Promoção (ex: Quarta do Cinema)"
                              className="font-black text-xs uppercase bg-background border border-foreground/30 px-2 py-1 flex-1 focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Active Toggle Switch */}
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={promo.isActive}
                                onChange={(e) => handleUpdatePromotion(promo.id, 'isActive', e.target.checked)}
                                className="accent-primary"
                              />
                              <span className={promo.isActive ? 'text-[#34A853]' : 'text-foreground/40'}>
                                {promo.isActive ? 'Ativa' : 'Pausada'}
                              </span>
                            </label>

                            {/* Delete Promotion */}
                            <button
                              type="button"
                              onClick={() => handleRemovePromotion(promo.id)}
                              className="p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Remover Promoção"
                            >
                              <Trash size={15} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {/* Promotion Settings Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Type */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground/60 block">Tipo de Desconto</label>
                            <select
                              value={promo.type}
                              onChange={(e) => handleUpdatePromotion(promo.id, 'type', e.target.value as any)}
                              className="w-full px-2 py-1 bg-background border border-foreground/30 text-xs font-bold uppercase focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="half_price">Meia-Entrada para Todos</option>
                              <option value="percentage_off">Desconto Percentual (%)</option>
                              <option value="fixed_price">Preço Fixo Promocional (R$)</option>
                              <option value="value_off">Desconto em Reais (R$ off)</option>
                            </select>
                          </div>

                          {/* Value (if applicable) */}
                          {promo.type !== 'half_price' && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-foreground/60 block">
                                {promo.type === 'percentage_off' ? 'Percentual (%)' : 'Valor (R$)'}
                              </label>
                              <input
                                type="number"
                                step={promo.type === 'percentage_off' ? '1' : '0.5'}
                                value={promo.discountValue || 0}
                                onChange={(e) => handleUpdatePromotion(promo.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 bg-background border border-foreground/30 text-xs font-bold focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}

                          {/* Days */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-foreground/60 block">Dias válidos</label>
                            <div className="grid grid-cols-7 gap-1">
                              {[
                                { id: 'DOM', label: 'D' }, { id: 'SEG', label: 'S' }, { id: 'TER', label: 'T' },
                                { id: 'QUA', label: 'Q' }, { id: 'QUI', label: 'Q' }, { id: 'SEX', label: 'S' }, { id: 'SAB', label: 'S' },
                              ].map((day) => {
                                const isSelected = promo.days.includes(day.id);
                                return (
                                  <button
                                    key={day.id}
                                    type="button"
                                    aria-label={day.id}
                                    aria-pressed={isSelected}
                                    onClick={() => handleUpdatePromotion(promo.id, 'days', isSelected ? promo.days.filter((item) => item !== day.id) : [...promo.days, day.id])}
                                    className={`h-8 w-full aspect-square flex items-center justify-center border text-[10px] font-black ${isSelected ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-foreground/25 bg-background text-foreground/60 hover:border-secondary/60'}`}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Rooms / Screens Applicable */}
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-foreground/60 block">Salas / formatos</label>
                            <div className="flex flex-wrap gap-1.5">
                              {ROOM_TYPES.map((roomType) => {
                                const isSelected = promo.roomTypes.includes(roomType);
                                return (
                                  <button
                                    key={roomType}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => handleUpdatePromotion(promo.id, 'roomTypes', isSelected ? promo.roomTypes.filter((item) => item !== roomType) : [...promo.roomTypes, roomType])}
                                    className={`border px-2.5 py-1.5 text-[10px] font-black uppercase transition-colors ${isSelected ? 'border-secondary bg-secondary/10 text-secondary' : 'border-foreground/25 bg-background text-foreground/60 hover:border-secondary/60'}`}
                                  >
                                    {isSelected && '✓ '}{roomType}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Description / Rules */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-foreground/60 block">Regras &amp; Descrição para o Cliente</label>
                          <input
                            type="text"
                            value={promo.description}
                            onChange={(e) => handleUpdatePromotion(promo.id, 'description', e.target.value)}
                            placeholder="ex: Válido para todas as sessões 2D e 3D nas quartas-feiras..."
                            className="w-full px-2.5 py-1 bg-background border border-foreground/30 text-xs font-sans text-foreground/80 focus:outline-none focus:border-primary"
                          />
                        </div>

                        </div>
                      </details>
                    ))}
                  </div>
                )}

              </div>

            </div>

            </>}
          </div>

          {/* RIGHT COLUMN: STICKY LIVE SUMMARY & ACTIONS (1 COL) */}
          <div className="space-y-6 sticky top-6">
            
            {/* Live Complex Summary Card */}
            <div className="border-4 border-foreground/40 bg-background shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
              <div className="border-b-2 border-foreground/20 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-secondary block">
                  Resumo em Tempo Real
                </span>
                <h3 className="text-lg font-black uppercase text-foreground truncate">
                  {formData.name || 'Nome do Cinema'}
                </h3>
                <span className="text-xs text-foreground/60 font-sans block">
                  {formData.chain} • {formData.city || 'Cidade'}/{formData.state || 'UF'}
                </span>
              </div>

              {/* Metrics pill list */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-muted/20 border border-foreground/20">
                  <span className="font-bold text-foreground/70 uppercase">Salas Configuradas</span>
                  <span className="font-black text-foreground">{formData.rooms.length} salas</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/20 border border-foreground/20">
                  <span className="font-bold text-foreground/70 uppercase">Capacidade Total</span>
                  <span className="font-black text-secondary">{totalSeats.toLocaleString()} assentos</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/20 border border-foreground/20">
                  <span className="font-bold text-foreground/70 uppercase">Salas IMAX / Especiais</span>
                  <span className="font-black text-[#34A853]">
                    {formData.rooms.filter((r) => r.type !== 'STANDARD').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/20 border border-foreground/20">
                  <span className="font-bold text-foreground/70 uppercase">Promoções Ativas</span>
                  <span className="font-black text-secondary">
                    {promotions.filter((p) => p.isActive).length} ativas
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-3 border-t-2 border-foreground/20">
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-primary-foreground font-black text-xs uppercase flex items-center justify-center gap-2 border-2 border-primary shadow-[4px_4px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <FloppyDisk size={18} weight="bold" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Cinema'}</span>
                </button>

                <Link
                  to="/management/cinemas"
                  className="w-full py-2.5 bg-background hover:bg-muted text-foreground font-black text-xs uppercase flex items-center justify-center border-2 border-foreground/40 shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                >
                  Descartar &amp; Voltar
                </Link>
              </div>

            </div>

          </div>

        </form>
      </main>

    </div>
  );
}
