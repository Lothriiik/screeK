import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
  WarningCircle,
  X,
  Eye,
  PencilSimple,
  Trash,
  FloppyDisk,
  Lightning,
  CalendarCheck,
  Clock,
  Sparkle,
  Buildings,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS, MOCK_MOVIES } from '../mocks';
import { StatusModal } from '../components/custom/status-modal';
import { ManagementScheduleTimeline } from '../components/custom/management-schedule-timeline';
import type { GanttSession, ScheduleRoom } from '../types/management-schedule';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

const ROOMS_CONFIG: ScheduleRoom[] = [
  { id: 'sala-4', name: 'Sala 4', type: 'IMAX', seats: 200, status: 'Ativa', occupancyRate: 88, currentSeats: 176 },
  { id: 'sala-2', name: 'Sala 2', type: '4DX', seats: 80, status: 'Ativa', occupancyRate: 100, currentSeats: 80 },
  { id: 'sala-3', name: 'Sala 3', type: 'VIP', seats: 60, status: 'Ativa', occupancyRate: 78, currentSeats: 47 },
  { id: 'sala-1', name: 'Sala 1', type: 'Standard', seats: 120, status: 'Manutenção', occupancyRate: 0, currentSeats: 0, isMaintenance: true },
];

const DAYS_STRIP = [
  { dayName: 'SEX', dayNum: '22', fullLabel: 'Sexta-feira, 22 de Agosto' },
  { dayName: 'SÁB', dayNum: '23', fullLabel: 'Sábado, 23 de Agosto' },
  { dayName: 'DOM', dayNum: '24', fullLabel: 'Domingo, 24 de Agosto' },
  { dayName: 'SEG', dayNum: '25', fullLabel: 'Segunda-feira, 25 de Agosto', isActive: true },
  { dayName: 'TER', dayNum: '26', fullLabel: 'Terça-feira, 26 de Agosto' },
  { dayName: 'QUA', dayNum: '27', fullLabel: 'Quarta-feira, 27 de Agosto' },
  { dayName: 'QUI', dayNum: '28', fullLabel: 'Quinta-feira, 28 de Agosto' },
];

