import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Buildings, UsersThree, ShieldWarning, FilmStrip, CurrencyDollar,
  EnvelopeSimple, Check, X, MagnifyingGlass, ClockCounterClockwise,
  ArrowClockwise, WarningCircle, CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import { SectionHeading } from '../components/custom/section-heading';
import { EmptyState } from '../components/custom/empty-state';

type AdminTab = 'overview' | 'access' | 'cinemas' | 'moderation' | 'catalog' | 'fees';
type ModerationStatus = 'Pendente' | 'Resolvida' | 'Dispensada';

const INITIAL_REQUESTS = [
  { id: 'REQ-2084', person: 'Mariana Costa', email: 'mariana@cinemax.com.br', cinema: 'Cinemark Bourbon Shopping', cnpj: '12.345.678/0001-90', role: 'Gerente de unidade', date: 'Hoje, 09:42' },
  { id: 'REQ-2081', person: 'Rafael Nunes', email: 'rafael@cinepolis.com.br', cinema: 'Cinépolis JK Iguatemi', cnpj: '45.678.901/0001-23', role: 'Operações', date: 'Ontem, 16:18' },
];

const INITIAL_REPORTS = [
  { id: 'RPT-731', kind: 'Review', target: 'Review de “Duna: Parte II”', author: '@cinema_fan', reason: 'Spoiler sem aviso', status: 'Pendente' as ModerationStatus },
  { id: 'RPT-728', kind: 'Publicação', target: 'Post em Feed', author: '@cinefilo_88', reason: 'Assédio', status: 'Pendente' as ModerationStatus },
  { id: 'RPT-725', kind: 'Usuário', target: 'Perfil de usuário', author: '@maratona_x', reason: 'Spam recorrente', status: 'Pendente' as ModerationStatus },
];

const INITIAL_DUPLICATES = [
  { id: 'MOV-1042', title: 'The Batman', match: 'Batman (2022)', confidence: '94%' },
  { id: 'PPL-882', title: 'Lana Wachowski', match: 'Lana Wachowski (pessoa #503)', confidence: '88%' },
];

const TABS: { id: AdminTab; label: string; icon: typeof Buildings }[] = [
  { id: 'overview', label: 'Visão geral', icon: Buildings },
  { id: 'access', label: 'Acessos', icon: UsersThree },
  { id: 'cinemas', label: 'Cinemas', icon: Buildings },
  { id: 'moderation', label: 'Moderação', icon: ShieldWarning },
  { id: 'catalog', label: 'Catálogo', icon: FilmStrip },
  { id: 'fees', label: 'Taxas', icon: CurrencyDollar },
];

const panelClass = 'border-2 border-foreground/30 bg-background p-4 sm:p-5';
const controlClass = 'border-2 border-foreground/35 bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary';
const primaryButton = 'inline-flex items-center justify-center gap-2 border-2 border-primary bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground hover:bg-primary/90';
const outlineButton = 'inline-flex items-center justify-center gap-2 border-2 border-foreground/40 px-3 py-2 text-[10px] font-black uppercase hover:border-primary hover:text-primary';

