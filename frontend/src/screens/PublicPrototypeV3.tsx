import { useState } from 'react';
import {
    Clock, Bell, Menu, Sun, Moon,
    ArrowLeft, Ticket, Star, Zap, Eye, Users, Film
} from 'lucide-react';

export default function PublicPrototypeV3() {
    const [view, setView] = useState<'feed' | 'detail'>('feed');
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isDark, setIsDark] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'now' | 'soon' | 'cinema-a' | 'cinema-b'>('now');

    const sessions = [
        {
            id: 1,
            title: "HOUSE",
            subtitle: "ハウス",
            year: "1977",
            image: "https://image.tmdb.org/t/p/original/w8idJJPGPvjLFjKHdZoca4qWNPz.jpg",
            room: "Cinema A - Sala 1",
            roomCode: "A1",
            time: "19:00",
            duration: "88min",
            occupancy: 92,
            availableSeats: 3,
            totalSeats: 40,
            color: "#FF6B35",
            accent: "#F7931E",
            status: 'now',
            cinema: 'cinema-a'
        },
        {
            id: 2,
            title: "ONE CUT OF THE DEAD",
            subtitle: "カメラを止めるな!",
            year: "2017",
            image: "https://image.tmdb.org/t/p/original/kKHAJbHlHPCKXy2zNd6VTr4e4Lw.jpg",
            room: "Cinema B - Sala 2",
            roomCode: "B2",
            time: "20:30",
            duration: "96min",
            occupancy: 68,
            availableSeats: 13,
            totalSeats: 40,
            color: "#4ECDC4",
            accent: "#44A08D",
            status: 'soon',
            cinema: 'cinema-b'
        },
        {
            id: 3,
            title: "NEAR DARK",
            subtitle: "Escuridão Total",
            year: "1987",
            image: "https://image.tmdb.org/t/p/original/sJwS6M1Y8vVHJTdgKnUZQjPHQFp.jpg",
            room: "Cinema A - Sala 3",
            roomCode: "A3",
            time: "21:15",
            duration: "94min",
            occupancy: 15,
            availableSeats: 34,
            totalSeats: 40,
            color: "#9B59B6",
            accent: "#8E44AD",
            status: 'soon',
            cinema: 'cinema-a'
        },
        {
            id: 4,
            title: "LOVE EXPOSURE",
            subtitle: "愛のむきだし",
            year: "2008",
            image: "https://image.tmdb.org/t/p/original/iVF7KhE0CzLLLhKKvDfj7TiFxqE.jpg",
            room: "Cinema B - Sala 1",
            roomCode: "B1",
            time: "22:00",
            duration: "237min",
            occupancy: 45,
            availableSeats: 22,
            totalSeats: 40,
            color: "#E74C3C",
            accent: "#C0392B",
            status: 'now',
            cinema: 'cinema-b'
        }
    ];

    const filteredSessions = sessions.filter(session => {
        if (activeFilter === 'now') return session.status === 'now';
        if (activeFilter === 'soon') return session.status === 'soon';
        if (activeFilter === 'cinema-a') return session.cinema === 'cinema-a';
        if (activeFilter === 'cinema-b') return session.cinema === 'cinema-b';
        return true;
    });

    const handleSessionClick = (session: any) => {
        setSelectedSession(session);
        setView('detail');
    };

    const getOccupancyLabel = (occupancy: number) => {
        if (occupancy >= 95) return 'LOTADO';
        if (occupancy >= 90) return 'ÚLTIMAS VAGAS';
        return `${100 - occupancy}% DISPONÍVEL`;
    };

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-surface-dark-950 text-surface-light-100' : 'bg-surface-light-50 text-surface-dark-900'
            }`}>

            {/* NOISE TEXTURE OVERLAY */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-0" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                backgroundRepeat: 'repeat'
            }}></div>

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 z-50 border-b-4 border-primary-400 transition-colors ${isDark ? 'bg-surface-dark-950' : 'bg-surface-light-50'
                }`}>
                <div className="px-6 py-3 flex justify-between items-center max-w-[1600px] mx-auto">
                    {view === 'detail' ? (
                        <button
                            onClick={() => setView('feed')}
                            className="flex items-center gap-2 font-black uppercase tracking-tighter hover:text-primary-400 transition-colors"
                        >
                            <ArrowLeft size={24} strokeWidth={3} />
                            <span className="text-sm">Voltar</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-primary-400 animate-pulse"></div>
                            <h1 className="font-black text-2xl tracking-tighter uppercase">
                                Cine<span className="text-primary-400">Pass</span>
                            </h1>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className={`p-2 border-2 transition-colors ${isDark ? 'border-white/20 hover:border-primary-400' : 'border-black/20 hover:border-primary-400'
                                }`}
                        >
                            {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>
                        <button className={`p-2 border-2 transition-colors ${isDark ? 'border-white/20 hover:border-primary-400' : 'border-black/20 hover:border-primary-400'
                            }`}>
                            <Bell size={20} strokeWidth={2.5} />
                        </button>
                        <button className={`p-2 border-2 transition-colors ${isDark ? 'border-white/20 hover:border-primary-400' : 'border-black/20 hover:border-primary-400'
                            }`}>
                            <Menu size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="pt-20 relative z-10">

                {view === 'feed' ? (
                    <div className="max-w-[1600px] mx-auto px-6 py-12">

                        {/* HERO TITLE */}
                        <div className="mb-12 relative">
                            <div className="absolute -left-4 top-0 w-2 h-full bg-primary-400"></div>
                            <h2 className="text-[clamp(3rem,8vw,10rem)] font-black leading-[0.85] tracking-tighter uppercase mb-4">
                                SESSÕES<br />
                                <span className="text-primary-400">AO VIVO</span>
                            </h2>
                            <p className={`text-xl font-bold uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                Hoje • {new Date().toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        {/* FILTERS */}
                        <div className="mb-12 flex flex-wrap gap-4">
                            {[
                                { key: 'now', label: 'Agora', icon: Zap },
                                { key: 'soon', label: 'Em Breve', icon: Clock },
                                { key: 'cinema-a', label: 'Cinema A', icon: Film },
                                { key: 'cinema-b', label: 'Cinema B', icon: Film }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key as any)}
                                    className={`px-6 py-3 font-black uppercase tracking-tight text-sm border-4 transition-all ${activeFilter === filter.key
                                        ? 'bg-primary-400 border-primary-400 text-white scale-105'
                                        : isDark
                                            ? 'border-white/10 hover:border-primary-400'
                                            : 'border-black/10 hover:border-primary-400'
                                        }`}
                                >
                                    <filter.icon className="inline mr-2" size={16} strokeWidth={3} />
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* BENTO GRID */}
                        <div className="grid grid-cols-12 gap-6 auto-rows-[280px] mb-12">
                            {filteredSessions.map((session, idx) => {
                                const isHovered = hoveredId === session.id;
                                const gridClass = idx === 0 ? 'col-span-7 row-span-2' :
                                    idx === 1 ? 'col-span-5 row-span-1' :
                                        idx === 2 ? 'col-span-5 row-span-1' :
                                            'col-span-7 row-span-1';

                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSessionClick(session)}
                                        onMouseEnter={() => setHoveredId(session.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`${gridClass} relative overflow-hidden cursor-pointer group border-4 transition-all duration-300 ${isDark
                                            ? 'border-white/10 hover:border-primary-400'
                                            : 'border-black/10 hover:border-primary-400'
                                            }`}
                                        style={{
                                            transform: isHovered ? 'scale(0.98)' : 'scale(1)',
                                        }}
                                    >
                                        {/* Image */}
                                        <img
                                            src={session.image}
                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                            style={{
                                                filter: isHovered ? 'grayscale(0%) contrast(1.1)' : 'grayscale(30%) contrast(0.9)'
                                            }}
                                        />

                                        {/* Gradient Overlay */}
                                        <div
                                            className="absolute inset-0 transition-opacity duration-300"
                                            style={{
                                                background: `linear-gradient(135deg, ${session.color}00 0%, ${session.color}99 100%)`,
                                                opacity: isHovered ? 0.8 : 0.6
                                            }}
                                        ></div>

                                        {/* Content */}
                                        <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                            {/* Top */}
                                            <div className="flex justify-between items-start">
                                                <div
                                                    className="px-4 py-2 font-black text-sm uppercase tracking-widest border-2"
                                                    style={{
                                                        backgroundColor: session.color,
                                                        borderColor: session.accent,
                                                        color: 'black'
                                                    }}
                                                >
                                                    {session.roomCode}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-5xl font-black" style={{ color: session.accent }}>
                                                        {session.occupancy}%
                                                    </div>
                                                    <div className="text-xs font-bold uppercase tracking-wide opacity-80">
                                                        {getOccupancyLabel(session.occupancy)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom */}
                                            <div>
                                                <div className="mb-3 flex items-center gap-3">
                                                    <Clock size={20} strokeWidth={3} />
                                                    <span className="text-2xl font-black">{session.time}</span>
                                                    <span className="text-sm font-bold opacity-60">• {session.duration}</span>
                                                </div>
                                                <h3 className="text-[clamp(1.5rem,3vw,4rem)] font-black leading-[0.9] tracking-tighter uppercase mb-2">
                                                    {session.title}
                                                </h3>
                                                <div className="text-sm font-bold opacity-60 uppercase tracking-widest">
                                                    {session.subtitle}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Indicator */}
                                        <div
                                            className="absolute bottom-0 left-0 h-2 bg-primary-400 transition-all duration-300"
                                            style={{ width: isHovered ? '100%' : '0%' }}
                                        ></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* STATS BAR */}
                        <div className="grid grid-cols-4 gap-6">
                            {[
                                { label: 'Sessões Ativas', value: filteredSessions.length.toString().padStart(2, '0'), icon: Zap },
                                { label: 'Total de Assentos', value: '160', icon: Users },
                                { label: 'Ao Vivo Agora', value: sessions.filter(s => s.status === 'now').length.toString().padStart(2, '0'), icon: Eye },
                                { label: 'Disponíveis', value: sessions.reduce((acc, s) => acc + s.availableSeats, 0).toString(), icon: Star }
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className={`border-4 p-6 transition-colors ${isDark
                                        ? 'border-white/10 hover:border-primary-400'
                                        : 'border-black/10 hover:border-primary-400'
                                        }`}
                                >
                                    <stat.icon size={32} strokeWidth={2.5} className="mb-3 text-primary-400" />
                                    <div className="text-5xl font-black mb-2">{stat.value}</div>
                                    <div className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* DETAIL VIEW */
                    <div className="max-w-[1600px] mx-auto px-6 py-12">
                        <div className="grid grid-cols-12 gap-8">

                            {/* LEFT: Image */}
                            <div className="col-span-5">
                                <div className="sticky top-24">
                                    <div
                                        className="aspect-[3/4] border-8 overflow-hidden relative"
                                        style={{ borderColor: selectedSession.color }}
                                    >
                                        <img src={selectedSession.image} className="w-full h-full object-cover" />

                                        {/* Occupancy Overlay */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 p-8"
                                            style={{
                                                background: `linear-gradient(to top, ${selectedSession.color}FF, ${selectedSession.color}00)`
                                            }}
                                        >
                                            <div className="text-8xl font-black mb-2">{selectedSession.occupancy}%</div>
                                            <div className="text-xl font-bold uppercase tracking-widest mb-4">
                                                {getOccupancyLabel(selectedSession.occupancy)}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className={`h-4 rounded-full overflow-hidden border-2 ${isDark ? 'bg-black/50' : 'bg-white/50'}`} style={{ borderColor: selectedSession.accent }}>
                                                <div
                                                    className="h-full transition-all duration-1000"
                                                    style={{
                                                        width: `${selectedSession.occupancy}%`,
                                                        backgroundColor: selectedSession.color
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="mt-2 text-sm font-bold opacity-80">
                                                {selectedSession.availableSeats} de {selectedSession.totalSeats} vagas disponíveis
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Info */}
                            <div className="col-span-7 space-y-12">
                                {/* Title */}
                                <div className="relative">
                                    <div
                                        className="absolute -left-6 top-0 w-3 h-full"
                                        style={{ backgroundColor: selectedSession.color }}
                                    ></div>
                                    <div className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                        Apresentação Especial
                                    </div>
                                    <h1 className="text-[clamp(3rem,8vw,8rem)] font-black leading-[0.85] tracking-tighter uppercase mb-6">
                                        {selectedSession.title}
                                    </h1>
                                    <div className={`text-3xl font-bold ${isDark ? 'opacity-60' : 'opacity-70'}`}>
                                        {selectedSession.subtitle}
                                    </div>
                                </div>

                                {/* Session Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className={`border-4 p-8 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                        <div className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                            Horário
                                        </div>
                                        <div className="text-6xl font-black">{selectedSession.time}</div>
                                        <div className={`text-sm font-bold mt-2 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                            Duração: {selectedSession.duration}
                                        </div>
                                    </div>
                                    <div className={`border-4 p-8 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                        <div className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                            Local
                                        </div>
                                        <div className="text-6xl font-black">{selectedSession.roomCode}</div>
                                        <div className={`text-sm font-bold mt-2 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
                                            {selectedSession.room}
                                        </div>
                                    </div>
                                </div>

                                {/* Synopsis */}
                                <div className="border-l-8 pl-8" style={{ borderColor: selectedSession.color }}>
                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Sinopse</h3>
                                    <p className={`text-lg leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Uma colegial viaja com seis colegas de classe para a casa de campo de sua tia doente, onde ela se depara com espíritos malignos, um gato demoníaco e um piano sedento de sangue.
                                    </p>
                                </div>

                                {/* CTA */}
                                <div className="flex gap-6">
                                    {selectedSession.occupancy >= 100 ? (
                                        <button
                                            className={`flex-1 py-6 font-black text-xl uppercase tracking-tight border-4 transition-all ${isDark
                                                ? 'border-white/20 hover:bg-white hover:text-black'
                                                : 'border-black/20 hover:bg-black hover:text-white'
                                                }`}
                                        >
                                            <Users className="inline mr-3" size={24} strokeWidth={3} />
                                            Entrar na Fila de Espera
                                        </button>
                                    ) : (
                                        <button
                                            className="flex-1 py-6 font-black text-xl uppercase tracking-tight border-4 transition-all"
                                            style={{
                                                borderColor: selectedSession.color,
                                                backgroundColor: selectedSession.color,
                                                color: 'black'
                                            }}
                                        >
                                            <Ticket className="inline mr-3" size={24} strokeWidth={3} />
                                            Garantir Vaga
                                        </button>
                                    )}
                                    <button className={`px-8 py-6 border-4 transition-colors ${isDark
                                        ? 'border-white/20 hover:border-primary-400'
                                        : 'border-black/20 hover:border-primary-400'
                                        }`}>
                                        <Star size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