const INITIAL_GANTT_SESSIONS: GanttSession[] = [
  // Seg 25 sessions
  {
    id: 'g-s4-1',
    dateNum: '25',
    movieId: 'alien',
    movieTitle: 'Alien: Romulus',
    roomId: 'sala-4',
    roomName: 'Sala 4 — IMAX',
    startTime: '13:30',
    endTime: '15:16',
    startMinutes: 30,
    durationMinutes: 106,
    format: 'IMAX',
    audio: 'LEG',
    occupancy: 120,
    capacity: 200,
    price: 52,
    color: 'bg-muted/60 text-foreground border-foreground/30',
  },
  {
    id: 'g-s4-2',
    dateNum: '25',
    movieId: 'dune-part-two',
    movieTitle: 'Duna: Parte II',
    roomId: 'sala-4',
    roomName: 'Sala 4 — IMAX',
    startTime: '16:30',
    endTime: '19:16',
    startMinutes: 210,
    durationMinutes: 166,
    format: 'IMAX',
    audio: 'LEG',
    occupancy: 142,
    capacity: 200,
    price: 52,
    hasConflict: true,
    conflictDetails: 'Sessão 19:30 sobrepõe com outra da Sala 4',
    color: 'bg-background text-foreground border-secondary shadow-[0_0_8px_rgba(247,59,127,0.4)]',
  },
  {
    id: 'g-s4-3',
    dateNum: '25',
    movieId: 'dune-part-two',
    movieTitle: 'Duna: Parte II',
    roomId: 'sala-4',
    roomName: 'Sala 4 — IMAX',
    startTime: '19:30',
    endTime: '22:16',
    startMinutes: 390,
    durationMinutes: 166,
    format: 'IMAX',
    audio: 'DUB',
    occupancy: 196,
    capacity: 200,
    price: 52,
    hasConflict: true,
    conflictDetails: 'Sessão sobrepõe o final da sessão das 16:30',
    color: 'bg-secondary/10 text-foreground border-secondary',
  },
  {
    id: 'g-s2-1',
    dateNum: '25',
    movieId: 'deadpool',
    movieTitle: 'Deadpool & W.',
    roomId: 'sala-2',
    roomName: 'Sala 2 — 4DX',
    startTime: '14:15',
    endTime: '16:22',
    startMinutes: 75,
    durationMinutes: 127,
    format: '4DX',
    audio: 'DUB',
    occupancy: 64,
    capacity: 80,
    price: 64,
    color: 'bg-muted/60 text-foreground border-foreground/30',
  },
  {
    id: 'g-s2-2',
    dateNum: '25',
    movieId: 'deadpool',
    movieTitle: 'Deadpool & W.',
    roomId: 'sala-2',
    roomName: 'Sala 2 — 4DX',
    startTime: '17:30',
    endTime: '19:37',
    startMinutes: 270,
    durationMinutes: 127,
    format: '4DX',
    audio: 'LEG',
    occupancy: 80,
    capacity: 80,
    price: 64,
    color: 'bg-[#8B1A4A]/20 text-foreground border-[#8B1A4A]',
  },
  {
    id: 'g-s2-3',
    dateNum: '25',
    movieId: 'furiosa',
    movieTitle: 'Furiosa',
    roomId: 'sala-2',
    roomName: 'Sala 2 — 4DX',
    startTime: '20:00',
    endTime: '22:28',
    startMinutes: 420,
    durationMinutes: 148,
    format: '4DX',
    audio: 'DUB',
    occupancy: 78,
    capacity: 80,
    price: 64,
    color: 'bg-[#1E2B45]/20 text-foreground border-[#1E2B45]/40',
  },
  {
    id: 'g-s3-1',
    dateNum: '25',
    movieId: 'conclave',
    movieTitle: 'Conclave',
    roomId: 'sala-3',
    roomName: 'Sala 3 — VIP',
    startTime: '15:10',
    endTime: '17:11',
    startMinutes: 130,
    durationMinutes: 121,
    format: 'VIP',
    audio: 'LEG',
    occupancy: 42,
    capacity: 60,
    price: 78,
    color: 'bg-muted/60 text-foreground border-foreground/30',
  },
  {
    id: 'g-s3-2',
    dateNum: '25',
    movieId: 'conclave',
    movieTitle: 'Conclave',
    roomId: 'sala-3',
    roomName: 'Sala 3 — VIP',
    startTime: '19:00',
    endTime: '21:01',
    startMinutes: 360,
    durationMinutes: 121,
    format: 'VIP',
    audio: 'LEG',
    occupancy: 56,
    capacity: 60,
    price: 78,
    color: 'bg-[#1E2B45]/15 text-foreground border-[#1E2B45]/40',
  },
  // Extra sample sessions for other days so switching dates displays active programming
  {
    id: 'g-s4-22',
    dateNum: '22',
    movieId: 'dune-part-two',
    movieTitle: 'Duna: Parte II',
    roomId: 'sala-4',
    roomName: 'Sala 4 — IMAX',
    startTime: '16:00',
    endTime: '18:46',
    startMinutes: 180,
    durationMinutes: 166,
    format: 'IMAX',
    audio: 'LEG',
    occupancy: 185,
    capacity: 200,
    price: 52,
    color: 'bg-primary/20 text-foreground border-primary',
  },
  {
    id: 'g-s4-23',
    dateNum: '23',
    movieId: 'dune-part-two',
    movieTitle: 'Duna: Parte II',
    roomId: 'sala-4',
    roomName: 'Sala 4 — IMAX',
    startTime: '19:00',
    endTime: '21:46',
    startMinutes: 360,
    durationMinutes: 166,
    format: 'IMAX',
    audio: 'LEG',
    occupancy: 200,
    capacity: 200,
    price: 52,
    color: 'bg-primary/20 text-foreground border-primary',
  },
];