export function PlatformAdmin() {
  const [params, setParams] = useSearchParams();
  const activeTab = (TABS.some((tab) => tab.id === params.get('tab')) ? params.get('tab') : 'overview') as AdminTab;
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [duplicates, setDuplicates] = useState(INITIAL_DUPLICATES);
  const [cinemas, setCinemas] = useState(() => MOCK_CINEMAS.map((cinema, index) => ({ ...cinema, verified: index !== 1, active: true })));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCinema, setInviteCinema] = useState(MOCK_CINEMAS[0]?.id ?? '');
  const [invites, setInvites] = useState<{ email: string; cinema: string; status: string; token: string }[]>([
    { email: 'operacoes@cinema.com.br', cinema: MOCK_CINEMAS[0]?.name ?? 'Cinema', status: 'Aguardando aceite', token: 'demo-gestor' },
  ]);
  const [fee, setFee] = useState('5,00');
  const [query, setQuery] = useState('');

  const pendingReports = reports.filter((item) => item.status === 'Pendente').length;
  const pendingRequests = requests.length;
  const filteredCinemas = useMemo(() => cinemas.filter((cinema) => `${cinema.name} ${cinema.city} ${cinema.chain}`.toLowerCase().includes(query.toLowerCase())), [cinemas, query]);

  const chooseTab = (tab: AdminTab) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set('tab', tab);
    return next;
  });

  const resolveRequest = (id: string, approved: boolean) => {
    const request = requests.find((item) => item.id === id);
    setRequests((previous) => previous.filter((item) => item.id !== id));
    toast.success(approved ? 'Pedido aprovado; convite de acesso preparado.' : 'Pedido recusado.', { description: request?.cinema });
  };

  const inviteManager = () => {
    const cinema = cinemas.find((item) => item.id === inviteCinema);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Informe um e-mail válido para enviar o convite.');
      return;
    }
    const token = `convite-${Date.now()}`;
    setInvites((previous) => [{ email: inviteEmail, cinema: cinema?.name ?? 'Cinema', status: 'Aguardando aceite', token }, ...previous]);
    setInviteEmail('');
    toast.success('Convite enviado com sucesso.', { description: 'O destinatário receberá as instruções por e-mail.' });
  };

  const updateReport = (id: string, status: ModerationStatus) => {
    setReports((previous) => previous.map((item) => item.id === id ? { ...item, status } : item));
    toast.success(status === 'Resolvida' ? 'Ação de moderação registrada.' : 'Denúncia dispensada.');
  };

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-0">
    <div>
      <h1 className="font-display text-3xl font-black uppercase text-primary sm:text-4xl">Operação screeK</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/65">Acessos, catálogo, moderação e regras globais em um único painel.</p>
    </div>

    <nav aria-label="Áreas de administração" className="flex gap-1 overflow-x-auto border-b-2 border-foreground/30">
      {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => chooseTab(id)} aria-current={activeTab === id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 border-b-4 px-3 py-3 text-[10px] font-black uppercase sm:px-4 sm:text-xs ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'}`}><Icon size={16} weight="bold"/>{label}{id === 'access' && pendingRequests > 0 ? ` (${pendingRequests})` : ''}{id === 'moderation' && pendingReports > 0 ? ` (${pendingReports})` : ''}</button>)}
    </nav>

    {activeTab === 'overview' && <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pedidos de acesso', value: String(pendingRequests), note: 'Aguardando revisão', icon: UsersThree },
          { label: 'Cinemas ativos', value: String(cinemas.filter((item) => item.active).length), note: `${cinemas.filter((item) => !item.verified).length} precisam de verificação`, icon: Buildings },
          { label: 'Denúncias pendentes', value: String(pendingReports), note: 'Fila de moderação', icon: ShieldWarning },
          { label: 'Taxa por pedido', value: `R$ ${fee}`, note: 'Regra global atual', icon: CurrencyDollar },
        ].map(({ label, value, note, icon: Icon }) => <div key={label} className={panelClass}><Icon size={20} className="text-primary" weight="bold"/><span className="mt-3 block text-[10px] font-black uppercase tracking-wider text-foreground/60">{label}</span><strong className="mt-1 block font-display text-2xl font-black text-foreground">{value}</strong><span className="text-xs text-foreground/55">{note}</span></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panelClass}><SectionHeading title="Ações prioritárias" size="medium" className="mb-4"/><div className="space-y-3">
          <button type="button" onClick={() => chooseTab('access')} className="flex w-full items-center justify-between border-2 border-foreground/20 p-3 text-left hover:border-primary"><span><strong className="block text-xs font-black uppercase">Revisar solicitações de gestão</strong><small className="text-foreground/60">Confirmar vínculo e escopo de cinema</small></span><span className="bg-primary px-2 py-1 text-[10px] font-black text-primary-foreground">{pendingRequests}</span></button>
          <button type="button" onClick={() => chooseTab('moderation')} className="flex w-full items-center justify-between border-2 border-foreground/20 p-3 text-left hover:border-primary"><span><strong className="block text-xs font-black uppercase">Triar denúncias da comunidade</strong><small className="text-foreground/60">Reviews, publicações e perfis</small></span><span className="bg-destructive px-2 py-1 text-[10px] font-black text-white">{pendingReports}</span></button>
          <button type="button" onClick={() => chooseTab('cinemas')} className="flex w-full items-center justify-between border-2 border-foreground/20 p-3 text-left hover:border-primary"><span><strong className="block text-xs font-black uppercase">Verificar cadastros de cinema</strong><small className="text-foreground/60">Dados legais e informações públicas</small></span><span className="text-xs font-black text-warning">{cinemas.filter((item) => !item.verified).length} pendentes</span></button>
        </div></section>
        <section className={panelClass}><SectionHeading title="Princípios de acesso" size="medium" className="mb-4"/><ul className="space-y-3 text-xs leading-relaxed text-foreground/75"><li className="border-l-4 border-primary pl-3"><strong className="text-foreground">Usuário</strong> — recursos sociais, perfil e compras próprias.</li><li className="border-l-4 border-primary/70 pl-3"><strong className="text-foreground">Equipe do cinema</strong> — permissões limitadas por unidade e função.</li><li className="border-l-4 border-foreground/50 pl-3"><strong className="text-foreground">Admin da plataforma</strong> — convites, verificação, moderação e regras globais.</li></ul></section>
      </div>
    </div>}

    {activeTab === 'access' && <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
      <section className={panelClass}><SectionHeading title="Solicitações de gestão" size="medium" actions={<span className="text-[10px] font-bold text-foreground/55">Aprovação vinculada a uma unidade</span>} className="mb-4"/>
        {requests.length === 0 ? <EmptyState icon={<CheckCircle size={30}/>} title="Fila zerada" description="Novas solicitações aparecerão aqui." className="border-0 p-6"/> : <div className="space-y-3">{requests.map((request) => <article key={request.id} className="border-2 border-foreground/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="font-mono text-[10px] font-bold text-foreground/50">{request.id} · {request.date}</span><h3 className="mt-1 text-sm font-black">{request.person} <span className="font-normal text-foreground/60">· {request.role}</span></h3><p className="text-xs text-primary">{request.email}</p></div><span className="border border-warning px-2 py-1 text-[9px] font-black uppercase text-warning">Em análise</span></div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div className="bg-muted/30 p-2"><small className="block text-[9px] font-black uppercase text-foreground/50">Cinema solicitado</small>{request.cinema}</div><div className="bg-muted/30 p-2"><small className="block text-[9px] font-black uppercase text-foreground/50">CNPJ declarado</small>{request.cnpj}</div></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => resolveRequest(request.id, false)} className={outlineButton}><X size={14}/> Recusar</button><button type="button" onClick={() => resolveRequest(request.id, true)} className={primaryButton}><Check size={14}/> Aprovar e convidar</button></div></article>)}</div>}
      </section>
      <section className={panelClass}><SectionHeading title="Convidar gestor" size="medium" className="mb-4"/><p className="mb-4 text-xs leading-relaxed text-foreground/65">O convite concede acesso somente às unidades selecionadas mediante confirmação por e-mail.</p><label className="mb-1 block text-[10px] font-black uppercase">E-mail corporativo</label><input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="nome@cinema.com.br" className={`${controlClass} mb-4 w-full`}/><label className="mb-1 block text-[10px] font-black uppercase">Cinema</label><select value={inviteCinema} onChange={(event) => setInviteCinema(event.target.value)} className={`${controlClass} mb-4 w-full`}>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select><label className="mb-1 block text-[10px] font-black uppercase">Acesso inicial</label><select className={`${controlClass} mb-4 w-full`} defaultValue="MANAGER"><option value="MANAGER">Gestor da unidade</option><option value="FINANCE">Financeiro</option><option value="CHECKIN">Bilheteria / validação</option></select><button type="button" onClick={inviteManager} className={`${primaryButton} w-full`}><EnvelopeSimple size={15}/> Criar convite</button><div className="mt-5 border-t-2 border-foreground/15 pt-4"><h3 className="mb-2 text-[10px] font-black uppercase">Convites recentes</h3>{invites.map((invite, index) => <div key={`${invite.email}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/15 py-2 text-xs"><span><strong>{invite.email}</strong><small className="block text-foreground/55">{invite.cinema}</small></span><span className="text-right"><small className="block text-warning">{invite.status}</small><Link to={`/management/invitations/${invite.token}`} className="font-black uppercase text-primary underline">Abrir convite</Link></span></div>)}</div></section>
    </div>}

    {activeTab === 'cinemas' && <section className={panelClass}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SectionHeading title="Cadastro e verificação de cinemas" size="medium" className="min-w-[260px] flex-1"/><label className="flex h-10 items-center gap-2 border-2 border-foreground/30 px-3"><MagnifyingGlass size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cinema" className="w-40 bg-transparent text-xs outline-none"/></label></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b-2 border-foreground/25 text-[9px] uppercase text-foreground/55"><th className="p-3">Cinema / Rede</th><th className="p-3">Localização</th><th className="p-3">Verificação</th><th className="p-3">Status</th><th className="p-3">Ação</th></tr></thead><tbody>{filteredCinemas.map((cinema) => <tr key={cinema.id} className="border-b border-foreground/15"><td className="p-3"><strong className="block">{cinema.name}</strong><span className="text-foreground/55">{cinema.chain}</span></td><td className="p-3">{cinema.city}, {cinema.state}</td><td className="p-3"><span className={`font-black ${cinema.verified ? 'text-success' : 'text-warning'}`}>{cinema.verified ? 'Verificado' : 'Documentos pendentes'}</span></td><td className="p-3">{cinema.active ? 'Ativo' : 'Suspenso'}</td><td className="p-3"><button type="button" onClick={() => { setCinemas((previous) => previous.map((item) => item.id === cinema.id ? { ...item, verified: !item.verified } : item)); toast.success(cinema.verified ? 'Verificação removida.' : 'Cinema marcado como verificado.'); }} className={outlineButton}>{cinema.verified ? 'Revisar' : 'Verificar'}</button></td></tr>)}</tbody></table></div></section>}

    {activeTab === 'moderation' && <section className={panelClass}><SectionHeading title="Fila de moderação" size="medium" actions={<button type="button" onClick={() => setReports(INITIAL_REPORTS)} className={outlineButton}><ArrowClockwise size={14}/> Atualizar fila</button>} className="mb-4"/><div className="space-y-3">{reports.map((report) => <article key={report.id} className="grid gap-3 border-2 border-foreground/20 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><span className="font-mono text-[10px] text-foreground/50">{report.id} · {report.kind}</span><h3 className="text-sm font-black">{report.target}</h3><p className="text-xs text-foreground/60">{report.author} · motivo: {report.reason}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`mr-2 text-[10px] font-black uppercase ${report.status === 'Pendente' ? 'text-warning' : 'text-success'}`}>{report.status}</span>{report.status === 'Pendente' && <><button type="button" onClick={() => updateReport(report.id, 'Dispensada')} className={outlineButton}>Dispensar</button><button type="button" onClick={() => updateReport(report.id, 'Resolvida')} className={primaryButton}>Aplicar ação</button></>}</div></article>)}</div></section>}

    {activeTab === 'catalog' && <section className={panelClass}><SectionHeading title="Qualidade do catálogo" size="medium" actions={<span className="text-[10px] font-bold text-foreground/55">Duplicados e correções sugeridas</span>} className="mb-4"/><div className="space-y-3">{duplicates.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground/20 p-4"><div><span className="font-mono text-[10px] text-foreground/50">{item.id} · correspondência {item.confidence}</span><h3 className="text-sm font-black">{item.title}</h3><p className="text-xs text-foreground/60">Possível duplicata: {item.match}</p></div><div className="flex gap-2"><button type="button" onClick={() => { setDuplicates((previous) => previous.filter((candidate) => candidate.id !== item.id)); toast.success('Sugestão de duplicidade descartada.'); }} className={outlineButton}>Não é duplicado</button><button type="button" onClick={() => { setDuplicates((previous) => previous.filter((candidate) => candidate.id !== item.id)); toast.success('Registros mesclados com sucesso.'); }} className={primaryButton}>Revisar mesclagem</button></div></article>)}</div>{duplicates.length === 0 && <EmptyState title="Tudo revisado" description="Não há sugestões pendentes no momento." className="mt-3"/>}<div className="mt-5 grid gap-3 border-t-2 border-foreground/15 pt-4 sm:grid-cols-2"><div><label className="mb-1 block text-[10px] font-black uppercase">Corrigir dados de filme/pessoa</label><input placeholder="Buscar título, pessoa ou ID" className={`${controlClass} w-full`}/></div><button type="button" onClick={() => toast.info('Revisão de catálogo aberta.')} className={`${outlineButton} self-end`}>Abrir revisão do catálogo</button></div></section>}

    {activeTab === 'fees' && <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className={panelClass}><SectionHeading title="Taxa de serviço" size="medium" className="mb-4"/><p className="mb-4 text-xs leading-relaxed text-foreground/65">Valor cobrado por pedido. Mudanças passam a valer para novas transações com transparência antes do pagamento.</p><label className="mb-1 block text-[10px] font-black uppercase">Taxa fixa (R$)</label><div className="flex gap-2"><input value={fee} onChange={(event) => setFee(event.target.value)} inputMode="decimal" className={`${controlClass} min-w-0 flex-1`}/><button type="button" onClick={() => toast.success(`Regra de taxa atualizada para R$ ${fee}.`)} className={primaryButton}>Salvar regra</button></div><div className="mt-4 border-2 border-warning/50 bg-warning/5 p-3 text-[11px] leading-relaxed text-foreground/70"><strong className="mb-1 flex items-center gap-2 text-warning"><WarningCircle size={15}/> Regra global sensível</strong>Alterações exigem permissão ADMIN e ficam registradas no histórico de auditoria.</div></section><section className={panelClass}><SectionHeading title="Histórico de alterações" size="medium" className="mb-4"/><div className="space-y-3 text-xs"><div className="flex gap-3 border-l-4 border-primary pl-3"><ClockCounterClockwise size={16} className="shrink-0 text-primary"/><span><strong>R$ 5,00</strong> — taxa por pedido vigente desde 01/08/2026<small className="block text-foreground/50">Admin screeK · regra atual</small></span></div><div className="flex gap-3 border-l-4 border-foreground/25 pl-3"><ClockCounterClockwise size={16} className="shrink-0 text-foreground/50"/><span><strong>R$ 4,00</strong> — valor anterior<small className="block text-foreground/50">Histórico de vigência</small></span></div></div></section></div>}
  </main>;
}
