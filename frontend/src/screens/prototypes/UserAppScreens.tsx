import { useState } from 'react';
import {
  Star,
  QrCode,
  ArrowRight,
  Ticket,
  X,
  MagnifyingGlass,
  MapPin,
  Phone,
  User,
  Heart,
  ChatCircle,
  Gear,
  Warning
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tag } from '../../components/custom/tag';
import { MovieCard } from '../../components/custom/movie-card';
import { CinemaTicket } from '../../components/custom/cinema-ticket';
import { OrderSummary } from '../../components/custom/order-summary';
import { ReviewRow } from '../../components/custom/review-row';
import { StarRating } from '../../components/custom/star-rating';
import { CircularProgress } from '../../components/custom/circular-progress';

export function UserAppScreens() {
  const [activeScreen, setActiveScreen] = useState<string>('home');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['D7', 'D8']);
  const [searchTab, setSearchTab] = useState<'movies' | 'people' | 'users'>('movies');
  const [catalogMinRating, setCatalogMinRating] = useState<number>(7.0);
  const [followersTab, setFollowersTab] = useState<'followers' | 'following'>('followers');
  const [ticketsTab, setTicketsTab] = useState<'future' | 'past'>('future');
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({
    'ana': false,
    'rafael': true,
    'julia': false,
    'pedro': true,
  });

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [showCancelTicketModal, setShowCancelTicketModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState<boolean>(false);
  const [modalRating, setModalRating] = useState<number>(5);

  const screens = [
    { id: 'home', label: '🏠 Home (Em Cartaz)', category: 'Principal' },
    { id: 'sessions', label: '🎟️ Horários & Sessões', category: 'Compra' },
    { id: 'seats', label: '💺 Mapa de Assentos', category: 'Compra' },
    { id: 'checkout', label: '💳 Checkout & PIX', category: 'Compra' },
    { id: 'ticket', label: '📱 Ingresso Digital QR', category: 'Compra' },
    { id: 'catalog', label: '📚 Catálogo com Filtros', category: 'Explorar' },
    { id: 'search', label: '🔍 Busca Global', category: 'Explorar' },
    { id: 'movie_detail', label: '🎬 Detalhes do Filme', category: 'Explorar' },
    { id: 'person', label: '👤 Ator / Diretor', category: 'Explorar' },
    { id: 'cinema', label: '📍 Página do Cinema', category: 'Explorar' },
    { id: 'user_profile', label: '⭐ Meu Perfil Cinéfilo', category: 'Social' },
    { id: 'tickets', label: '🎫 Meus Ingressos', category: 'Social' },
    { id: 'followers', label: '👥 Seguidores / Seguindo', category: 'Social' },
    { id: 'feed', label: '🌐 Feed Social', category: 'Social' },
    { id: 'notifications', label: '🔔 Notificações', category: 'Social' },
    { id: 'admin', label: '⚙️ Admin de Sessões', category: 'Admin' },
    { id: 'auth_login', label: '🔐 Login', category: 'Auth' },
    { id: 'auth_register', label: '📝 Cadastro', category: 'Auth' },
    { id: 'auth_forgot', label: '🔑 Esqueci a Senha', category: 'Auth' },
  ];

  return (
    <div className="space-y-6">
      {/* Top 19-Screen Horizontal Selector Bar */}
      <div className="bg-card border-2 border-border p-3 rounded-xl shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1 shrink-0">Todas as 19 Telas:</span>
          {screens.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScreen(sc.id)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeScreen === sc.id
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted/30 hover:bg-muted text-foreground/80 border border-border/50'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HOME / EM CARTAZ */}
      {/* ========================================================================= */}
      {activeScreen === 'home' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10 text-white shadow-xl">
            <div className="max-w-xl space-y-3 z-10 relative">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary text-white font-bold">DESTAQUE DA SEMANA</Badge>
                <span className="text-xs text-white/70">2h46min • Ficção Científica</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Duna: Parte II (2024)</h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-3">
                Paul Atreides une-se a Chani e aos Fremen enquanto trilha um caminho de vingança para salvar o universo de um futuro terrível.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => setActiveScreen('sessions')} className="font-bold">
                  <Ticket size={16} className="mr-1.5" /> Ver Horários & Ingressos
                </Button>
                <Button variant="outline" className="text-white border-white/40 hover:bg-white/10" onClick={() => setActiveScreen('movie_detail')}>
                  Detalhes do Filme
                </Button>
              </div>
            </div>
          </div>

          {/* Date Strip & Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border-2 border-border p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Dia:</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {['Hoje (Qui 26)', 'Sex 27', 'Sáb 28', 'Dom 01', 'Seg 02'].map((d, i) => (
                  <button
                    key={d}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">São Paulo • Cinemark Bourbon</Badge>
            </div>
          </div>

          {/* Movie Cards Grid */}
          <div className="space-y-3">
            <h3 className="font-black text-lg">Em Cartaz Hoje</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MovieCard id="1" title="Duna: Parte II" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.9} duration="2h46" genre="SCI-FI" ageRating="14" tagType="release" eventLabel="DESTAQUE" />
              <MovieCard id="2" title="Deadpool & Wolv." posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={4.5} duration="2h08" genre="AÇÃO" ageRating="18" tagType="none" />
              <MovieCard id="3" title="Alien: Romulus" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.7} duration="1h59" genre="TERROR" ageRating="16" tagType="pre_sale" eventLabel="PRÉ-VENDA" />
              <MovieCard id="4" title="Conclave" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={4.8} duration="2h00" genre="SUSPENSE" ageRating="14" tagType="none" />
              <MovieCard id="5" title="Chainsaw Man: Reze" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.9} duration="1h42" genre="ANIME" ageRating="16" tagType="release" eventLabel="ESTREIA" />
              <MovieCard id="6" title="Blade Runner 2049" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={5.0} duration="2h44" genre="SCI-FI" ageRating="14" tagType="re_release" eventLabel="REEXIBIÇÃO" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SESSÕES POR CINEMA */}
      {/* ========================================================================= */}
      {activeScreen === 'sessions' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex justify-between items-start">
            <div>
              <Badge variant="default">SESSÕES DISPONÍVEIS</Badge>
              <h2 className="text-2xl font-black mt-1">Duna: Parte II (2024)</h2>
              <p className="text-xs text-muted-foreground">Cinemark Bourbon • 2h46min • 14 anos</p>
            </div>
            <Button size="sm" onClick={() => setActiveScreen('seats')}>
              Ir para Mapa de Assentos
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div onClick={() => setActiveScreen('seats')} className="p-4 bg-muted/20 border-2 border-border hover:border-primary rounded-xl cursor-pointer transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-primary">13:30</span>
                <Tag>IMAX Laser LEG</Tag>
              </div>
              <p className="text-xs text-muted-foreground">Sala 04 IMAX • R$ 52,00</p>
              <div className="flex items-center gap-2 text-xs">
                <CircularProgress value={8} size={32} />
                <span className="text-green-600 font-bold">192 lugares livres (8% ocupado)</span>
              </div>
            </div>

            <div onClick={() => setActiveScreen('seats')} className="p-4 bg-muted/20 border-2 border-border hover:border-primary rounded-xl cursor-pointer transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-primary">19:00</span>
                <Tag>4DX 3D DUB</Tag>
              </div>
              <p className="text-xs text-muted-foreground">Sala 02 4DX • R$ 68,00</p>
              <div className="flex items-center gap-2 text-xs">
                <CircularProgress value={80} size={32} />
                <span className="text-amber-500 font-bold">Últimas 16 vagas (80% ocupado)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAPA DE ASSENTOS */}
      {/* ========================================================================= */}
      {activeScreen === 'seats' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h3 className="font-black text-lg">Selecione suas Poltronas</h3>
              <p className="text-xs text-muted-foreground">Duna: Parte II • 19:00 • Sala 4 IMAX</p>
            </div>
            <Badge variant="destructive">08:32 RESTANTES</Badge>
          </div>

          <div className="text-center py-2">
            <div className="w-3/4 h-2 bg-primary mx-auto rounded-t-full shadow-[0_-2px_10px_rgba(235,47,97,0.5)] mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">TELA DO CINEMA</span>
          </div>

          <div className="space-y-2">
            {['F', 'E', 'D', 'C', 'B', 'A'].map((row) => (
              <div key={row} className="flex justify-center items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-4">{row}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => {
                    const id = `${row}${col}`;
                    const isSelected = selectedSeats.includes(id);
                    const isOccupied = ['F3', 'F4', 'E5', 'C2', 'B6'].includes(id);
                    return (
                      <button
                        key={col}
                        disabled={isOccupied}
                        onClick={() => {
                          if (isSelected) setSelectedSeats(selectedSeats.filter((s) => s !== id));
                          else setSelectedSeats([...selectedSeats, id]);
                        }}
                        className={`w-7 h-7 rounded text-[10px] font-bold transition-all ${
                          isOccupied
                            ? 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary text-white scale-110 shadow-md ring-2 ring-primary'
                            : 'bg-muted/40 hover:bg-muted border border-border'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              <span className="text-xs text-muted-foreground">Assentos: <strong>{selectedSeats.join(', ')}</strong></span>
              <div className="text-lg font-black text-primary">R$ {(selectedSeats.length * 52).toFixed(2)}</div>
            </div>
            <Button onClick={() => setActiveScreen('checkout')}>
              Ir para Checkout <ArrowRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHECKOUT */}
      {/* ========================================================================= */}
      {activeScreen === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
              <h3 className="font-black text-lg border-b border-border pb-3">Forma de Pagamento</h3>
              
              <div className="p-4 bg-muted/20 border border-border rounded-xl text-center space-y-3">
                <Badge variant="default">PIX INSTANTÂNEO</Badge>
                <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg border-2 border-border flex items-center justify-center">
                  <QrCode size={130} className="text-slate-900" />
                </div>
                <div className="text-xs font-mono text-muted-foreground">Chave: 00020126580014br.gov.bcb.pix0136...</div>
              </div>

              <Button className="w-full font-bold" onClick={() => setActiveScreen('ticket')}>
                Confirmar Pagamento Simulado
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <OrderSummary
              movieTitle="Duna: Parte II"
              cinemaName="Cinemark Bourbon"
              cinemaLocation="Perdizes, São Paulo"
              sessionRoomTime="Sala 4 IMAX · Sex 27/03 · 19:00"
              seats={selectedSeats}
              subtotal={selectedSeats.length * 50}
              serviceFee={selectedSeats.length * 4.5}
              totalPrice={selectedSeats.length * 54.5}
              ratingBadge="14"
              formatBadges={['IMAX', 'LEG']}
              showTimer={true}
              timerSeconds={450}
              onConfirm={() => setActiveScreen('ticket')}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INGRESSO DIGITAL */}
      {/* ========================================================================= */}
      {activeScreen === 'ticket' && (
        <div className="max-w-xl mx-auto space-y-4">
          <CinemaTicket
            movieTitle="Duna: Parte II"
            cinemaName="Cinemark Bourbon"
            roomName="SALA 4 IMAX"
            seats={selectedSeats}
            date="Sex 27/03"
            time="19:00"
            ticketType="standard"
            price={109.0}
            ticketCategory="2x Inteira"
            audioFormat="LEG"
            screenFormat="IMAX"
            code="#SKR-20240327-4891"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setActiveScreen('tickets')}>
              Ver Todos os Ingressos
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowCancelTicketModal(true)}>
              Cancelar Ingresso
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CATÁLOGO COM FILTROS AVANÇADOS */}
      {/* ========================================================================= */}
      {activeScreen === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-card border-2 border-border rounded-xl shadow-sm overflow-hidden">
          {/* Left Sidebar Filters */}
          <div className="md:col-span-3 p-5 border-r border-border space-y-6 bg-muted/10">
            {/* Gênero */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gênero</h4>
              <div className="space-y-1.5 text-xs">
                {['Ação', 'Aventura', 'Ficção Científica', 'Drama', 'Terror', 'Romance', 'Anime'].map((g, idx) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={idx === 0 || idx === 2} className="rounded" />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ano</h4>
              <div className="space-y-1.5 text-xs">
                {['2024 – 2026', '2020 – 2023', '2010 – 2019', 'Clássicos (< 2000)'].map((y, idx) => (
                  <label key={y} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={idx === 0} className="rounded" />
                    <span>{y}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Rating Slider */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota Mínima</h4>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={catalogMinRating}
                onChange={(e) => setCatalogMinRating(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs font-black text-primary">≥ {catalogMinRating.toFixed(1)} ★</div>
            </div>
          </div>

          {/* Right Movie Grid */}
          <div className="md:col-span-9 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl">Explorar Acervo</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="default">Populares</Button>
                <Button size="sm" variant="ghost">Melhor Avaliados</Button>
                <Button size="sm" variant="ghost">Mais Recentes</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <MovieCard id="1" title="2001: Uma Odisseia" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.9} duration="2h29" genre="FICÇÃO" ageRating="L" />
              <MovieCard id="2" title="O Poderoso Chefão" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={5.0} duration="2h55" genre="DRAMA" ageRating="14" />
              <MovieCard id="3" title="Blade Runner 2049" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.8} duration="2h44" genre="FICÇÃO" ageRating="14" />
              <MovieCard id="4" title="Parasita" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={4.9} duration="2h12" genre="SUSPENSE" ageRating="16" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. BUSCA GLOBAL COM ABAS */}
      {/* ========================================================================= */}
      {activeScreen === 'search' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          {/* Large Search Bar */}
          <div className="relative">
            <MagnifyingGlass size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              defaultValue="Duna"
              placeholder="Busque por filme, diretor (ex: Denis Villeneuve) ou @usuário..."
              className="w-full bg-background border-2 border-border pl-12 pr-4 py-3 rounded-xl text-base font-medium outline-none focus:border-primary shadow-inner"
            />
          </div>

          {/* Abas */}
          <div className="flex border-b border-border gap-4">
            {(['movies', 'people', 'users'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSearchTab(tab)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  searchTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'movies' ? 'Filmes (2)' : tab === 'people' ? 'Pessoas (2)' : 'Usuários (1)'}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="space-y-3">
            <div onClick={() => setActiveScreen('movie_detail')} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 cursor-pointer border border-border">
              <div className="w-12 h-16 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-white/50">POSTER</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Duna: Parte II</h4>
                <p className="text-xs text-muted-foreground">Ficção Científica • 2024 • ★ 4.9</p>
              </div>
              <Badge variant="default">14 ANOS</Badge>
            </div>

            <div onClick={() => setActiveScreen('person')} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 cursor-pointer border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">DV</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Denis Villeneuve</h4>
                <p className="text-xs text-muted-foreground">Diretor & Roteirista • Duna, Blade Runner 2049, A Chegada</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DETALHES DO FILME */}
      {/* ========================================================================= */}
      {activeScreen === 'movie_detail' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-72 bg-slate-800 rounded-xl flex items-center justify-center text-white/40 font-bold border border-border">
              POSTER 3:4
            </div>
            <div className="md:col-span-3 space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="default">EM CARTAZ</Badge>
                <Tag>FICÇÃO CIENTÍFICA</Tag>
                <Tag>AVENTURA</Tag>
                <span className="text-xs text-muted-foreground">2024 • 2h46min • 14 anos</span>
              </div>
              <h2 className="text-3xl font-black">Duna: Parte II</h2>
              <p className="text-xs text-muted-foreground">Direção: Denis Villeneuve • Roteiro: Jon Spaihts, Denis Villeneuve</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Paul Atreides une-se a Chani e aos Fremen enquanto trilha um caminho de vingança contra os conspiradores que destruíram sua família. Diante de uma escolha entre o amor de sua vida e o destino do universo, ele precisa evitar um futuro terrível.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => setActiveScreen('sessions')} className="font-bold">
                  Comprar Ingressos →
                </Button>
                <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                  <Star size={16} className="mr-1 text-amber-500" /> Escrever Avaliação
                </Button>
              </div>
            </div>
          </div>

          {/* Cast Circular Avatars */}
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="font-black text-base">Elenco Principal</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[
                { name: 'Timothée Chalamet', char: 'Paul Atreides', init: 'TC' },
                { name: 'Zendaya', char: 'Chani', init: 'ZD' },
                { name: 'Rebecca Ferguson', char: 'Lady Jessica', init: 'RF' },
                { name: 'Austin Butler', char: 'Feyd-Rautha', init: 'AB' },
                { name: 'Florence Pugh', char: 'Princesa Irulan', init: 'FP' },
              ].map((c) => (
                <div key={c.name} onClick={() => setActiveScreen('person')} className="text-center shrink-0 cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center font-bold text-primary mx-auto mb-1">
                    {c.init}
                  </div>
                  <p className="text-xs font-bold w-20 truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground w-20 truncate">{c.char}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews with Spoiler Blur */}
          <div className="border-t border-border pt-4 space-y-4">
            <h3 className="font-black text-base">Avaliações da Comunidade</h3>
            <ReviewRow name="Lucas Loth" handle="@lothrik" dateLabel="21 mar 2024" avatarUrl="https://github.com/shadcn.png" rating={5} reviewText="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade." />
            <ReviewRow name="Maria Clara" handle="@mclara" dateLabel="22 mar 2024" avatarUrl="https://github.com/shadcn.png" rating={4} hasSpoiler={true} reviewText="O final é sombrio e corajoso com Paul aceitando seu papel como messias." />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PÁGINA DE ATOR / DIRETOR */}
      {/* ========================================================================= */}
      {activeScreen === 'person' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-border pb-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary font-black text-3xl text-primary flex items-center justify-center">
              DV
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-3xl font-black">Denis Villeneuve</h2>
              <Badge variant="default">DIRETOR • ROTEIRISTA</Badge>
              <p className="text-xs text-muted-foreground max-w-lg mt-2 leading-relaxed">
                Cineasta canadense nascido em 1967, conhecido por filmes visualmente deslumbrantes e narrativamente complexos como Incêndios (2010), Sicario, A Chegada, Blade Runner 2049 e Duna.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-lg">Filmografia em Destaque</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <MovieCard id="1" title="Duna: Parte II" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.9} duration="2h46" genre="SCI-FI" ageRating="14" />
              <MovieCard id="2" title="Blade Runner 2049" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={4.8} duration="2h44" genre="SCI-FI" ageRating="14" />
              <MovieCard id="3" title="A Chegada" posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg" rating={4.7} duration="1h56" genre="SCI-FI" ageRating="12" />
              <MovieCard id="4" title="Sicario" posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" rating={4.6} duration="2h01" genre="AÇÃO" ageRating="16" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PÁGINA DO CINEMA */}
      {/* ========================================================================= */}
      {activeScreen === 'cinema' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
            <div>
              <Badge variant="default" className="mb-1">CINEMA PARCEIRO</Badge>
              <h2 className="text-3xl font-black">Cinemark Bourbon</h2>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p className="flex items-center gap-1.5"><MapPin size={15} /> Rua Turiassu, 2100 — Perdizes, São Paulo / SP</p>
                <p className="flex items-center gap-1.5"><Phone size={15} /> (11) 3872-2200</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Tag>IMAX</Tag><Tag>4DX</Tag><Tag>VIP</Tag><Tag>14 SALAS</Tag>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Programação do Dia</h3>
            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base">Duna: Parte II</h4>
                  <p className="text-xs text-muted-foreground">Ficção Científica • 2h46min • 14 anos</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['13:30 (IMAX)', '16:15 (IMAX)', '19:00 (4DX)', '21:45 (VIP)'].map((time) => (
                  <Button key={time} size="sm" variant="outline" onClick={() => setActiveScreen('seats')}>
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MEU PERFIL CINÉFILO */}
      {/* ========================================================================= */}
      {activeScreen === 'user_profile' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-border pb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary text-primary font-black text-2xl flex items-center justify-center">
              LK
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black">Lothrik Arévalo</h2>
              <p className="text-xs text-muted-foreground">@lothrik • São Paulo, SP</p>
              <p className="text-xs text-foreground/90 max-w-md">
                Cinéfilo assumido. Fanático por ficção científica e Denis Villeneuve. Tentando assistir 100 filmes em 2026.
              </p>
              <div className="flex gap-4 pt-2 text-xs font-bold justify-center sm:justify-start">
                <button onClick={() => setActiveScreen('followers')} className="hover:text-primary"><strong>284</strong> Seguidores</button>
                <button onClick={() => setActiveScreen('followers')} className="hover:text-primary"><strong>117</strong> Seguindo</button>
                <span><strong>432</strong> Assistidos</span>
                <span><strong>38</strong> Reviews</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowSettingsModal(true)}>
                <Gear size={15} className="mr-1" /> Configurações
              </Button>
            </div>
          </div>

          {/* Top 3 Films Showcase */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top 3 Filmes Favoritos:</h4>
            <div className="grid grid-cols-3 gap-3">
              {['Duna: Parte II', 'Blade Runner 2049', 'A Chegada'].map((f, i) => (
                <div key={f} className="p-3 bg-muted/20 border-2 border-border rounded-xl text-center">
                  <div className="text-xs font-black text-primary">#{i + 1}</div>
                  <div className="text-xs font-bold truncate">{f}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MEUS INGRESSOS (FUTUROS & PASSADOS) */}
      {/* ========================================================================= */}
      {activeScreen === 'tickets' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-black text-xl">Meus Ingressos</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTicketsTab('future')}
                className={`px-3 py-1 text-xs font-bold rounded ${ticketsTab === 'future' ? 'bg-primary text-white' : 'bg-muted'}`}
              >
                Futuros (1)
              </button>
              <button
                onClick={() => setTicketsTab('past')}
                className={`px-3 py-1 text-xs font-bold rounded ${ticketsTab === 'past' ? 'bg-primary text-white' : 'bg-muted'}`}
              >
                Passados (8)
              </button>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="p-4 bg-muted/20 border-2 border-border rounded-xl flex justify-between items-center">
              <div>
                <Badge variant="default" className="mb-1">CONFIRMADO</Badge>
                <h4 className="font-bold text-base">Duna: Parte II</h4>
                <p className="text-xs text-muted-foreground">Cinemark Bourbon • Sala 4 IMAX • Sex 27/03 às 19:00</p>
                <p className="text-xs font-mono text-primary font-bold mt-1">Assentos: D7, D8</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => setActiveScreen('ticket')}>Ver QR Code</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCancelTicketModal(true)}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. SEGUIDORES & SEGUINDO */}
      {/* ========================================================================= */}
      {activeScreen === 'followers' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => setFollowersTab('followers')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 ${
                followersTab === 'followers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Seguidores (284)
            </button>
            <button
              onClick={() => setFollowersTab('following')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 ${
                followersTab === 'following' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              Seguindo (117)
            </button>
          </div>

          <div className="space-y-3">
            {[
              { id: 'ana', name: 'Ana Melo', handle: '@anamelo', watched: 312, init: 'AM' },
              { id: 'rafael', name: 'Rafael Braga', handle: '@rafaelbraga', watched: 89, init: 'RB' },
              { id: 'julia', name: 'Julia Campos', handle: '@juliac', watched: 540, init: 'JC' },
              { id: 'pedro', name: 'Pedro Lima', handle: '@pedrolima', watched: 201, init: 'PL' },
            ].map((u) => {
              const isFollowing = followingStates[u.id];
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                      {u.init}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none">{u.name}</h4>
                      <span className="text-xs text-muted-foreground">{u.handle} • {u.watched} assistidos</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'ghost' : 'outline'}
                    onClick={() => setFollowingStates({ ...followingStates, [u.id]: !isFollowing })}
                  >
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. FEED SOCIAL */}
      {/* ========================================================================= */}
      {activeScreen === 'feed' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-black text-2xl">Feed Social</h3>

          <div className="p-4 bg-card border-2 border-border rounded-xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">AM</div>
                <div><span className="font-bold text-xs">Ana Melo</span> <span className="text-muted-foreground text-[11px]">deu 4.5 ★ para</span> <strong>Duna: Parte II</strong></div>
              </div>
              <span className="text-[10px] text-muted-foreground">há 2h</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
              <button className="flex items-center gap-1 hover:text-primary"><Heart size={14} /> Curtir</button>
              <button onClick={() => setShowCommentModal(true)} className="flex items-center gap-1 hover:text-primary"><ChatCircle size={14} /> Comentar</button>
            </div>
          </div>

          <div className="p-4 bg-card border-2 border-border rounded-xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary font-bold flex items-center justify-center text-xs">JC</div>
                <div><span className="font-bold text-xs">Julia Campos</span> <span className="text-muted-foreground text-[11px]">escreveu uma review de</span> <strong>Conclave</strong></div>
              </div>
              <span className="text-[10px] text-muted-foreground">há 6h</span>
            </div>
            <p className="text-xs bg-muted/20 p-3 rounded-lg text-foreground/90 leading-relaxed">
              "Um dos melhores filmes políticos dos últimos anos. O roteiro é cirúrgico e as atuações são impecáveis."
            </p>
            <div className="flex gap-3 text-xs text-muted-foreground pt-1">
              <span className="text-primary font-bold">❤ 23 curtidas</span>
              <button onClick={() => setShowCommentModal(true)}>💬 5 comentários</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. NOTIFICAÇÕES */}
      {/* ========================================================================= */}
      {activeScreen === 'notifications' && (
        <div className="max-w-xl mx-auto bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-black text-xl">Notificações</h3>
            <Button size="sm" variant="ghost" className="text-xs">Marcar todas como lidas</Button>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Hoje</span>
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-start gap-3 text-xs">
              <Ticket size={20} className="text-primary shrink-0 mt-0.5" />
              <div><strong>Compra Aprovada!</strong> Seu ingresso para Duna: Parte II no Cinemark Bourbon foi confirmado.</div>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-start gap-3 text-xs">
              <User size={20} className="text-secondary shrink-0 mt-0.5" />
              <div><strong>Ana Melo</strong> começou a te seguir.</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. ADMIN BÁSICO DE SESSÕES */}
      {/* ========================================================================= */}
      {activeScreen === 'admin' && (
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <Badge variant="default">GERENTE DE CINEMA</Badge>
              <h3 className="font-black text-2xl mt-1">Painel Administrativo</h3>
            </div>
            <Button size="sm" onClick={() => setShowAddSessionModal(true)}>+ Nova Sessão</Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm">Sessões Ativas no Cinemark Bourbon:</h4>
            {[
              { movie: 'Duna: Parte II', time: '13:30', room: 'Sala 4 IMAX', price: 'R$ 52,00', occ: '8/200' },
              { movie: 'Duna: Parte II', time: '19:00', room: 'Sala 2 4DX', price: 'R$ 68,00', occ: '64/80' },
              { movie: 'Deadpool & Wolverine', time: '17:30', room: 'Sala 1 Standard', price: 'R$ 34,00', occ: '118/120' },
            ].map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-muted/20 border border-border rounded-xl text-xs">
                <div>
                  <h5 className="font-bold">{s.movie}</h5>
                  <p className="text-muted-foreground">{s.time} • {s.room} • {s.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.occ}</Badge>
                  <Button size="sm" variant="ghost">Editar</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 17. AUTH LOGIN */}
      {/* ========================================================================= */}
      {activeScreen === 'auth_login' && (
        <div className="max-w-md mx-auto bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-black text-2xl text-center">Entrar no screeK</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">E-mail ou Usuário:</label>
              <input type="text" defaultValue="lothrik@gmail.com" className="w-full bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary" />
            </div>
            <div>
              <label className="font-bold block mb-1">Senha:</label>
              <input type="password" defaultValue="••••••••" className="w-full bg-background border border-border p-2.5 rounded-lg outline-none focus:border-primary" />
            </div>
            <Button className="w-full font-bold" onClick={() => setActiveScreen('home')}>Entrar</Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 18. AUTH REGISTER */}
      {/* ========================================================================= */}
      {activeScreen === 'auth_register' && (
        <div className="max-w-md mx-auto bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-black text-2xl text-center">Criar Conta</h3>
          <div className="space-y-3 text-xs">
            <div><label className="font-bold block mb-1">Nome:</label><input type="text" placeholder="Seu nome" className="w-full bg-background border border-border p-2.5 rounded-lg" /></div>
            <div><label className="font-bold block mb-1">E-mail:</label><input type="email" placeholder="seu@email.com" className="w-full bg-background border border-border p-2.5 rounded-lg" /></div>
            <div><label className="font-bold block mb-1">Senha:</label><input type="password" placeholder="Senha segura" className="w-full bg-background border border-border p-2.5 rounded-lg" /></div>
            <Button className="w-full font-bold" onClick={() => setActiveScreen('home')}>Cadastrar</Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 19. AUTH FORGOT */}
      {/* ========================================================================= */}
      {activeScreen === 'auth_forgot' && (
        <div className="max-w-md mx-auto bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-black text-2xl text-center">Recuperar Senha</h3>
          <p className="text-xs text-muted-foreground text-center">Digite seu email cadastrado para enviarmos as instruções de redefinição.</p>
          <div className="space-y-3 text-xs">
            <div><label className="font-bold block mb-1">E-mail:</label><input type="email" placeholder="seu@email.com" className="w-full bg-background border border-border p-2.5 rounded-lg" /></div>
            <Button className="w-full font-bold" onClick={() => setActiveScreen('auth_login')}>Enviar Link de Recuperação</Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">Avaliar Duna: Parte II</h3>
              <button onClick={() => setShowReviewModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4 text-center">
              <StarRating value={modalRating} size={28} onChange={(r) => setModalRating(r)} />
              <textarea rows={4} placeholder="O que achou do filme?..." className="w-full bg-background border border-border p-3 rounded-lg text-xs outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowReviewModal(false)}>Cancelar</Button>
              <Button className="flex-1 font-bold" onClick={() => setShowReviewModal(false)}>Publicar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Ticket Modal */}
      {showCancelTicketModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-destructive max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl text-center">
            <Warning size={48} className="mx-auto text-destructive" weight="fill" />
            <h3 className="font-black text-xl">Cancelar Ingresso?</h3>
            <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita. O estorno de R$ 109,00 será processado em até 5 dias.</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelTicketModal(false)}>Manter Ingresso</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={() => setShowCancelTicketModal(false)}>Sim, Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">Adicionar Comentário</h3>
              <button onClick={() => setShowCommentModal(false)}><X size={20} /></button>
            </div>
            <input type="text" placeholder="Escreva seu comentário..." className="w-full bg-background border border-border p-3 rounded-lg text-xs outline-none focus:border-primary" />
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowCommentModal(false)}>Cancelar</Button>
              <Button className="flex-1 font-bold" onClick={() => setShowCommentModal(false)}>Enviar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">Configurações de Conta</h3>
              <button onClick={() => setShowSettingsModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="font-bold block mb-1">Nome:</label><input type="text" defaultValue="Lothrik Arévalo" className="w-full bg-background border border-border p-2 rounded-lg" /></div>
              <div><label className="font-bold block mb-1">Cidade Padrão:</label><input type="text" defaultValue="São Paulo, SP" className="w-full bg-background border border-border p-2 rounded-lg" /></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettingsModal(false)}>Fechar</Button>
              <Button className="flex-1 font-bold" onClick={() => setShowSettingsModal(false)}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-lg">Nova Sessão</h3>
              <button onClick={() => setShowAddSessionModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="font-bold block mb-1">Filme:</label><input type="text" defaultValue="Duna: Parte II" className="w-full bg-background border border-border p-2 rounded-lg" /></div>
              <div><label className="font-bold block mb-1">Sala & Horário:</label><input type="text" defaultValue="Sala 4 IMAX · 21:45" className="w-full bg-background border border-border p-2 rounded-lg" /></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddSessionModal(false)}>Cancelar</Button>
              <Button className="flex-1 font-bold" onClick={() => setShowAddSessionModal(false)}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
