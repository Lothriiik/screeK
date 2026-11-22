import { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  Badge,
  Progress,
  Checkbox
} from '../components/ui';

import { Calendar } from '../components/ui/calendar';
import { 
  Breadcrumb, 

  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '../components/ui/breadcrumb';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationEllipsis 
} from '../components/ui/pagination';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Carousel } from '../components/ui/carousel';
import { Tooltip } from '../components/ui/tooltip';


import { 
  MovieCard, 
  CinemaTicket, 
  SessionCard, 
  SessionChip,
  UserCard, 
  UserRow,
  FeedCard, 

  CommentRow,
  ReviewRow,
  OrderSummary,
  StatusModal,
  KPICard,
  CircularProgress,
  Tag,
  HeroCarousel,
  LineChartPlaceholder,

  DonutsChartPlaceholder,
  BarChartPlaceholder,
  ScatterplotPlaceholder,
  HeatmapPlaceholder
} from '../components/custom';


import { 
  Heart, 
  MagnifyingGlass, 
  Popcorn, 
  Info
} from '@phosphor-icons/react';

export const ComponentsShowcaseScreen = () => {
  const [selectedCity, setSelectedCity] = useState('Arapiraca');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [toggleChecked, setToggleChecked] = useState(true);
  const [radioSelected, setRadioSelected] = useState('pix');
  const [activeTab, setActiveTab] = useState<'cartaz' | 'breve' | 'catalogo'>('cartaz');

  // Modal State for Testing Modals
  const [activeModal, setActiveModal] = useState<'success' | 'error' | 'confirm' | 'expired' | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-12 font-display">
      
      {/* Dynamic Status Modals matching Figma Screenshots */}
      <StatusModal
        isOpen={activeModal === 'success'}
        type="success"
        headerTitle="SUCESSO!"
        title="Sua ação foi realizada com sucesso!"
        description="Esta ação foi realizada com sucesso!"
        primaryActionLabel="CERTO"
        onClose={() => setActiveModal(null)}
      />

      <StatusModal
        isOpen={activeModal === 'error'}
        type="error"
        headerTitle="ERROR"
        title="Algo deu errado"
        description="Não foi possível concluir sua solicitação. Por Favor tente novamente."
        errorCode="500"
        errorTechnicalDetails="Internal Server Error"
        primaryActionLabel="REPETIR"
        secondaryActionLabel="CANCELAR"
        onClose={() => setActiveModal(null)}
      />

      <StatusModal
        isOpen={activeModal === 'confirm'}
        type="confirm"
        headerTitle="CONFIRMAR AÇÃO"
        title="Tem certeza que quer deletar este item?"
        description="Esta ação não pode ser revertida. O item será permanentemente apagado de sua coleção"
        primaryActionLabel="SIM, DELETAR"
        secondaryActionLabel="CANCELAR"
        onClose={() => setActiveModal(null)}
      />

      <StatusModal
        isOpen={activeModal === 'expired'}
        type="expired"
        headerTitle="RESERVA EXPIRADA"
        description="Sua reserva de 10 minutos expirou e os assentos foram liberados para outros usuários."
        reservationDetails={{
          movieTitle: 'Duna:Parte II',
          cinemaName: 'Cinesystem Arapiraca',
          sessionTime: 'Sex 27/03 - 19:00',
          seats: ['D7', 'D8'],
        }}
        primaryActionLabel="‹ ESCOLHER OUTROS ASSENTOS"
        secondaryActionLabel="VOLTAR ÀS SESSÕES"
        onClose={() => setActiveModal(null)}
      />



      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Title */}
        <div className="border-b-4 border-foreground/40 pb-6">
          <div className="flex items-center gap-3">
            <Popcorn size={36} weight="fill" className="text-primary" />
            <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wide text-foreground">
              screeK — Vitrine Completa do Design System
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-foreground/60 mt-2">
            Catálogo interativo contendo TODOS os componentes listados no Figma para verificação e ajuste em tempo real.
          </p>
        </div>

        {/* ==========================================
            PAINEL 1: UI STYLE GUIDELINES (LIGHT MODE 7)
           ========================================== */}
        {/* 1. SEÇÃO DE BOTÕES & SELETS & INPUTS (COM SUCESSO, WARNING, ERRO) */}
        <section className="space-y-6 bg-foreground/5 p-6 border-4 border-foreground/30">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-primary border-b-4 border-primary pb-2">
            🔘 1. Botões, Selects & Inputs (Normal, Sucesso, Warning, Erro)
          </h2>

          {/* Botões Showcase */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-3">
            <label className="block text-xs font-black uppercase text-foreground/50">Variantes de Botão (`Button`)</label>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">Default Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link Button</Button>
              <Button variant="default" disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="sm" variant="default">Small (36px)</Button>
              <Button size="default" variant="default">Default (44px)</Button>
              <Button size="lg" variant="default">Large (56px)</Button>
              <Button size="icon" variant="outline"><Heart size={20} weight="fill" className="text-destructive" /></Button>
              <Button size="icon" variant="secondary"><MagnifyingGlass size={20} weight="bold" /></Button>
            </div>
          </div>

          {/* Inputs (Success, Warning, Error, Disabled) */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-4">
            <label className="block text-xs font-black uppercase text-foreground/50">Campos de Entrada (`Input`) — Todos os Estados</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground/60 mb-1">Input Padrão</label>
                <Input placeholder="Digite seu nome completo..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/60 mb-1">Input com Ícone</label>
                <Input icon={<MagnifyingGlass size={20} className="text-foreground/40" />} placeholder="Buscar filmes, atores..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-success dark:text-success mb-1">Input Estado Sucesso</label>
                <Input state="success" defaultValue="usuario_validado@gmail.com" errorMessage="E-mail disponível para cadastro!" />
              </div>

              <div>
                <label className="block text-sm font-bold text-warning dark:text-warning mb-1">Input Estado Warning</label>
                <Input state="warning" defaultValue="Senha123" errorMessage="Senha fraca: adicione caracteres especiais." />
              </div>

              <div>
                <label className="block text-sm font-bold text-destructive mb-1">Input Estado Erro</label>
                <Input state="error" defaultValue="email_invalido" errorMessage="Digite um e-mail válido!" />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/40 mb-1">Input Estado Desabilitado</label>
                <Input disabled defaultValue="campo_desabilitado@screek.com" />
              </div>
            </div>
          </div>

          {/* Select Showcase */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-3">
            <label className="block text-xs font-black uppercase text-foreground/50">Dropdown / Seletor (`Select`)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1 uppercase">Select Ativo (Cidade)</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{selectedCity}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arapiraca">Arapiraca</SelectItem>
                    <SelectItem value="Maceió">Maceió</SelectItem>
                    <SelectItem value="Recife">Recife</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/40 mb-1 uppercase">Select Desabilitado</label>
                <Select disabled value="Arapiraca">
                  <SelectTrigger className="w-full opacity-50 cursor-not-allowed">
                    <SelectValue>Arapiraca (Desabilitado)</SelectValue>
                  </SelectTrigger>
                </Select>
              </div>
            </div>
          </div>

          {/* Carrossel de Destaques (Figma Banner) */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-3">
            <label className="block text-xs font-black uppercase text-foreground/50">Carrossel de Destaques (`HeroCarousel` - Banner de Filmes)</label>
            <HeroCarousel
              slides={[
                {
                  id: 's1',
                  title: 'Speed Racer',
                  badge: 'ESTREIA',
                  backdropUrl: 'https://images.alphacoders.com/605/605592.jpg',
                  category: 'Cinema - 2h56 - Ação Aventura -',
                  ageRating: 'L',
                  directors: ['Lana Wachowski', 'Lilly Wachowski'],
                  synopsis: 'Speed Racer é um piloto jovem e brilhante. Quando a corrupção nas ligas de corrida ameaça a integridade do esporte...',
                },
                {
                  id: 's2',
                  title: 'Dune: Part Two',
                  badge: 'EM CARTAZ',
                  backdropUrl: 'https://images.alphacoders.com/134/1349581.jpeg',
                  category: 'Cinema - 2h46 - Ficção Científica -',
                  ageRating: '14',
                  directors: ['Denis Villeneuve'],
                  synopsis: 'Paul Atreides se une a Chani e aos Fremen em sua busca por vingança contra os conspiradores que destruíram sua família...',
                },
                {
                  id: 's3',
                  title: 'Deadpool & Wolverine',
                  badge: 'PRÉ-VENDA',
                  backdropUrl: 'https://images.alphacoders.com/135/1355088.jpeg',
                  category: 'Cinema - 2h07 - Ação Comédia -',
                  ageRating: '18',
                  directors: ['Shawn Levy'],
                  synopsis: 'Wolverine se recupera de seus ferimentos quando cruza o caminho com o desbocado Deadpool...',
                },
              ]}
            />
          </div>

          {/* Checkbox & Radio Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-2 border-foreground/20 bg-background">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-foreground/50">Checkbox & Toggle</label>
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-showcase" 
                  checked={checkboxChecked} 
                  onCheckedChange={(c) => setCheckboxChecked(!!c)} 
                />
                <label htmlFor="chk-showcase" className="text-xs font-bold text-foreground cursor-pointer">
                  Contém Spoilers (Checkbox Neobrutalista)
                </label>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setToggleChecked(!toggleChecked)}
                  className={`w-12 h-6 flex items-center p-1 border-4 border-foreground/40 cursor-pointer transition-colors ${
                    toggleChecked ? 'bg-primary' : 'bg-foreground/20'
                  }`}
                >
                  <div className={`w-4 h-4 bg-background border-2 border-foreground transition-transform ${toggleChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs font-bold text-foreground">Notificações por E-mail (Toggle)</span>
              </div>
            </div>

            {/* Radio Button */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-foreground/50">Radio Button (Seletor de Pagamento)</label>
              <div className="space-y-2">
                {[
                  { id: 'pix', label: 'PIX (Aprovação Instantânea)' },
                  { id: 'card', label: 'Cartão de Crédito (Até 3x)' },
                ].map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => setRadioSelected(opt.id)}
                    className={`flex items-center gap-3 p-2.5 border-2 cursor-pointer transition-all ${
                      radioSelected === opt.id ? 'border-primary bg-primary/10 text-primary font-black' : 'border-foreground/30 text-foreground/70 font-bold'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-4 flex items-center justify-center ${radioSelected === opt.id ? 'border-primary bg-primary' : 'border-foreground/40'}`}>
                      {radioSelected === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                    </div>
                    <span className="text-xs uppercase">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Breadcrumbs & Tabs */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Breadcrumbs (Shadcn UI Native)</label>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/movies">Filmes</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dune: Part Two</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>


            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Tabs (Navegação Ativa)</label>
              <div className="flex border-b-4 border-foreground/30">
                {[
                  { id: 'cartaz', label: 'EM CARTAZ' },
                  { id: 'breve', label: 'EM BREVE' },
                  { id: 'catalogo', label: 'CATÁLOGO COMPLETO' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-extrabold uppercase border-b-4 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-transparent text-foreground/50 hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination & DatePicker & Tooltips & Circular Progress & Step Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-2 border-foreground/20 bg-background">
            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Pagination (Shadcn UI Native)</label>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>


            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Circular Progress & Step Progress</label>
              <div className="flex items-center gap-6">
                <CircularProgress value={78} size={64} />
                
                {/* Step Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-primary bg-primary text-background font-black text-xs">1</div>
                  <div className="w-8 h-1 bg-primary" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-primary bg-primary text-background font-black text-xs">2</div>
                  <div className="w-8 h-1 bg-foreground/20" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-foreground/30 bg-background text-foreground/40 font-black text-xs">3</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Calendar / DatePicker (Shadcn UI Native)</label>
              <Calendar mode="single" className="border-4 border-foreground/40 rounded-none bg-background shadow-[4px_4px_0px_0px_var(--border)]" />
            </div>


            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Tags & Badges & Tooltips</label>
              <div className="flex flex-wrap items-center gap-2">
                <Tag>SCI-FI</Tag>
                <Tag>AVENTURA</Tag>
                <Badge variant="default">EM CARTAZ</Badge>
                <Badge variant="secondary">VIP</Badge>
                <Badge variant="destructive">ESGOTADO</Badge>
              </div>

              {/* Interactive Tooltip Sample */}
              <div className="mt-3">
                <Tooltip content="Tooltip Neobrutalista Funcional! 🚀" position="top">
                  <button className="flex items-center gap-2 p-2 border-2 border-foreground/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary cursor-pointer transition-all">
                    <Info size={16} className="text-primary" />
                    <span>Passe o mouse aqui para ver a Tooltip em ação!</span>
                  </button>
                </Tooltip>
              </div>

            </div>
          </div>

          {/* Progress Bar & Accordion & Table */}
          <div className="p-4 border-2 border-foreground/20 bg-background space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Progress Bar (Barra de Progresso)</label>
              <Progress value={65} className="w-full" />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Accordion (Perguntas Frequentes)</label>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Como funciona o cancelamento de ingressos?</AccordionTrigger>
                  <AccordionContent>
                    Você pode cancelar seu ingresso até 2 horas antes do início da sessão. O reembolso é feito instantaneamente na mesma forma de pagamento.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>O que são salas VIP?</AccordionTrigger>
                  <AccordionContent>
                    Salas VIP possuem poltronas reclináveis em couro, atendimento na mesa e cardápio exclusivo de pratos gourmets.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-foreground/50 mb-2">Table (Tabela de Dados)</label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cinema</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-extrabold text-foreground">Cinesystem Arapiraca</TableCell>
                    <TableCell>Sala 03 VIP</TableCell>
                    <TableCell>20:30 (3D)</TableCell>
                    <TableCell className="text-right text-primary font-black">R$ 40,00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-extrabold text-foreground">Centerplex Maceió</TableCell>
                    <TableCell>Sala 01</TableCell>
                    <TableCell>17:45 (2D)</TableCell>
                    <TableCell className="text-right text-primary font-black">R$ 28,00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="p-4 border-2 border-foreground/20 bg-background space-y-3">
            <label className="block text-xs font-black uppercase text-foreground/50">Testar Modais Interativos</label>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" size="sm" onClick={() => setActiveModal('success')}>
                🟢 Testar Modal de Sucesso
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setActiveModal('error')}>
                🔴 Testar Modal de Erro
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setActiveModal('confirm')}>
                🟡 Testar Modal de Confirmação Destrutiva
              </Button>
              <Button variant="tertiary" size="sm" onClick={() => setActiveModal('expired')}>
                ⏰ Testar Modal de Reserva Expirada
              </Button>
            </div>
          </div>
        </section>


        {/* ==========================================
            PAINEL 2: FEED E SOCIAL (5) - INGRESSOS E PEDIDOS
           ========================================== */}
        <section className="space-y-6 bg-foreground/5 p-6 border-4 border-foreground/30">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-secondary border-b-4 border-secondary pb-2">
            🎟️ 2. Feed e Social (5) — Ingressos, Resumo de Pedido & Timer
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Ticket Standard (Navy) */}
            <div>
              <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Ingresso Padrão (Azul Marinho)</span>
              <CinemaTicket
                cinemaName="CINESYSTEM ARAPIRACA"
                movieTitle="Duna: Parte II"
                roomName="Sala 4 - IMAX"
                seats={['D7', 'D8']}
                date="SEX 27/03"
                time="19:00"
                ticketType="standard"
                price={109.0}
                ticketCategory="2x Inteira - 2x Meia"
                audioFormat="DUB"
                screenFormat="IMAX"
                code="#SKR-20260327-4891"
              />
            </div>

            {/* Ticket VIP (Vinho) */}
            <div>
              <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Ingresso VIP (Vinho)</span>
              <CinemaTicket
                cinemaName="CINESYSTEM ARAPIRACA"
                movieTitle="Duna: Parte II"
                roomName="Sala 4 - IMAX"
                seats={['D7', 'D8']}
                date="SEX 27/03"
                time="19:00"
                ticketType="vip"
                price={109.0}
                ticketCategory="2x Inteira - 2x Meia"
                audioFormat="DUB"
                screenFormat="IMAX"
                code="#SKR-20260327-4891"
              />
            </div>

            {/* Ticket Utilizado (Cinza) */}
            <div>
              <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Ingresso Utilizado (Cinza)</span>
              <CinemaTicket
                cinemaName="CINESYSTEM ARAPIRACA"
                movieTitle="Duna: Parte II"
                roomName="Sala 4 - IMAX"
                seats={['D7', 'D8']}
                date="SEX 27/03"
                time="19:00"
                ticketType="used"
                price={109.0}
                ticketCategory="2x Inteira - 2x Meia"
                audioFormat="DUB"
                screenFormat="IMAX"
                code="#SKR-20260327-4891"
              />
            </div>

            {/* Ticket Cancelado (Salmão) */}
            <div>
              <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Ingresso Cancelado (Salmão)</span>
              <CinemaTicket
                cinemaName="CINESYSTEM ARAPIRACA"
                movieTitle="Duna: Parte II"
                roomName="Sala 4 - IMAX"
                seats={['D7', 'D8']}
                date="SEX 27/03"
                time="19:00"
                ticketType="cancelled"
                price={109.0}
                ticketCategory="2x Inteira - 2x Meia"
                audioFormat="DUB"
                screenFormat="IMAX"
                code="#SKR-20260327-4891"
              />
            </div>
          </div>


          {/* Resumo do Pedido (Padrão & Com Timer) */}
          <div className="pt-4">
            <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-3">Resumo do Pedido (`OrderSummary` Padrão & Com Timer)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* OrderSummary Standard */}
              <div>
                <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Padrão Sem Timer</span>
                <OrderSummary
                  movieTitle="Angel Dust"
                  moviePoster="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  cinemaName="Cinesystem Arapiraca"
                  cinemaLocation="Arapiraca / AL"
                  sessionRoomTime="Sala 5 · Sex 27/03 · 19:00"
                  seats={['D7', 'D8']}
                  items={[
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                  ]}
                  subtotal={104.0}
                  serviceFee={5.0}
                  totalPrice={109.0}
                  ratingBadge="L"
                  formatBadges={['IMAX', 'LEGENDADO']}
                  showTimer={false}
                />
              </div>

              {/* OrderSummary With Timer Banner */}
              <div>
                <span className="block text-xs font-extrabold uppercase text-foreground/50 mb-2">Com Banner de Tempo (Timer)</span>
                <OrderSummary
                  movieTitle="Angel Dust"
                  moviePoster="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  cinemaName="Cinesystem Arapiraca"
                  cinemaLocation="Arapiraca / AL"
                  sessionRoomTime="Sala 5 · Sex 27/03 · 19:00"
                  seats={['D7', 'D8']}
                  items={[
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                    { label: '1x Inteira', price: 30.0 },
                  ]}
                  subtotal={104.0}
                  serviceFee={5.0}
                  totalPrice={109.0}
                  ratingBadge="L"
                  formatBadges={['IMAX', 'LEGENDADO']}
                  showTimer={true}
                  timerSeconds={452}
                />
              </div>
            </div>
          </div>

        </section>


        {/* ==========================================
            PAINEL 3: FEED E SOCIAL (3) - FILMES E SESSÕES
           ========================================== */}
        <section className="space-y-6 bg-foreground/5 p-6 border-4 border-foreground/30">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-tertiary border-b-4 border-tertiary pb-2">
            🍿 3. Feed e Social (3) — Cards de Filme (Estreia, Pré-Venda, Reexibição, Classificação)
          </h2>

          {/* Cards Padronizados com Classificação Etária & Nota (Figma Imagem 1) */}
          <div className="space-y-2">
            <span className="block text-xs font-extrabold uppercase text-foreground/50">1. Cards em Cartaz com Classificação Etária & Nota</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <MovieCard
                id="m1"
                title="Angel Dust"
                posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                rating={4.5}
                ageRating="L"
                genre="CRIME"
                duration="1h57"
              />
              <MovieCard
                id="m2"
                title="Chainsaw Man – The Movie: Reze Arc"
                posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"
                rating={4.5}
                ageRating="18"
                genre="ANIMATION"
                duration="1h39"
              />
              <MovieCard
                id="m3"
                title="Comrades, Almost a Love Story"
                posterUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                rating={4.5}
                ageRating="16"
                genre="ROMANCE"
                duration="1h57"
              />
              <MovieCard
                id="m4"
                title="Female Prisoner #701: Scorpion"
                posterUrl="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
                rating={4.5}
                ageRating="14"
                genre="CRIME"
                duration="1h27"
              />
              <MovieCard
                id="m5"
                title="Alpha"
                posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                rating={4.5}
                ageRating="12"
                genre="DRAMA"
                duration="2h08"
              />
            </div>
          </div>

          {/* Session Chips (Quadrados) & Session Cards (Horizontais) (Figma Imagem) */}
          <div className="space-y-6 pt-4 border-t-2 border-foreground/20">
            <span className="block text-xs font-extrabold uppercase text-foreground/50">Session Chips (`SessionChip` - 3 Estados: Disponível, Selecionado & Indisponível)</span>
            <div className="flex flex-wrap items-center gap-4">
              <SessionChip time="19:00" roomName="Sala 4" audioFormat="LEG" screenFormat="IMAX" state="available" />
              <SessionChip time="19:00" roomName="Sala 4" audioFormat="LEG" screenFormat="IMAX" state="selected" />
              <SessionChip time="19:00" roomName="Sala 4" audioFormat="LEG" screenFormat="IMAX" state="disabled" />
            </div>

            <span className="block text-xs font-extrabold uppercase text-foreground/50 pt-4">Session Cards (`SessionCard` Horizontais - 2 Estados de Borda)</span>
            <div className="space-y-4 max-w-2xl">
              <SessionCard
                time="19:00"
                cinemaName="Cinesystem Arapiraca"
                roomName="Sala 4 - IMAX"
                freeSeatsPercentage={82}
                audioFormat="DUB"
                screenFormat="IMAX"
                dateLabel="SEX 27/03"
                highlightBorder={false}
              />
              <SessionCard
                time="19:00"
                cinemaName="Cinesystem Arapiraca"
                roomName="Sala 4 - IMAX"
                freeSeatsPercentage={82}
                audioFormat="DUB"
                screenFormat="IMAX"
                dateLabel="SEX 27/03"
                highlightBorder={true}
              />
            </div>
          </div>

          {/* Cards de Evento: Estreia, Pré-Venda & Reexibição (Figma Imagem 2) */}
          <div className="space-y-2 pt-4 border-t-2 border-foreground/20">
            <span className="block text-xs font-extrabold uppercase text-foreground/50">2. Diferenciação: Estreia c/ Data, Pré-Venda & Reexibição</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <MovieCard
                id="e1"
                title="Phantom of the Paradise"
                posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                genre="DRAMA"
                duration="1h32"
                tagType="release"
                eventLabel="ESTREIA 08/04"
              />
              <MovieCard
                id="e2"
                title="The Stendhal Syndrome"
                posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"
                genre="THRILLER"
                duration="1h59"
                tagType="pre_sale"
                eventLabel="ESTREIA 08/04"
              />
              <MovieCard
                id="e3"
                title="The Heroic Trio"
                posterUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                genre="ACTION"
                duration="1h28"
                tagType="re_release"
                eventLabel="REEXIBIÇÃO 08/04"
              />
              <MovieCard
                id="e4"
                title="Shin Godzilla"
                posterUrl="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
                genre="ACTION"
                duration="2h00"
                tagType="release"
                eventLabel="ESTREIA 08/04"
              />
              <MovieCard
                id="e5"
                title="His Motorbike, Her Island"
                posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                genre="ROMANCE"
                duration="1h30"
                tagType="pre_sale"
                eventLabel="ESTREIA 08/04"
              />
            </div>
          </div>

          {/* Carrossel de Cartazes */}
          <div className="space-y-2 pt-4 border-t-2 border-foreground/20">
            <span className="block text-xs font-extrabold uppercase text-foreground/50">Carrossel de Cartazes (`Carousel`)</span>
            <Carousel title="Filmes Recomendados Para Você">
              <div className="w-48 shrink-0">
                <MovieCard
                  id="101"
                  title="Dune: Part Two"
                  posterUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  rating={4.8}
                  genre="SCI-FI"
                  duration="2h46"
                />
              </div>
              <div className="w-48 shrink-0">
                <MovieCard
                  id="102"
                  title="Deadpool & Wolverine"
                  posterUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"
                  rating={4.6}
                  genre="ACTION"
                  duration="2h08"
                  tagType="pre_sale"
                />
              </div>
              <div className="w-48 shrink-0">
                <MovieCard
                  id="103"
                  title="Spider-Man"
                  posterUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                  rating={4.9}
                  genre="ACTION"
                  duration="2h01"
                />
              </div>
              <div className="w-48 shrink-0">
                <MovieCard
                  id="104"
                  title="O Chefão Parte III"
                  posterUrl="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
                  rating={4.4}
                  genre="CRIME"
                  duration="2h42"
                />
              </div>
            </Carousel>
          </div>

        </section>



        {/* ==========================================
            PAINEL 4: FEED E SOCIAL (2) - REDE SOCIAL
           ========================================== */}
        <section className="space-y-6 bg-foreground/5 p-6 border-4 border-foreground/30">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-secondary border-b-4 border-secondary pb-2">
            👥 4. Feed e Social (2) — Rede Social (User Card, User Row & Feed Cards)
          </h2>

          {/* User Card / User Row (Figma Imagem) */}
          <div className="space-y-4">
            <span className="block text-xs font-extrabold uppercase text-foreground/50">User Card / User Row</span>
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Vertical Cards */}
              <div className="flex items-center gap-4">
                {/* Seguir State */}
                <UserCard
                  name="Lothrik Junior"
                  handle="@lothrik"
                  bio="Cinéfilo. Fã de ficção científica."
                  followersCount={284}
                  moviesCount={284}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isFollowingInitial={false}
                />
                {/* Seguindo State */}
                <UserCard
                  name="Lothrik Junior"
                  handle="@lothrik"
                  bio="Cinéfilo. Fã de ficção científica."
                  followersCount={284}
                  moviesCount={284}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isFollowingInitial={true}
                />
              </div>

              {/* Horizontal Rows */}
              <div className="space-y-4 w-full max-w-[500px]">
                {/* Seguir State */}
                <UserRow
                  name="Lothrik Junior"
                  handle="@lothrik"
                  watchedCount={540}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isFollowingInitial={false}
                />
                {/* Seguindo State */}
                <UserRow
                  name="Lothrik Junior"
                  handle="@lothrik"
                  watchedCount={540}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isFollowingInitial={true}
                />
              </div>
            </div>
          </div>

          {/* Comment Row & Review Film Row (Figma Imagens) */}
          <div className="space-y-8 pt-4 border-t-2 border-foreground/20">
            {/* Comment Row */}
            <div className="space-y-3">
              <span className="block text-xs font-extrabold uppercase text-foreground/50">1. Comment Row</span>
              <div className="space-y-4 max-w-3xl">
                <CommentRow
                  name="Lothrik Junior"
                  handle="@lothrik"
                  timeAgo="2h"
                  commentText="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla"
                  likesCount={42}
                  commentsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isLikedInitial={true}
                />
                <CommentRow
                  name="Kleber Junior"
                  handle="@Ronald"
                  timeAgo="21 mar 2026"
                  commentText="Villeneuve é mesmo outro nível. Cada frame parece uma pintura."
                  likesCount={42}
                  commentsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"
                  isLikedInitial={true}
                />
                <CommentRow
                  name="Julia Campos"
                  handle="@juliac"
                  timeAgo="ontem"
                  commentText="Eu esperava mais do Austin Butler, mas o resto do elenco é perfeito."
                  likesCount={42}
                  commentsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                  isLikedInitial={false}
                />
              </div>
            </div>

            {/* Review Film Row */}
            <div className="space-y-3">
              <span className="block text-xs font-extrabold uppercase text-foreground/50">2. Review Film Row (Standard & Spoiler)</span>
              <div className="space-y-4 max-w-3xl">
                {/* Standard Review */}
                <ReviewRow
                  name="Lothrik Junior"
                  handle="@lothrik"
                  dateLabel="21 mar 2026"
                  rating={4}
                  reviewText="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla"
                  likesCount={42}
                  commentsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isLikedInitial={true}
                  hasSpoiler={false}
                />

                {/* Spoiler Review */}
                <ReviewRow
                  name="Lothrik Junior"
                  handle="@lothrik"
                  dateLabel="21 mar 2026"
                  rating={4}
                  reviewText="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla"
                  likesCount={42}
                  commentsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isLikedInitial={false}
                  hasSpoiler={true}
                />
              </div>
            </div>
          </div>

          {/* Feed Cards - Review with Comment & Feed Cards - Post (Figma Imagens) */}
          <div className="space-y-8 pt-4 border-t-2 border-foreground/20">
            {/* Feed Cards - Review with Comment */}
            <div className="space-y-3">
              <span className="block text-xs font-extrabold uppercase text-foreground/50">1. Feed Cards - Review with Comment</span>
              <div className="max-w-3xl">
                <FeedCard
                  type="review"
                  name="Lothrik Junior"
                  actionText="avaliou Duna: Parte II"
                  timeAgo="há 2 horas"
                  rating={5}
                  embeddedMovie={{
                    title: 'Angel Dust',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    director: 'Gakuryu Ishii',
                    detailsLine: 'Drama · 2024 · 1h45',
                  }}
                  content="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla"
                  likesCount={42}
                  commentsCount={42}
                  repostsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isLikedInitial={true}
                />
              </div>
            </div>

            {/* Feed Cards - Review Repost Only & Repost with Comment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t-2 border-foreground/20">
              {/* Feed Cards - Review Repost Only */}
              <div className="space-y-3">
                <span className="block text-xs font-extrabold uppercase text-foreground/50">3. Feed Cards - Review Repost Only</span>
                <FeedCard
                  type="repost_only"
                  name="Julia Campos"
                  repostHeaderText="repostou uma review"
                  avatarUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                  actionText="avaliou Duna: Parte II"
                  timeAgo="há 2 horas"
                  rating={5}
                  embeddedMovie={{
                    title: 'Angel Dust',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    director: 'Gakuryu Ishii',
                    detailsLine: 'Drama · 2024 · 1h45',
                  }}
                  content="Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma o impossível em realidade, a escala visual, a trilha e as atuações são magistrais. do bla"
                  likesCount={42}
                  commentsCount={42}
                  repostsCount={42}
                  isLikedInitial={true}
                />
              </div>

              {/* Feed Cards - Review Repost with Comment */}
              <div className="space-y-3">
                <span className="block text-xs font-extrabold uppercase text-foreground/50">4. Feed Cards - Review Repost with comment</span>
                <FeedCard
                  type="repost_with_comment"
                  name="Julia Campos"
                  handle="@juliac"
                  avatarUrl="https://image.tmdb.org/t/p/w500/8Vt6mF92DMcBfs42BDaKiA2LDCe.jpg"
                  timeAgo="há 2 horas"
                  content="Essa review resumiu tudo que senti 🙌"
                  quotedReview={{
                    name: 'Lothrik Junior',
                    actionText: 'avaliou Duna: Parte II',
                    timeAgo: 'há 2 horas',
                    rating: 4,
                    avatarUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    content: 'Uma obra épica que supera o original em todos os aspectos. Villeneuve transforma...',
                  }}
                  likesCount={42}
                  commentsCount={42}
                  repostsCount={42}
                  isLikedInitial={true}
                />
              </div>
            </div>

            {/* Feed Cards - Rated & Watched (Top Row Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t-2 border-foreground/20">

              {/* Feed Cards - Rated */}
              <div className="space-y-3">
                <span className="block text-xs font-extrabold uppercase text-foreground/50">5. Feed Cards - Rated</span>
                <FeedCard
                  type="rated"
                  name="Lothrik Junior"
                  actionText="avaliou Duna: Parte II"
                  timeAgo="há 2 horas"
                  rating={4}
                  embeddedMovie={{
                    title: 'Angel Dust',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    director: 'Gakuryu Ishii',
                    detailsLine: 'Drama · 2024 · 1h45',
                  }}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                />
              </div>

              {/* Feed Cards - Watched */}
              <div className="space-y-3">
                <span className="block text-xs font-extrabold uppercase text-foreground/50">6. Feed Cards - Watched</span>
                <FeedCard
                  type="watched"
                  name="Lothrik Junior"
                  actionText="assistiu Duna: Parte II"
                  timeAgo="há 2 horas"
                  embeddedMovie={{
                    title: 'Angel Dust',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    director: 'Gakuryu Ishii',
                    detailsLine: 'Drama · 2024 · 1h45',
                  }}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                />
              </div>
            </div>

            {/* Feed Cards - Repost Session (Bottom Full Width) */}
            <div className="pt-4 border-t-2 border-foreground/20 space-y-3">
              <span className="block text-xs font-extrabold uppercase text-foreground/50">7. Feed Cards - Repost Session</span>
              <div className="max-w-3xl">
                <FeedCard
                  type="session"
                  name="Lothrik Junior"
                  actionText="compartilhou uma sessão"
                  timeAgo="há 2 horas"
                  sharedSession={{
                    title: 'Angel Dust',
                    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg',
                    ageRating: 'L',
                    detailsLine: 'Drama · 2024 · 1h45',
                    cinemaAndRoom: 'Cinesystem Arapiraca - Sala 4',
                    dateLabel: 'SEX 27/03',
                    time: '19:00',
                    audioFormat: 'DUB',
                    screenFormat: 'IMAX',
                  }}
                  content="Quem vem comigo? Últimos ingressos! 🎬"
                  likesCount={42}
                  commentsCount={42}
                  repostsCount={42}
                  avatarUrl="https://image.tmdb.org/t/p/w500/1pdfLPoLMag8St8vRyTFiTJvMGE.jpg"
                  isLikedInitial={true}
                />
              </div>
            </div>
          </div>
        </section>





        <section className="space-y-6 bg-foreground/5 p-6 border-4 border-foreground/30">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase text-secondary border-b-4 border-secondary pb-2">
            📊 5. Feed e Social (6) — KPIs, Gráficos & Tabelas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard title="Total de Ingressos Vendidos" value="1.420" change="+12.5%" isPositive={true} />
            <KPICard title="Reviews Criadas este Mês" value="384" change="+5.2%" isPositive={true} />
            <KPICard title="Taxa de Cancelamento" value="1.8%" change="-0.4%" isPositive={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <LineChartPlaceholder />
            <DonutsChartPlaceholder />
            <BarChartPlaceholder />
            <ScatterplotPlaceholder />
          </div>

          <div className="pt-2">
            <HeatmapPlaceholder />
          </div>
        </section>

      </div>
    </div>
  );
};