export function ManagementSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCinemaId = searchParams.get('cinemaId') || MOCK_CINEMAS[0]?.id || '';
  const selectedCinema = MOCK_CINEMAS.find((cinema) => cinema.id === selectedCinemaId);
  const [sessions, setSessions] = useState<GanttSession[]>(INITIAL_GANTT_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<GanttSession | null>(null);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'gantt' | 'table'>('gantt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateNum, setSelectedDateNum] = useState('25');

  // Modal Creation Mode: 'single' (Sessão Única) vs 'batch' (Grade Semanal / Lote)
  const [creationMode, setCreationMode] = useState<'single' | 'batch'>('single');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Form Fields
  const [formDateNum, setFormDateNum] = useState('25');
  const [formMovieId, setFormMovieId] = useState(MOCK_MOVIES[0].id);
  const [formRoomId, setFormRoomId] = useState('sala-4');
  const [formStartTime, setFormStartTime] = useState('14:00');
  const [formDuration, setFormDuration] = useState(120);
  const [formFormat, setFormFormat] = useState('IMAX');
  const [formAudio, setFormAudio] = useState('LEG');
  const [formPrice, setFormPrice] = useState(52);

  // Batch Form State
  const [batchSelectedDays, setBatchSelectedDays] = useState<string[]>(['22', '23', '24', '25', '26', '27', '28']);
  const [batchTimes, setBatchTimes] = useState<string[]>(['14:00', '17:30', '21:00']);

  // Cancel Confirmation Modal
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingSessionId(null);
    setCreationMode('single');
    setFormDateNum(selectedDateNum);
    setFormMovieId(MOCK_MOVIES[0].id);
    setFormRoomId('sala-4');
    setFormStartTime('14:00');
    setFormDuration(120);
    setFormFormat('IMAX');
    setFormAudio('LEG');
    setFormPrice(52);
    setBatchSelectedDays(['22', '23', '24', '25', '26', '27', '28']);
    setBatchTimes(['14:00', '17:30', '21:00']);
    setIsSessionModalOpen(true);
  };

  const handleOpenEditModal = (session: GanttSession) => {
    setEditingSessionId(session.id);
    setCreationMode('single');
    setFormDateNum(session.dateNum);
    setFormMovieId(session.movieId);
    setFormRoomId(session.roomId);
    setFormStartTime(session.startTime);
    setFormDuration(session.durationMinutes);
    setFormFormat(session.format);
    setFormAudio(session.audio);
    setFormPrice(session.price);
    setIsSessionModalOpen(true);
  };

  const toggleBatchDay = (dayNum: string) => {
    setBatchSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleAddBatchTime = (time: string) => {
    if (!batchTimes.includes(time)) {
      setBatchTimes((prev) => [...prev, time].sort());
    }
  };

  const handleRemoveBatchTime = (time: string) => {
    if (batchTimes.length > 1) {
      setBatchTimes((prev) => prev.filter((t) => t !== time));
    } else {
      toast.error('Você deve manter ao menos um horário na grade.');
    }
  };

  const handleAutoGenerateTimes = () => {
    // Generates 3 well-spaced slots based on movie duration + 25 min cleaning
    const slots = ['13:30', '17:00', '20:30'];
    setBatchTimes(slots);
    toast.success('Horários sugeridos com intervalo de limpeza de 25 min!');
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMovie = MOCK_MOVIES.find((m) => m.id === formMovieId) || MOCK_MOVIES[0];
    const selectedRoom = ROOMS_CONFIG.find((r) => r.id === formRoomId) || ROOMS_CONFIG[0];

    if (editingSessionId) {
      // 1. UPDATE EXISTING SINGLE SESSION
      const [h, m] = formStartTime.split(':').map(Number);
      const startMinutes = (h - 13) * 60 + m;
      const endMinutesTotal = h * 60 + m + formDuration;
      const endH = Math.floor(endMinutesTotal / 60) % 24;
      const endM = endMinutesTotal % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === editingSessionId) {
            return {
              ...s,
              dateNum: formDateNum,
              movieId: selectedMovie.id,
              movieTitle: selectedMovie.title,
              roomId: selectedRoom.id,
              roomName: `${selectedRoom.name} — ${selectedRoom.type}`,
              startTime: formStartTime,
              endTime,
              startMinutes,
              durationMinutes: formDuration,
              format: formFormat,
              audio: formAudio,
              price: formPrice,
              capacity: selectedRoom.seats,
              hasConflict: false,
              conflictDetails: undefined,
            };
          }
          return s;
        })
      );
      toast.success('Sessão atualizada com sucesso!');
    } else if (creationMode === 'batch') {
      // 2. CREATE BATCH OF SESSIONS ACROSS MULTIPLE DAYS & TIMES
      if (batchSelectedDays.length === 0) {
        toast.error('Selecione pelo menos um dia para a programação em lote.');
        return;
      }
      if (batchTimes.length === 0) {
        toast.error('Adicione pelo menos um horário para a grade.');
        return;
      }

      const newBatchSessions: GanttSession[] = [];

      batchSelectedDays.forEach((dayNum) => {
        batchTimes.forEach((timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          const startMinutes = (h - 13) * 60 + m;
          const endMinutesTotal = h * 60 + m + formDuration;
          const endH = Math.floor(endMinutesTotal / 60) % 24;
          const endM = endMinutesTotal % 60;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          newBatchSessions.push({
            id: `g-s-batch-${dayNum}-${timeStr.replace(':', '')}-${Date.now()}`,
            dateNum: dayNum,
            movieId: selectedMovie.id,
            movieTitle: selectedMovie.title,
            roomId: selectedRoom.id,
            roomName: `${selectedRoom.name} — ${selectedRoom.type}`,
            startTime: timeStr,
            endTime,
            startMinutes,
            durationMinutes: formDuration,
            format: formFormat,
            audio: formAudio,
            price: formPrice,
            occupancy: 0,
            capacity: selectedRoom.seats,
            color: 'bg-primary/20 text-foreground border-primary',
          });
        });
      });

      setSessions((prev) => [...prev, ...newBatchSessions]);
      toast.success(`⚡ Lote criado com sucesso! ${newBatchSessions.length} sessões geradas em ${batchSelectedDays.length} dias.`);
    } else {
      // 3. CREATE SINGLE SESSION
      const [h, m] = formStartTime.split(':').map(Number);
      const startMinutes = (h - 13) * 60 + m;
      const endMinutesTotal = h * 60 + m + formDuration;
      const endH = Math.floor(endMinutesTotal / 60) % 24;
      const endM = endMinutesTotal % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const newSession: GanttSession = {
        id: `g-s-${Date.now()}`,
        dateNum: formDateNum,
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        roomId: selectedRoom.id,
        roomName: `${selectedRoom.name} — ${selectedRoom.type}`,
        startTime: formStartTime,
        endTime,
        startMinutes,
        durationMinutes: formDuration,
        format: formFormat,
        audio: formAudio,
        price: formPrice,
        occupancy: 0,
        capacity: selectedRoom.seats,
        color: 'bg-primary/20 text-foreground border-primary',
      };
      setSessions((prev) => [...prev, newSession]);
      toast.success(`Sessão programada para o dia ${formDateNum}!`);
    }

    setIsSessionModalOpen(false);
    setSelectedSession(null);
  };

  const handleCancelSession = () => {
    if (!selectedSession) return;
    setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
    setIsCancelConfirmOpen(false);
    setSelectedSession(null);
    toast.success('Sessão cancelada. Ingressos estornados aos compradores.');
  };

  const handleResolveConflict = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === 'g-s4-3') {
          return {
            ...s,
            startTime: '19:45',
            endTime: '22:31',
            startMinutes: 405,
            hasConflict: false,
            conflictDetails: undefined,
            color: 'bg-primary/20 text-foreground border-primary',
          };
        }
        if (s.id === 'g-s4-2') {
          return {
            ...s,
            hasConflict: false,
            conflictDetails: undefined,
          };
        }
        return s;
      })
    );
    if (selectedSession?.id === 'g-s4-2' || selectedSession?.id === 'g-s4-3') {
      setSelectedSession((prev) => (prev ? { ...prev, hasConflict: false, conflictDetails: undefined } : null));
    }
    toast.success('Conflito da Sala 4 resolvido com sucesso! Sessão das 19:30 ajustada para 19:45.');
  };

  // Sessions filtered by Date, Room, Format, Status and Search
  const filteredSessions = sessions.filter((s) => {
    if (s.dateNum !== selectedDateNum) return false;
    if (selectedRoomFilter !== 'ALL' && s.roomId !== selectedRoomFilter) return false;
    if (selectedFormatFilter !== 'ALL' && s.format !== selectedFormatFilter) return false;
    if (selectedStatusFilter === 'conflict' && !s.hasConflict) return false;
    if (selectedStatusFilter === 'active' && s.hasConflict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.movieTitle.toLowerCase().includes(q) || s.roomName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 bg-background text-foreground font-display flex flex-col relative overflow-x-hidden">
      
      {/* ─── 1. TOP CONTROL BAR ─── */}
      <header className="bg-background px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        
        {/* Left: Date Strip */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedCinemaId}
            onValueChange={(value) => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('cinemaId', value);
              setSearchParams(nextParams);
            }}
          >
            <SelectTrigger aria-label="Selecionar cinema" className="h-9 w-[190px] min-w-[190px] border-2 border-foreground/30 px-2 text-[10px] font-black uppercase">
              <Buildings size={15} weight="bold" className="mr-1 shrink-0 text-secondary" />
              <SelectValue>{selectedCinema?.name || 'Selecionar cinema'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MOCK_CINEMAS.map((cinema) => <SelectItem key={cinema.id} value={cinema.id}>{cinema.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Mini Date Strip */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const idx = DAYS_STRIP.findIndex((d) => d.dayNum === selectedDateNum);
                if (idx > 0) setSelectedDateNum(DAYS_STRIP[idx - 1].dayNum);
              }}
              className="p-1 text-foreground/50 hover:text-foreground cursor-pointer"
              title="Anterior"
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            <div className="flex items-center gap-1">
              {DAYS_STRIP.map((d) => {
                const isActive = selectedDateNum === d.dayNum;
                const countForDay = sessions.filter((s) => s.dateNum === d.dayNum).length;

                return (
                  <button
                    key={d.dayNum}
                    type="button"
                    onClick={() => setSelectedDateNum(d.dayNum)}
                    className={`px-2.5 py-1 text-center font-display uppercase transition-all cursor-pointer border relative ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary font-black shadow-[1px_1px_0px_0px_var(--border)]'
                        : 'bg-background hover:bg-muted text-foreground/70 border-foreground/20 font-bold'
                    }`}
                  >
                    <span className="block text-[8px] opacity-70 leading-none">{d.dayName}</span>
                    <span className="block text-xs font-mono font-bold leading-tight">{d.dayNum}</span>
                    {countForDay > 0 && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const idx = DAYS_STRIP.findIndex((d) => d.dayNum === selectedDateNum);
                if (idx < DAYS_STRIP.length - 1) setSelectedDateNum(DAYS_STRIP[idx + 1].dayNum);
              }}
              className="p-1 text-foreground/50 hover:text-foreground cursor-pointer"
              title="Próximo"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

        </div>

        {/* Center/Right: Dropdowns + Search + Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Room Filter */}
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">Todas as salas</option>
            <option value="sala-4">Sala 4 (IMAX)</option>
            <option value="sala-2">Sala 2 (4DX)</option>
            <option value="sala-3">Sala 3 (VIP)</option>
            <option value="sala-1">Sala 1 (Standard)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">Todo status</option>
            <option value="active">Ativas / Sem Conflito</option>
            <option value="conflict">Com Conflito Detectado</option>
          </select>

          {/* Formats Filter */}
          <select
            value={selectedFormatFilter}
            onChange={(e) => setSelectedFormatFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border-2 border-foreground/30 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">Todos formatos</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
            <option value="VIP">VIP</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlass size={14} weight="bold" className="absolute left-2.5 top-2.5 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar filme..."
              className="w-36 sm:w-44 h-8 pl-8 pr-2 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/40"
            />
          </div>

          {/* New Session Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
          >
            <Plus size={14} weight="bold" />
            <span>+ Programar Sessões</span>
          </button>

        </div>

      </header>

      {/* ─── 2. SECONDARY TABS BAR ─── */}
      <div className="bg-background border-b border-foreground/10 px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setViewMode('gantt')}
            className={`pb-1 text-xs font-black uppercase transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'gantt'
                ? 'text-primary border-primary'
                : 'text-foreground/60 border-transparent hover:text-foreground'
            }`}
          >
            <span>VISÃO GANTT</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`pb-1 text-xs font-black uppercase transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'text-primary border-primary'
                : 'text-foreground/60 border-transparent hover:text-foreground'
            }`}
          >
            <span>VISÃO TABELA</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-sans">
          <span className="font-bold text-foreground">
            {DAYS_STRIP.find((d) => d.dayNum === selectedDateNum)?.fullLabel}
          </span>
          <span className="text-foreground/40">•</span>
          <span className="text-foreground/60">{filteredSessions.length} sessões no dia</span>
          <span className="text-secondary font-bold">
            {filteredSessions.filter((s) => s.hasConflict).length > 0 ? '⚠️ Conflito Ativo' : '✓ Grade Validada'}
          </span>
        </div>
      </div>

      {/* ─── 3A. VISÃO GANTT ─── */}
      {viewMode === 'gantt' && (
        <ManagementScheduleTimeline
          rooms={ROOMS_CONFIG}
          sessions={filteredSessions}
          selectedSessionId={selectedSession?.id}
          onSelectSession={setSelectedSession}
        />
      )}

      {/* ─── 3B. VISÃO TABELA ─── */}
      {viewMode === 'table' && (
        <main className="flex-1 bg-background overflow-x-auto overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden">
            
            <div className="p-4 bg-muted/20 border-b-2 border-foreground/20 flex items-center justify-between">
              <div>
                <h3 className="font-black uppercase text-sm text-foreground">
                  Sessões Programadas ({filteredSessions.length}) — {DAYS_STRIP.find((d) => d.dayNum === selectedDateNum)?.fullLabel}
                </h3>
                <span className="text-[11px] text-foreground/60 font-sans">
                  Visualização em lista tabular detalhada para a data selecionada
                </span>
              </div>

              <span className="text-xs font-mono font-bold text-primary">
                Faturamento Total: R$ {filteredSessions.reduce((acc, s) => acc + s.occupancy * s.price, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-display">
                <thead>
                  <tr className="border-b-2 border-foreground/20 bg-muted/40 text-[10px] font-black uppercase text-foreground/60 tracking-wider">
                    <th className="p-3">Horário</th>
                    <th className="p-3">Filme</th>
                    <th className="p-3">Sala</th>
                    <th className="p-3">Formato</th>
                    <th className="p-3">Ocupação</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Receita Atual</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 font-sans">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-foreground/50 italic">
                        Nenhuma sessão encontrada para os filtros selecionados nesta data.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const occPct = Math.round((session.occupancy / session.capacity) * 100);

                      return (
                        <tr
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                            session.hasConflict ? 'bg-secondary/5' : ''
                          }`}
                        >
                          {/* Horário */}
                          <td className="p-3 font-mono font-black text-xs text-foreground">
                            {session.startTime} → {session.endTime}
                            <span className="block text-[10px] font-normal text-foreground/50">{session.durationMinutes} min</span>
                          </td>

                          {/* Filme */}
                          <td className="p-3 font-display">
                            <span className="font-black uppercase text-xs text-foreground block">
                              {session.movieTitle}
                            </span>
                          </td>

                          {/* Sala */}
                          <td className="p-3 font-bold text-xs text-foreground">
                            {session.roomName}
                          </td>

                          {/* Formato */}
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-foreground/10 text-foreground font-mono font-bold text-[10px] uppercase">
                              {session.format} · {session.audio}
                            </span>
                          </td>

                          {/* Ocupação */}
                          <td className="p-3 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold">{occPct}%</span>
                                <span className="text-foreground/50">{session.occupancy}/{session.capacity}</span>
                              </div>
                              <div className="w-full h-1.5 bg-black/15 overflow-hidden">
                                <div
                                  className={`h-full ${session.hasConflict ? 'bg-secondary' : 'bg-[#34A853]'}`}
                                  style={{ width: `${occPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Preço Unitário */}
                          <td className="p-3 font-mono font-bold text-xs text-foreground">
                            R$ {session.price.toFixed(2)}
                          </td>

                          {/* Receita Atual */}
                          <td className="p-3 font-mono font-black text-xs text-primary">
                            R$ {(session.occupancy * session.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            {session.hasConflict ? (
                              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-black uppercase inline-flex items-center gap-1 shadow-sm">
                                <WarningCircle size={12} weight="fill" />
                                <span>Conflito</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/40 text-[10px] font-black uppercase">
                                ● Ativa
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(session);
                                }}
                                className="p-1.5 bg-background border border-foreground/30 hover:bg-muted text-foreground"
                                title="Editar Sessão"
                              >
                                <PencilSimple size={14} weight="bold" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                }}
                                className="p-1.5 bg-background border border-foreground/30 hover:bg-muted text-foreground"
                                title="Ver Detalhes"
                              >
                                <Eye size={14} weight="bold" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      )}

      {/* ─── 4. FLOATING OVERLAY SESSION INSPECTOR ─── */}
      {selectedSession && (
        <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] sm:max-w-md sm:w-96 bg-background border-l-4 border-foreground/40 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 animate-in slide-in-from-right duration-200">
          
          {/* Header Dark Box */}
          <div className="bg-[#1A2744] text-white p-4 border-2 border-foreground/40 space-y-2 relative">
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="absolute top-3 right-3 text-white/60 hover:text-white cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>

            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 block">
              SESSÃO · {selectedSession.roomName}
            </span>

            <h3 className="text-lg font-black uppercase text-white leading-tight">
              {selectedSession.movieTitle}
            </h3>

            <div className="flex items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 bg-white/20 text-[10px] font-black uppercase text-white">
                {selectedSession.format}
              </span>
              <span className="px-2 py-0.5 bg-white/20 text-[10px] font-black uppercase text-white">
                {selectedSession.audio}
              </span>
              <span className="px-2 py-0.5 bg-[#34A853]/20 border border-[#34A853] text-[#34A853] text-[10px] font-black uppercase">
                Programada
              </span>
            </div>
          </div>

          {/* Time and Date 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/20 border border-foreground/20 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-foreground/50 block">INÍCIO</span>
              <span className="font-mono font-black text-sm text-foreground">{selectedSession.startTime}</span>
              <span className="text-[10px] text-foreground/60 font-sans block">→ {selectedSession.endTime}</span>
            </div>

            <div className="p-3 bg-muted/20 border border-foreground/20 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-foreground/50 block">DATA</span>
              <span className="font-black text-xs text-foreground block">
                {DAYS_STRIP.find((d) => d.dayNum === selectedSession.dateNum)?.dayName} {selectedSession.dateNum}
              </span>
              <span className="text-[10px] text-foreground/60 font-sans block">Agosto 2026</span>
            </div>
          </div>

          {/* Occupancy and Price Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/20 border border-foreground/20 space-y-1">
              <span className="text-[10px] font-black uppercase text-foreground/50 block">OCUPAÇÃO</span>
              <span className="font-mono font-black text-base text-foreground">
                {selectedSession.occupancy}/{selectedSession.capacity}
              </span>
              <div className="w-full h-1.5 bg-black/20 overflow-hidden">
                <div
                  className="h-full bg-[#34A853]"
                  style={{ width: `${(selectedSession.occupancy / selectedSession.capacity) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-foreground/60 font-sans block">
                {Math.round((selectedSession.occupancy / selectedSession.capacity) * 100)}% · {selectedSession.capacity - selectedSession.occupancy} restantes
              </span>
            </div>

            <div className="p-3 bg-muted/20 border border-foreground/20 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-foreground/50 block">PREÇO</span>
              <span className="font-mono font-black text-base text-primary block">
                R$ {selectedSession.price}
              </span>
              <span className="text-[10px] text-foreground/60 font-sans block">por ingresso</span>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="p-3 bg-muted/20 border border-foreground/20 space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider block border-b border-foreground/10 pb-1">
              FINANCEIRO
            </span>
            <div className="flex items-center justify-between">
              <span className="text-foreground/70">Faturamento atual</span>
              <span className="font-mono font-black text-primary">
                R$ {(selectedSession.occupancy * selectedSession.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/70">Projeção (100%)</span>
              <span className="font-mono font-bold text-foreground">
                R$ {(selectedSession.capacity * selectedSession.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Conflict Section if active */}
          {selectedSession.hasConflict && (
            <div className="p-3 bg-secondary/10 border-2 border-secondary space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-secondary font-black uppercase text-[11px]">
                <WarningCircle size={16} weight="fill" />
                <span>Conflito Detectado</span>
              </div>
              <p className="font-sans text-[11px] text-foreground/80 leading-snug">
                {selectedSession.conflictDetails}
              </p>
              <button
                type="button"
                onClick={handleResolveConflict}
                className="w-full py-1.5 bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-wider hover:bg-secondary/90 transition-colors cursor-pointer"
              >
                Resolver Conflito
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-foreground/10">
            <button
              type="button"
              onClick={() => handleOpenEditModal(selectedSession)}
              className="w-full py-2.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <PencilSimple size={16} weight="bold" />
              <span>Editar Sessão</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="w-full py-2 border-2 border-destructive text-destructive font-black text-xs uppercase tracking-wider hover:bg-destructive/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash size={16} weight="bold" />
              <span>Cancelar Sessão &amp; Estornar</span>
            </button>
          </div>

        </aside>
      )}

      {/* ─── 5. SESSION MODAL: SUPPORTS SINGLE & BATCH / CINE-SEMANA PROGRAMMING ─── */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-background border-4 border-foreground shadow-[10px_10px_0px_0px_var(--border)] max-w-xl w-full p-6 sm:p-8 space-y-6 text-foreground relative my-8">
            
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-foreground/50 hover:text-foreground cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase text-foreground flex items-center gap-2">
                {editingSessionId ? 'Editar Sessão' : 'Programador de Sessões'}
              </h3>
              <p className="font-sans text-xs text-foreground/60">
                {editingSessionId
                  ? 'Modifique os dados operacionais da sessão selecionada.'
                  : 'Programe uma sessão avulsa ou replique em lote para toda a Cine-Semana.'}
              </p>
            </div>

            {/* Mode Selector (Single vs Batch) — Only visible when creating */}
            {!editingSessionId && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 border-2 border-foreground/30">
                <button
                  type="button"
                  onClick={() => setCreationMode('single')}
                  className={`py-2 px-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    creationMode === 'single'
                      ? 'bg-background text-foreground border-2 border-foreground shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Clock size={16} weight="bold" />
                  <span>Sessão Única</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMode('batch')}
                  className={`py-2 px-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    creationMode === 'batch'
                      ? 'bg-primary text-primary-foreground border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Lightning size={16} weight="fill" />
                  <span>⚡ Lote / Cine-Semana</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveSession} className="space-y-4 font-sans text-xs">
              
              {/* Movie Select */}
              <div className="space-y-1">
                <label className="font-display font-black uppercase text-foreground text-xs block">
                  Filme em Cartaz
                </label>
                <select
                  value={formMovieId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setFormMovieId(mId);
                    const movie = MOCK_MOVIES.find((m) => m.id === mId);
                    if (movie) {
                      // auto extract runtime (e.g. 166 min)
                      const dur = parseInt(movie.duration_display) || 120;
                      setFormDuration(dur);
                    }
                  }}
                  className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  {MOCK_MOVIES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.release_year}) — {m.duration_display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Select */}
              <div className="space-y-1">
                <label className="font-display font-black uppercase text-foreground text-xs block">
                  Sala de Exibição
                </label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  {ROOMS_CONFIG.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.type} ({r.seats} lugares) {r.isMaintenance ? '⚠️ [Em Manutenção]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── SINGLE MODE: DATE SELECTOR ─── */}
              {creationMode === 'single' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-display font-black uppercase text-foreground text-xs block">
                      Data da Exibição
                    </label>
                    <select
                      value={formDateNum}
                      onChange={(e) => setFormDateNum(e.target.value)}
                      className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {DAYS_STRIP.map((d) => (
                        <option key={d.dayNum} value={d.dayNum}>
                          {d.fullLabel} ({d.dayName} {d.dayNum})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-display font-black uppercase text-foreground text-xs block">
                      Horário de Início
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* ─── BATCH MODE: MULTI-DAY & MULTI-TIME SELECTOR ─── */}
              {creationMode === 'batch' && !editingSessionId && (
                <div className="p-4 bg-muted/20 border-2 border-primary space-y-4">
                  
                  {/* Days Multi-Select */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-display font-black uppercase text-foreground text-xs block flex items-center gap-1.5">
                        <CalendarCheck size={16} weight="bold" className="text-primary" />
                        <span>Dias da Semana Programados ({batchSelectedDays.length}/7)</span>
                      </label>

                      {/* Quick select presets */}
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBatchSelectedDays(['22', '23', '24', '25', '26', '27', '28'])}
                          className="px-2 py-0.5 bg-background border border-foreground/30 hover:bg-muted"
                        >
                          Toda Semana
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchSelectedDays(['22', '23', '24'])}
                          className="px-2 py-0.5 bg-background border border-foreground/30 hover:bg-muted"
                        >
                          Fim de Semana
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchSelectedDays(['25', '26', '27', '28'])}
                          className="px-2 py-0.5 bg-background border border-foreground/30 hover:bg-muted"
                        >
                          Dias Úteis
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {DAYS_STRIP.map((d) => {
                        const isSelected = batchSelectedDays.includes(d.dayNum);

                        return (
                          <button
                            key={d.dayNum}
                            type="button"
                            onClick={() => toggleBatchDay(d.dayNum)}
                            className={`p-2 border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-black shadow-sm'
                                : 'bg-background hover:bg-muted text-foreground/60 border-foreground/20 font-bold'
                            }`}
                          >
                            <span className="block text-[9px] uppercase leading-none">{d.dayName}</span>
                            <span className="block text-xs font-mono font-bold leading-tight">{d.dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multiple Daily Timeslots */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-display font-black uppercase text-foreground text-xs block flex items-center gap-1.5">
                        <Clock size={16} weight="bold" className="text-primary" />
                        <span>Horários Diários da Grade ({batchTimes.length} sessões/dia)</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAutoGenerateTimes}
                        className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                      >
                        <Sparkle size={12} weight="fill" />
                        <span>Grade Automática (25 min limpeza)</span>
                      </button>
                    </div>

                    {/* Chips of Active Times */}
                    <div className="flex flex-wrap items-center gap-2">
                      {batchTimes.map((t) => (
                        <div
                          key={t}
                          className="px-3 py-1.5 bg-background border-2 border-foreground/40 font-mono font-bold text-xs flex items-center gap-2 shadow-sm"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchTime(t)}
                            className="text-foreground/40 hover:text-destructive cursor-pointer"
                            title="Remover horário"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                      ))}

                      {/* Quick Add Times button pills */}
                      {['13:00', '15:30', '18:00', '20:30', '22:00']
                        .filter((preset) => !batchTimes.includes(preset))
                        .map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddBatchTime(preset)}
                            className="px-2.5 py-1 bg-muted/40 border border-foreground/20 font-mono text-[11px] text-foreground/70 hover:text-primary hover:border-primary cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Batch Summary Box */}
                  <div className="p-3 bg-primary/10 border border-primary/40 text-xs font-sans text-foreground flex items-center justify-between">
                    <span>
                      Total no Lote: <strong>{batchSelectedDays.length * batchTimes.length} sessões</strong> ({batchSelectedDays.length} dias x {batchTimes.length} horários).
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {ROOMS_CONFIG.find((r) => r.id === formRoomId)?.type}
                    </span>
                  </div>

                </div>
              )}

              {/* Format, Audio, Price & Duration */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-display font-black uppercase text-foreground text-xs block">
                    Formato
                  </label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    className="w-full h-10 px-2 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                    <option value="VIP">VIP</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-display font-black uppercase text-foreground text-xs block">
                    Áudio
                  </label>
                  <select
                    value={formAudio}
                    onChange={(e) => setFormAudio(e.target.value)}
                    className="w-full h-10 px-2 bg-background border-2 border-foreground/30 font-bold uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="LEG">Legendado (LEG)</option>
                    <option value="DUB">Dublado (DUB)</option>
                    <option value="NAC">Nacional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-display font-black uppercase text-foreground text-xs block">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display font-black uppercase text-foreground text-xs block">
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Save Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 border-2 border-foreground font-display font-black text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground border-2 border-primary font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--border)] hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>
                    {editingSessionId
                      ? 'Salvar Alterações'
                      : creationMode === 'batch'
                      ? `⚡ Criar Lote (${batchSelectedDays.length * batchTimes.length} Sessões)`
                      : 'Salvar Sessão'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. STANDARDIZED CANCEL SESSION STATUS MODAL ─── */}
      <StatusModal
        isOpen={isCancelConfirmOpen && !!selectedSession}
        type="destruction"
        headerTitle="CANCELAR SESSÃO"
        description="A sessão será desativada do sistema de bilheteria e os assentos ocupados serão cancelados."
        deletionDetails={
          selectedSession
            ? {
                title: selectedSession.movieTitle,
                subtitle: `${selectedSession.roomName} · ${DAYS_STRIP.find((d) => d.dayNum === selectedSession.dateNum)?.dayName} ${selectedSession.dateNum} às ${selectedSession.startTime}`,
                highlightText: `${selectedSession.occupancy} ingressos vendidos serão estornados integralmente`,
              }
            : undefined
        }
        primaryActionLabel="‹ CONFIRMAR CANCELAMENTO OPERACIONAL"
        secondaryActionLabel="MANTER SESSÃO NA GRADE"
        onPrimaryAction={handleCancelSession}
        onSecondaryAction={() => setIsCancelConfirmOpen(false)}
        onClose={() => setIsCancelConfirmOpen(false)}
      />

    </div>
  );
}
