import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Home } from './pages/Home';
import { MovieDetail } from './pages/MovieDetail';
import { MovieSessions } from './pages/MovieSessions';
import { SeatSelection } from './pages/SeatSelection';
import { Cinemas } from './pages/Cinemas';
import { CinemaDetail } from './pages/CinemaDetail';
import { MoviesCatalog } from './pages/MoviesCatalog';
import { Tickets } from './pages/Tickets';
import { Search } from './pages/Search';
import { PersonDetail } from './pages/PersonDetail';
import { Feed } from './pages/Feed';
import { FeedDetail } from './pages/FeedDetail';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { Lists } from './pages/Lists';
import { ListDetail } from './pages/ListDetail';
import { NewList } from './pages/NewList';
import { Settings } from './pages/Settings';
import { ProfileStats } from './pages/ProfileStats';
import { Collections } from './pages/Collections';
import { CollectionDetail } from './pages/CollectionDetail';
import { Onboarding } from './pages/Onboarding';
import { Intelligence } from './pages/Intelligence';
import { LetterboxdImport } from './pages/LetterboxdImport';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { Forbidden } from './pages/Forbidden';
import { ManagementCinemas } from './pages/ManagementCinemas';
import { ManagementCinemaForm } from './pages/ManagementCinemaForm';
import { ManagementSchedule } from './pages/ManagementSchedule';
import { ManagementStatistics } from './pages/ManagementStatistics';
import { ManagementOperations } from './pages/ManagementOperations';
import { ManagementAccessRequest } from './pages/ManagementAccessRequest';
import { ManagementInvitation } from './pages/ManagementInvitation';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { TicketLookup } from './pages/TicketLookup';
import { TicketValidation } from './pages/TicketValidation';
import { EmailVerification, SessionExpired } from './pages/AccountStatus';
import { StateGallery } from './pages/StateGallery';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthModal } from './components/AuthModal';
import { RoleGuard } from './components/RoleGuard';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

import { CheckCircle, XCircle, WarningCircle, Info } from '@phosphor-icons/react';

import { ComponentsShowcaseScreen } from './screens/ComponentsShowcaseScreen';
import { ScreenPrototypes } from './screens/ScreenPrototypes';

const ROUTE_TITLES: Record<string, string> = {
  '/login': 'Entrar na sua conta | screeK',
  '/': 'Ingressos & Comunidade Cinéfila | screeK',
  '/movies': 'Catálogo de Filmes & Sessões | screeK',
  '/cinemas': 'Cinemas & Salas | screeK',
  '/tickets': 'Meus Ingressos & Boarding Pass | screeK',
  '/seats': 'Seleção de Poltronas | screeK',
  '/checkout/seats': 'Seleção de Poltronas & Checkout | screeK',
  '/search': 'Buscar Filmes, Cinemas e Cinéfilos | screeK',
  '/feed': 'Feed Social Cinéfilo | screeK',
  '/profile': 'Meu Perfil Cinéfilo | screeK',
  '/profile/stats': 'Minhas Estatísticas | screeK',
  '/settings': 'Configurações da Conta | screeK',
  '/profile/settings': 'Configurações da Conta | screeK',
  '/notifications': 'Notificações | screeK',
  '/lists': 'Listas Cinéfilas | screeK',
  '/lists/new': 'Criar Nova Lista | screeK',
  '/collections': 'Coleções Temáticas | screeK',
  '/onboarding': 'Boas-vindas & Personalização | screeK',
  '/intelligence': 'Recomendações Personalizadas | screeK Intelligence',
  '/recommendations': 'Recomendações Personalizadas | screeK Intelligence',
  '/import': 'Importação do Letterboxd | screeK',
  '/import/letterboxd': 'Importação do Letterboxd | screeK',
  '/management': 'Gestão de Cinemas & Salas | screeK B2B',
  '/management/cinemas': 'Gestão de Cinemas & Salas | screeK B2B',
  '/management/cinemas/new': 'Cadastrar Novo Cinema | screeK B2B',
  '/management/schedule': 'Gestão de Sessões & Programação | screeK B2B',
  '/management/statistics': 'Estatísticas & Ocupação | screeK B2B',
  '/management/operations': 'Operações do Cinema | screeK B2B',
  '/management/check-in': 'Validação de Ingressos | screeK B2B',
  '/management/request-access': 'Solicitar Acesso de Gestor | screeK',
  '/platform': 'Administração da Plataforma | screeK',
  '/tickets/find': 'Encontrar meu ingresso | screeK',
  '/verify-email': 'Confirmar e-mail | screeK',
  '/session-expired': 'Sessão encerrada | screeK',
  '/register': 'Criar Conta | screeK',
  '/statistics': 'Estatísticas & Ocupação | screeK B2B',
  '/management/stats': 'Estatísticas & Ocupação | screeK B2B',
  '/forgot-password': 'Recuperar Senha | screeK',
  '/reset-password': 'Redefinir Senha | screeK',
  '/forbidden': 'Acesso Restrito (403) | screeK',
  '/terms': 'Termos de Uso | screeK',
  '/privacy': 'Política de Privacidade | screeK',
  '/faq': 'Central de Ajuda & FAQ | screeK',
  '/contact': 'Fale Conosco | screeK',
  '/support': 'Fale Conosco | screeK',
  '/components': 'UI Kit Showcase | screeK',
  '/prototypes': 'Protótipos de Telas | screeK',
};

