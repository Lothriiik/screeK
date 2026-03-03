import { useState } from 'react';
import {
    Clock, MapPin, Ticket, Star, Film,
    Bell, Menu, ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CircularProgress } from '../components/custom/circular-progress';

export default function PublicPrototypeV2() {
    const [activeFilter, setActiveFilter] = useState<'now' | 'soon' | 'cinema-a' | 'cinema-b'>('now');
    const [view, setView] = useState<'feed' | 'detail'>('feed');
    const [selectedSession, setSelectedSession] = useState<any>(null);

    // Mock Data - Same structure but different presentation
    const sessions = [
        {
            id: 1,
            title: "HOUSE",
            subtitle: "ハウス",
            image: "https://image.tmdb.org/t/p/original/w8idJJPGPvjLFjKHdZoca4qWNPz.jpg",
            room: "Cinema A - Sala 1",
            time: "19:00",
            duration: "88min",
            occupancy: 92,
            availableSeats: 3,
            totalSeats: 40,
            tags: ["Horror", "Experimental", "1977"],
            rating: "7.4",
            director: "Nobuhiko Ōbayashi"
        },
        {
            id: 2,
            title: "ONE CUT OF THE DEAD",
            subtitle: "カメラを止めるな!",
            image: "https://image.tmdb.org/t/p/original/kKHAJbHlHPCKXy2zNd6VTr4e4Lw.jpg",
            room: "Cinema B - Sala 2",
            time: "20:30",
            duration: "96min",
            occupancy: 68,
            availableSeats: 13,
            totalSeats: 40,
            tags: ["Comedy", "Zombie", "2017"],
            rating: "7.7",
            director: "Shin'ichirō Ueda"
        },
        {
            id: 3,
            title: "NEAR DARK",
            subtitle: "Escuridão Total",
            image: "https://image.tmdb.org/t/p/original/sJwS6M1Y8vVHJTdgKnUZQjPHQFp.jpg",
            room: "Cinema A - Sala 3",
            time: "21:15",
            duration: "94min",
            occupancy: 15,
            availableSeats: 34,
            totalSeats: 40,
            tags: ["Horror", "Western", "1987"],
            rating: "7.0",
            director: "Kathryn Bigelow"
        },
        {
            id: 4,
            title: "LOVE EXPOSURE",
            subtitle: "愛のむきだし",
            image: "https://image.tmdb.org/t/p/original/iVF7KhE0CzLLLhKKvDfj7TiFxqE.jpg",
            room: "Cinema B - Sala 1",
            time: "22:00",
            duration: "237min",
            occupancy: 45,
            availableSeats: 22,
            totalSeats: 40,
            tags: ["Drama", "Romance", "2008"],
            rating: "8.0",
            director: "Sion Sono"
        }
    ];

    const handleSessionClick = (session: any) => {
        setSelectedSession(session);
        setView('detail');
    };

    const getOccupancyStatus = (occupancy: number) => {
        if (occupancy >= 90) return { text: 'Últimas Vagas', variant: 'danger' as const, color: 'text-danger-400' };
        if (occupancy >= 70) return { text: 'Enchendo', variant: 'warning' as const, color: 'text-warning-400' };
        return { text: 'Disponível', variant: 'success' as const, color: 'text-success-400' };
    };

    return (
        <div className="bg-surface-dark-950 min-h-screen text-white font-sans selection:bg-tertiary-400 selection:text-black pb-20">

            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dark-900/95 backdrop-blur-xl border-b border-tertiary-400/20">
                <div className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
                    {view === 'detail' ? (
                        <button onClick={() => setView('feed')} className="p-2 -ml-2 hover:bg-tertiary-400/10 rounded-lg transition-colors flex items-center gap-2 text-tertiary-400">
                            <ArrowLeft size={20} />
                            <span className="font-bold text-sm">Voltar</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Film size={28} className="text-tertiary-400" strokeWidth={2.5} />
                            <div>
                                <span className="font-black tracking-tight text-xl">CinePass</span>
                                <span className="text-xs font-mono text-tertiary-400 ml-2">LIVE</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Bell size={22} className="opacity-70" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary-400 rounded-full"></span>
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Menu size={22} className="opacity-70" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CONTENT --- */}
            <div className="pt-20 px-4 max-w-6xl mx-auto min-h-screen">

                {view === 'feed' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">

                        {/* HERO BANNER */}
                        <div className="relative overflow-hidden rounded-2xl aspect-[21/9] group bg-surface-dark-900 border-2 border-tertiary-400/30 mt-6">
                            <img
                                src="https://image.tmdb.org/t/p/original/2LG71d17F86Yp2vH10hF8kQ4.jpg"
                                alt="Featured"
                                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-surface-dark-950 via-surface-dark-950/60 to-transparent"></div>

                            <div className="absolute inset-0 flex items-center px-12">
                                <div className="max-w-xl">
                                    <Badge variant="info" className="mb-4 text-xs">Destaque da Semana</Badge>
                                    <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-4 uppercase">
                                        Portrait of a<br />
                                        <span className="text-tertiary-400">Lady on Fire</span>
                                    </h1>
                                    <p className="text-white/60 text-sm mb-6 leading-relaxed max-w-md">
                                        França, 1770. Marianne é contratada para pintar o retrato de casamento de Héloïse sem que ela saiba.
                                    </p>
                                    <div className="flex items-center gap-4 text-sm font-bold mb-6">
                                        <span className="flex items-center gap-2 text-tertiary-400"><Clock size={16} /> 21:00</span>
                                        <span className="flex items-center gap-2 text-white/40"><MapPin size={16} /> Cinema A - Sala VIP</span>
                                        <Badge variant="success">12 vagas</Badge>
                                    </div>
                                    <Button size="lg" className="shadow-2xl shadow-tertiary-400/20">
                                        <Ticket size={18} /> Reservar Ingresso
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* FILTERS */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">Sessões de Hoje</h2>
                            <div className="flex gap-2">
                                {[
                                    { key: 'now', label: 'Agora' },
                                    { key: 'soon', label: 'Em Breve' },
                                    { key: 'cinema-a', label: 'Cinema A' },
                                    { key: 'cinema-b', label: 'Cinema B' }
                                ].map(filter => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveFilter(filter.key as any)}
                                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${activeFilter === filter.key
                                            ? 'bg-tertiary-400 text-surface-dark-950'
                                            : 'bg-surface-dark-900 text-white/50 hover:text-white/80 border border-white/5'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GRID LIST */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sessions.map((session) => {
                                const status = getOccupancyStatus(session.occupancy);
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSessionClick(session)}
                                        className="bg-surface-dark-900 border border-white/5 rounded-2xl overflow-hidden hover:border-tertiary-400/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex gap-5 p-5">
                                            {/* Poster */}
                                            <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden relative shadow-2xl flex-shrink-0 border-2 border-white/10">
                                                <img src={session.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                {session.occupancy >= 90 && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="destructive" className="text-[9px] shadow-lg">QUASE LOTADO</Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="font-black text-xl leading-tight mb-1 group-hover:text-tertiary-400 transition-colors">
                                                        {session.title}
                                                    </h3>
                                                    <p className="text-white/40 text-xs font-medium mb-3">{session.subtitle}</p>

                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {session.tags.map(t => (
                                                            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 font-bold uppercase tracking-wide border border-white/10">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex items-center gap-2 text-white/60">
                                                            <MapPin size={14} className="text-tertiary-400" />
                                                            <span className="font-medium">{session.room}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} className="text-tertiary-400" />
                                                                <span className="font-bold text-white">{session.time}</span>
                                                            </div>
                                                            <span className="text-white/40">• {session.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Occupancy Bar */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className={`text-xs font-bold ${status.color}`}>{status.text}</span>
                                                        <span className="text-xs font-mono text-white/40">{session.availableSeats}/{session.totalSeats} vagas</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${session.occupancy >= 90 ? 'bg-danger-400' :
                                                                session.occupancy >= 70 ? 'bg-warning-400' :
                                                                    'bg-success-400'
                                                                }`}
                                                            style={{ width: `${session.occupancy}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* DETAIL VIEW */
                    <div className="animate-in slide-in-from-right-8 duration-500 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                            {/* LEFT: Poster & Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-tertiary-400/20">
                                    <img src={selectedSession.image} className="w-full h-full object-cover" />
                                </div>

                                <div className="bg-surface-dark-900 rounded-2xl p-6 border border-white/5 space-y-4">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Direção</div>
                                        <div className="text-lg font-bold">{selectedSession.director}</div>
                                    </div>
                                    <div className="h-px bg-white/5"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Duração</div>
                                            <div className="text-sm font-bold">{selectedSession.duration}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Rating</div>
                                            <div className="text-sm font-bold flex items-center gap-1">
                                                <Star size={14} className="text-tertiary-400" fill="currentColor" />
                                                {selectedSession.rating}/10
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Details */}
                            <div className="lg:col-span-3 space-y-6">
                                <div>
                                    <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-2">
                                        {selectedSession.title}
                                    </h1>
                                    <p className="text-xl text-white/50 font-medium mb-6">{selectedSession.subtitle}</p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {selectedSession.tags.map((t: string) => (
                                            <Badge key={t} variant="outline" className="bg-white/5 border-white/20 text-white text-xs">
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Session Info Card */}
                                <div className="bg-gradient-to-br from-tertiary-400/10 to-transparent border-2 border-tertiary-400/30 rounded-2xl p-6">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-tertiary-400 mb-2">Horário</div>
                                            <div className="text-3xl font-black">{selectedSession.time}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-tertiary-400 mb-2">Local</div>
                                            <div className="text-lg font-bold leading-tight">{selectedSession.room}</div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10 mb-6"></div>

                                    {/* Occupancy */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="text-xs font-bold uppercase tracking-widest text-white/60">Ocupação</div>
                                            <div className="text-sm font-mono text-white/80">
                                                {selectedSession.availableSeats} vagas restantes
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                <div className="h-3 bg-surface-dark-950 rounded-full overflow-hidden border border-white/10">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${selectedSession.occupancy >= 90 ? 'bg-danger-400' :
                                                            selectedSession.occupancy >= 70 ? 'bg-warning-400' :
                                                                'bg-success-400'
                                                            }`}
                                                        style={{ width: `${selectedSession.occupancy}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs font-mono text-white/40">
                                                    <span>0</span>
                                                    <span>{selectedSession.totalSeats}</span>
                                                </div>
                                            </div>

                                            <div className="scale-90">
                                                <CircularProgress
                                                    value={selectedSession.occupancy}
                                                    size={70}
                                                    strokeWidth={6}
                                                    color={
                                                        selectedSession.occupancy >= 90 ? 'text-danger-400' :
                                                            selectedSession.occupancy >= 70 ? 'text-warning-400' :
                                                                'text-success-400'
                                                    }
                                                    isDark
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Synopsis */}
                                <div className="bg-surface-dark-900 rounded-2xl p-6 border border-white/5">
                                    <h3 className="font-bold text-lg mb-3 text-tertiary-400">Sinopse</h3>
                                    <p className="text-white/60 leading-relaxed">
                                        Em uma ilha isolada na Bretanha, no final do século XVIII, uma pintora é obrigada a pintar um retrato de casamento de uma jovem mulher. Marianne chega sob o pretexto de ser uma dama de companhia de Héloïse, que se recusa a posar para um retrato destinado a um pretendente que ela nunca conheceu.
                                    </p>
                                </div>

                                {/* CTA */}
                                <div className="flex gap-4">
                                    <Button size="lg" className="flex-1 shadow-2xl shadow-tertiary-400/20" variant="default">
                                        <Ticket size={20} /> Garantir Vaga
                                    </Button>
                                    <Button size="lg" variant="secondary" className="px-8">
                                        <Star size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
