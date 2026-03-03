import { useState } from 'react';
import {
    Clock, MapPin, Ticket,
    ArrowLeft, Bell, Menu, ChevronRight, Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CircularProgress } from '../components/custom/circular-progress';

export default function PublicPrototype() {
    const [activeTab, setActiveTab] = useState<'now' | 'soon'>('now');
    const [view, setView] = useState<'feed' | 'detail'>('feed');
    const [selectedSession, setSelectedSession] = useState<any>(null);

    // Mock Data inspired by the user's movie list
    const sessions = [
        {
            id: 1,
            title: "MAD MAX: FURY ROAD",
            image: "https://image.tmdb.org/t/p/original/8tZYtu9erp5ferjon57xNh6h5M.jpg",
            room: "Sala 1 (IMAX)",
            time: "19:00",
            occupancy: 95,
            isFull: true,
            tags: ["Action", "Sci-Fi"],
            rating: "98%"
        },
        {
            id: 2,
            title: "SPEED RACER",
            image: "https://image.tmdb.org/t/p/original/61eQ4q9y2rNlFv68uZ94K4rEw4.jpg",
            room: "Sala 2",
            time: "20:30",
            occupancy: 45,
            isFull: false,
            tags: ["Racing", "Family"],
            rating: "85%"
        },
        {
            id: 3,
            title: "PORTRAIT OF A LADY ON FIRE",
            image: "https://image.tmdb.org/t/p/original/2LG71d17F86Yp2vH10hF8kQ4.jpg", // Broken link placeholder? No, standard TMDB format usually works, but I'll use placeholders if needed.
            room: "Sala 3",
            time: "21:00",
            occupancy: 12,
            isFull: false,
            tags: ["Drama", "Romance"],
            rating: "92%"
        },
        {
            id: 4,
            title: "CHAINSAW MAN: REZE ARC",
            image: "https://image.tmdb.org/t/p/original/npOnzAbLh6VOIu3naU5QaEcTepo.jpg",
            room: "Sala 1",
            time: "22:15",
            occupancy: 88,
            isFull: false,
            tags: ["Anime", "Horror"],
            rating: "95%"
        }
    ];

    const handleSessionClick = (session: any) => {
        setSelectedSession(session);
        setView('detail');
    };

    return (
        <div className="bg-surface-dark-950 min-h-screen text-white font-sans selection:bg-primary-400 selection:text-white pb-20">

            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dark-950/80 backdrop-blur-md border-b border-white/5">
                <div className="px-6 py-4 flex justify-between items-center max-w-md mx-auto">
                    {view === 'detail' ? (
                        <button onClick={() => setView('feed')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>
                            <span className="font-black tracking-tighter text-lg uppercase">CinePass<span className="text-primary-400">.Live</span></span>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button className="relative">
                            <Bell size={24} className="opacity-80" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-400 rounded-full"></span>
                        </button>
                        <Menu size={24} className="opacity-80" />
                    </div>
                </div>
            </header>

            {/* --- CONTENT --- */}
            <div className="pt-24 px-6 max-w-md mx-auto min-h-screen">

                {view === 'feed' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* HERO SECTION */}
                        <div className="relative overflow-hidden rounded-3xl aspect-[4/5] group bg-surface-dark-900 border border-white/5">
                            <img
                                src="https://image.tmdb.org/t/p/original/wfnMt6xxe0pnhtpivtg8yDIP47e.jpg"
                                alt="Featured"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark-950 via-surface-dark-950/20 to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <Badge variant="default" className="mb-3">Premiere Only</Badge>
                                <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-2 uppercase text-white drop-shadow-lg">
                                    In The Mood<br /><span className="text-primary-400">For Love</span>
                                </h1>
                                <div className="flex items-center gap-4 text-sm font-bold opacity-80 mb-6">
                                    <span className="flex items-center gap-1"><Clock size={14} /> 20:00</span>
                                    <span className="flex items-center gap-1"><MapPin size={14} /> Sala VIP</span>
                                </div>
                                <Button className="w-full shadow-orange-500/20" size="lg">Get Tickets</Button>
                            </div>
                        </div>

                        {/* FILTERS */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                onClick={() => setActiveTab('now')}
                                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'now' ? 'bg-white text-surface-dark-950' : 'bg-surface-dark-800 text-white/50 border border-white/5'}`}
                            >
                                Happening Now
                            </button>
                            <button
                                onClick={() => setActiveTab('soon')}
                                className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'soon' ? 'bg-white text-surface-dark-950' : 'bg-surface-dark-800 text-white/50 border border-white/5'}`}
                            >
                                Coming Soon
                            </button>
                        </div>

                        {/* FEED LIST */}
                        <div className="space-y-6">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => handleSessionClick(session)}
                                    className="bg-surface-dark-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden relative shadow-lg">
                                        <img src={session.image} className="w-full h-full object-cover" />
                                        {session.isFull && (
                                            <div className="absolute inset-0 bg-danger-500/80 flex items-center justify-center font-black text-xs uppercase tracking-widest text-white rotate-12 backdrop-blur-sm">
                                                Sold Out
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-black text-lg leading-tight uppercase line-clamp-2">{session.title}</h3>
                                                <Badge variant={session.occupancy > 90 ? "destructive" : session.occupancy > 50 ? "warning" : "success"}>
                                                    {session.occupancy}%
                                                </Badge>
                                            </div>
                                            <p className="text-white/40 text-xs font-bold uppercase tracking-wide mb-2">{session.room}</p>
                                            <div className="flex gap-2">
                                                {session.tags.map((t: string) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-bold">{t}</span>)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-1.5 text-primary-400 font-bold">
                                                <Clock size={16} />
                                                {session.time}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary-400 group-hover:text-white transition-colors">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* DETAIL VIEW */
                    <div className="animate-in slide-in-from-right-8 duration-500">
                        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/10 mb-8">
                            <img src={selectedSession.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark-950 via-transparent to-transparent"></div>

                            {/* Floating Stats */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <div className="w-16 h-16 bg-surface-dark-950/80 backdrop-blur rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                    <span className="text-xs font-bold opacity-50 uppercase">Rating</span>
                                    <span className="text-lg font-black text-primary-400">{selectedSession.rating}</span>
                                </div>
                                <div className="w-16 h-16 bg-surface-dark-950/80 backdrop-blur rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                    <span className="text-xs font-bold opacity-50 uppercase">Room</span>
                                    <span className="text-lg font-black text-white">01</span>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h1 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tighter mb-4 text-white drop-shadow-xl">
                                    {selectedSession.title}
                                </h1>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedSession.tags.map((t: string) => (
                                        <Badge key={t} variant="outline" className="backdrop-blur-md bg-white/5 border-white/20 text-white">{t}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 pb-32">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5">
                                <div>
                                    <div className="text-xs font-bold uppercase opacity-40 mb-1">Occupancy</div>
                                    <div className="text-2xl font-black">{selectedSession.occupancy}% <span className="text-sm font-medium opacity-50 font-sans">Full</span></div>
                                </div>
                                <div className="scale-100">
                                    <CircularProgress
                                        value={selectedSession.occupancy}
                                        size={60}
                                        color={selectedSession.occupancy > 90 ? 'text-danger-500' : selectedSession.occupancy > 50 ? 'text-warning-500' : 'text-primary-400'}
                                        isDark
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-4">Synopsis</h3>
                                <p className="text-white/60 leading-relaxed">
                                    In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.
                                </p>
                            </div>
                        </div>

                        {/* FIXED BOTTOM ACTION */}
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface-dark-950 to-transparent z-40">
                            <div className="max-w-md mx-auto flex gap-4">
                                <Button size="lg" className="flex-1 shadow-xl shadow-primary-500/20" variant="default" icon={<Ticket />}>
                                    Book Seat
                                </Button>
                                <Button size="lg" variant="secondary" className="aspect-square px-0 w-14 flex items-center justify-center">
                                    <Star size={20} fill="currentColor" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