function PageHandler() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Dynamic pattern fallback titles
    if (ROUTE_TITLES[pathname]) {
      document.title = ROUTE_TITLES[pathname];
    } else if (pathname.startsWith('/movies/') && pathname.endsWith('/sessions')) {
      document.title = 'Sessões & Horários | screeK';
    } else if (pathname.startsWith('/movies/')) {
      document.title = 'Detalhes do Filme | screeK';
    } else if (pathname.startsWith('/cinemas/')) {
      document.title = 'Cinema | screeK';
    } else if (pathname.startsWith('/feed/')) {
      document.title = 'Publicação | screeK';
    } else if (pathname.startsWith('/lists/')) {
      document.title = 'Lista de Filmes | screeK';
    } else if (pathname.startsWith('/users/') || pathname.startsWith('/u/')) {
      document.title = 'Perfil Cinéfilo | screeK';
    } else {
      document.title = 'screeK — Ingressos & Comunidade Cinéfila';
    }
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <PageHandler />
      <AuthModal />
      <Toaster 
        theme="dark"
        position="bottom-right" 
        richColors
        gap={10}
        closeButton
        icons={{
          success: <CheckCircle size={26} weight="fill" className="text-[#16A34A] shrink-0" />,
          error: <XCircle size={26} weight="fill" className="text-[#DC2626] shrink-0" />,
          warning: <WarningCircle size={26} weight="fill" className="text-[#DBA212] shrink-0" />,
          info: <Info size={26} weight="fill" className="text-[#3B82F6] shrink-0" />,
        }}
      />

      <Routes>
        {/* 1. Rotas Apenas para Visitantes Deslogados (Redirecionam se logado) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<AuthLayout />}>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Catálogo, busca, feed e páginas informativas podem ser vistos sem login. */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cinemas/:id" element={<CinemaDetail />} />
          <Route path="/cinemas" element={<Cinemas />} />
          <Route path="/movies/:id/sessions" element={<MovieSessions />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/movies" element={<MoviesCatalog />} />
          <Route path="/sessions/:id/seats" element={<SeatSelection />} />
          <Route path="/checkout/seats" element={<SeatSelection />} />
          <Route path="/seats/:id" element={<SeatSelection />} />
          <Route path="/seats" element={<SeatSelection />} />
          <Route path="/search" element={<Search />} />
          <Route path="/person/:id" element={<PersonDetail />} />
          <Route path="/people/:id" element={<PersonDetail />} />
          <Route path="/feed/:id" element={<FeedDetail />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/users/:username" element={<Profile />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/collections/:slug" element={<CollectionDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Contact />} />
          <Route path="/tickets/find" element={<TicketLookup />} />
          <Route path="/management/request-access" element={<ManagementAccessRequest />} />
          <Route path="/management/invitations/:token" element={<ManagementInvitation />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/components" element={import.meta.env.DEV ? <ComponentsShowcaseScreen /> : <NotFound />} />
          <Route path="/prototypes" element={import.meta.env.DEV ? <ScreenPrototypes /> : <NotFound />} />
          <Route path="/dev/states" element={import.meta.env.DEV ? <StateGallery /> : <NotFound />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Rotas Autenticadas do Usuário (USER, MANAGER, ADMIN) */}
          <Route element={<RoleGuard allowedRoles={['USER', 'MANAGER', 'ADMIN']} />}>
            <Route path="/tickets/:id" element={<Tickets />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/stats" element={<ProfileStats />} />
            <Route path="/profile/settings" element={<Settings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/lists/new" element={<NewList />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/recommendations" element={<Intelligence />} />
            <Route path="/import" element={<LetterboxdImport />} />
            <Route path="/import/letterboxd" element={<LetterboxdImport />} />
          </Route>

          {/* 404 Catch-all within MainLayout */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* 3. Rotas B2B / Exibidor Privilegiadas (MANAGER e ADMIN apenas) */}
        <Route element={<RoleGuard allowedRoles={['MANAGER', 'ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/management" element={<ManagementCinemas />} />
            <Route path="/management/cinemas" element={<ManagementCinemas />} />
            <Route path="/management/cinemas/new" element={<ManagementCinemaForm />} />
            <Route path="/management/cinemas/:id/edit" element={<ManagementCinemaForm />} />
            <Route path="/management/cinemas/:id/rooms" element={<ManagementCinemaForm />} />
            <Route path="/management/schedule" element={<ManagementSchedule />} />
            <Route path="/management/statistics" element={<ManagementStatistics />} />
            <Route path="/management/operations" element={<ManagementOperations />} />
            <Route path="/management/check-in" element={<TicketValidation />} />
            <Route path="/statistics" element={<Navigate to="/management/statistics" replace />} />
            <Route path="/management/stats" element={<Navigate to="/management/statistics" replace />} />
          </Route>
        </Route>

        {/* Administração global. No ambiente real, o servidor também precisa impor ADMIN. */}
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/platform" element={<PlatformAdmin />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
