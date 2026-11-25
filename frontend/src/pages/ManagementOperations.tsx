import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bank, UsersThree, ClockCounterClockwise, UploadSimple, Check, X, Plus, MagnifyingGlass, CurrencyDollar, Ticket, WarningCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import { SectionHeading } from '../components/custom/section-heading';
import { EmptyState } from '../components/custom/empty-state';

type OpsTab = 'orders' | 'finance' | 'refunds' | 'team' | 'audit' | 'import';
type OrderStatus = 'Pago' | 'Pendente' | 'Reembolsado';

const TABS: { id: OpsTab; label: string; icon: typeof Ticket }[] = [
  { id: 'orders', label: 'Vendas e pedidos', icon: Ticket },
  { id: 'finance', label: 'Financeiro', icon: Bank },
  { id: 'refunds', label: 'Reembolsos', icon: CurrencyDollar },
  { id: 'team', label: 'Equipe e acessos', icon: UsersThree },
  { id: 'audit', label: 'Histórico', icon: ClockCounterClockwise },
  { id: 'import', label: 'Importar sessões', icon: UploadSimple },
];

const startOrders = [
  { id: 'TXN-20261125-8912', customer: 'Lothrik Junior', title: 'Speed Racer', session: 'Hoje · 16:15 · Sala 4', total: 169, status: 'Pago' as OrderStatus },
  { id: 'TXN-20261125-4419', customer: 'Beatriz Lima', title: 'Chainsaw Man – Reze Arc', session: 'Hoje · 20:15 · Sala 4', total: 133, status: 'Pago' as OrderStatus },
  { id: 'TXN-20261124-1032', customer: 'Gabriel Souza', title: 'Duna: Parte II', session: 'Ontem · 19:30 · Sala 2', total: 122, status: 'Pendente' as OrderStatus },
];

const startTeam = [
  { name: 'Mariana Costa', email: 'mariana@cinema.com.br', role: 'Gerente da unidade', access: 'Unidade atual', status: 'Ativo' },
  { name: 'Rafael Nunes', email: 'rafael@cinema.com.br', role: 'Bilheteria / validação', access: 'Unidade atual', status: 'Ativo' },
  { name: 'Paula Martins', email: 'paula@cinema.com.br', role: 'Financeiro', access: 'Unidade atual', status: 'Convite pendente' },
];

const panel = 'border-2 border-foreground/30 bg-background p-4 sm:p-5';
const outline = 'inline-flex items-center justify-center gap-2 border-2 border-foreground/40 px-3 py-2 text-[10px] font-black uppercase hover:border-primary hover:text-primary';
const primary = 'inline-flex items-center justify-center gap-2 border-2 border-primary bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground hover:bg-primary/90';
const input = 'border-2 border-foreground/35 bg-background px-3 py-2 text-xs outline-none focus:border-primary';

export function ManagementOperations() {
  const [params, setParams] = useSearchParams();
  const active = (TABS.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'orders') as OpsTab;
  const cinemaId = params.get('cinemaId') || MOCK_CINEMAS[0]?.id || '';
  const cinema = MOCK_CINEMAS.find((item) => item.id === cinemaId) ?? MOCK_CINEMAS[0];
  const [orders, setOrders] = useState(startOrders);
  const [team, setTeam] = useState(startTeam);
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Bilheteria / validação');
  const [fileName, setFileName] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);

  const setTab = (tab: OpsTab) => setParams((current) => { const next = new URLSearchParams(current); next.set('tab', tab); return next; });
  const filteredOrders = useMemo(() => orders.filter((order) => `${order.id} ${order.customer} ${order.title}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);
  const pendingRefunds = orders.filter((order) => order.status === 'Pago').slice(0, 2);

  const decideRefund = (id: string, approve: boolean) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status: approve ? 'Reembolsado' : 'Pago' } : order));
    toast.success(approve ? 'Reembolso aprovado e registrado.' : 'Solicitação de reembolso recusada.');
  };

  const addTeamMember = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { toast.error('Informe um e-mail válido.'); return; }
    setTeam((current) => [{ name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole, access: cinema?.name ?? 'Unidade atual', status: 'Convite pendente' }, ...current]);
    setInviteEmail('');
    toast.success('Convite enviado com sucesso.', { description: 'O membro receberá o link de acesso por e-mail.' });
  };

  const deactivateMember = (email: string) => {
    setTeam((current) => current.map((member) => member.email === email ? { ...member, status: member.status === 'Suspenso' ? 'Ativo' : 'Suspenso' } : member));
  };

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-0">
    <div><h1 className="font-display text-3xl font-black uppercase text-primary">Vendas, equipe e atendimento</h1><p className="mt-1 text-sm text-foreground/65">{cinema?.name}</p></div>
    <nav aria-label="Operações do cinema" className="flex gap-1 overflow-x-auto border-b-2 border-foreground/30">{TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={active === id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 border-b-4 px-3 py-3 text-[10px] font-black uppercase sm:px-4 sm:text-xs ${active === id ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'}`}><Icon size={16} weight="bold"/>{label}</button>)}</nav>

    {active === 'orders' && <section className={panel}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SectionHeading title="Pedidos recentes" size="medium" actions={<span className="text-[10px] font-mono text-foreground/55">Hoje · 18 pedidos</span>} className="min-w-[240px] flex-1"/><label className="flex h-10 items-center gap-2 border-2 border-foreground/30 px-3"><MagnifyingGlass size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, filme ou TXN" className="w-48 bg-transparent text-xs outline-none"/></label></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b-2 border-foreground/25 text-[9px] uppercase text-foreground/55"><th className="p-3">Pedido</th><th className="p-3">Cliente / sessão</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Ação</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id} className="border-b border-foreground/15"><td className="p-3 font-mono text-[10px]">{order.id}</td><td className="p-3"><strong className="block">{order.customer} · {order.title}</strong><span className="text-foreground/55">{order.session}</span></td><td className="p-3 font-black">R$ {order.total.toFixed(2).replace('.', ',')}</td><td className="p-3"><span className={`font-black ${order.status === 'Pago' ? 'text-success' : order.status === 'Pendente' ? 'text-warning' : 'text-destructive'}`}>{order.status}</span></td><td className="p-3"><button type="button" onClick={() => toast.info(`Pedido ${order.id} · ${order.customer} (${order.status})`)} className={outline}>Detalhes</button></td></tr>)}</tbody></table>{filteredOrders.length === 0 && <EmptyState title="Nenhum pedido encontrado" className="border-0"/>}</div></section>}

    {active === 'finance' && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: 'Vendas brutas', value: 'R$ 42.860' }, { label: 'Taxas screeK', value: 'R$ 1.284' }, { label: 'Reembolsos', value: 'R$ 312' }, { label: 'Próximo repasse', value: 'R$ 41.264' }].map((item) => <div key={item.label} className={panel}><span className="text-[10px] font-black uppercase text-foreground/55">{item.label}</span><strong className="mt-2 block font-display text-2xl font-black text-foreground">{item.value}</strong><span className="text-[10px] text-foreground/50">Competência nov/2026</span></div>)}</div><section className={panel}><SectionHeading title="Repasses e taxas" size="medium" className="mb-4"/><div className="grid gap-4 md:grid-cols-2"><div className="border-2 border-foreground/20 p-4"><p className="text-[10px] font-black uppercase text-foreground/55">Próximo repasse previsto</p><strong className="my-2 block font-display text-3xl font-black text-foreground">R$ 41.264,00</strong><p className="text-xs text-foreground/60">30 nov 2026 · transferência para conta cadastrada</p><button type="button" onClick={() => toast.success('Extrato financeiro gerado para download.')} className={`${outline} mt-4`}>Baixar extrato</button></div><div className="border-2 border-foreground/20 p-4"><p className="mb-2 text-[10px] font-black uppercase text-foreground/55">Composição do valor</p><div className="space-y-2 text-xs"><p className="flex justify-between"><span>Ingressos</span><strong>R$ 40.980,00</strong></p><p className="flex justify-between"><span>Bomboniere</span><strong>R$ 3.164,00</strong></p><p className="flex justify-between border-t border-foreground/20 pt-2"><span>Taxas e estornos</span><strong>− R$ 2.880,00</strong></p></div></div></div></section></div>}

    {active === 'refunds' && <section className={panel}><SectionHeading title="Reembolsos e atendimento" size="medium" actions={<span className="text-[10px] font-bold text-foreground/55">Até 2h antes da sessão</span>} className="mb-4"/><div className="space-y-3">{pendingRefunds.map((order) => <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground/20 p-4"><div><span className="font-mono text-[10px] text-foreground/50">Solicitação · {order.id}</span><h3 className="text-sm font-black">{order.customer} · {order.title}</h3><p className="text-xs text-foreground/60">{order.session} · R$ {order.total.toFixed(2).replace('.', ',')}</p></div><div className="flex gap-2"><button type="button" onClick={() => decideRefund(order.id, false)} className={outline}><X size={14}/> Recusar</button><button type="button" onClick={() => decideRefund(order.id, true)} className={primary}><Check size={14}/> Aprovar estorno</button></div></article>)}{pendingRefunds.length === 0 && <EmptyState title="Sem solicitações pendentes" description="Novos pedidos de reembolso aparecerão aqui."/>}</div></section>}

    {active === 'team' && <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><section className={panel}><SectionHeading title="Equipe desta unidade" size="medium" className="mb-4"/><div className="space-y-2">{team.map((member) => <article key={member.email} className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground/15 p-3"><div><h3 className="text-xs font-black">{member.name}</h3><p className="text-[11px] text-foreground/60">{member.email} · {member.access}</p><p className="mt-1 text-[10px] font-black uppercase text-primary">{member.role}</p></div><div className="flex items-center gap-3"><span className={`text-[10px] font-black uppercase ${member.status === 'Ativo' ? 'text-success' : 'text-warning'}`}>{member.status}</span><button type="button" onClick={() => deactivateMember(member.email)} className={outline}>{member.status === 'Suspenso' ? 'Reativar' : 'Suspender'}</button></div></article>)}</div></section><section className={panel}><SectionHeading title="Convidar funcionário" size="medium" className="mb-4"/><label className="mb-1 block text-[10px] font-black uppercase">E-mail</label><input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="funcionario@cinema.com.br" className={`${input} mb-3 w-full`}/><label className="mb-1 block text-[10px] font-black uppercase">Papel e permissões</label><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className={`${input} mb-3 w-full`}><option>Gerente da unidade</option><option>Bilheteria / validação</option><option>Financeiro</option></select><div className="mb-4 border-l-4 border-primary bg-muted/20 p-3 text-[10px] leading-relaxed"><strong className="block">Acesso conforme função</strong>{inviteRole === 'Bilheteria / validação' ? 'Validar ingresso e consultar sessão. Sem acesso a preços, vendas ou faturamento.' : inviteRole === 'Financeiro' ? 'Consultar pedidos, taxas, repasses e reembolsos. Sem editar programação.' : 'Gerenciar a unidade, equipe e sessões conforme permissões da rede.'}</div><button type="button" onClick={addTeamMember} className={`${primary} w-full`}><Plus size={14}/> Enviar convite</button></section></div>}

    {active === 'audit' && <section className={panel}><SectionHeading title="Histórico de alterações" size="medium" actions={<span className="text-[10px] font-mono text-foreground/55">Últimos 30 dias</span>} className="mb-4"/><div className="space-y-0">{[
      ['Hoje · 09:32', 'Mariana Costa', 'Alterou o preço da sessão', 'Speed Racer · Sala 4 · inteira R$ 64 → R$ 68'],
      ['Ontem · 18:41', 'Rafael Nunes', 'Adicionou sessões', 'Chainsaw Man · 2 horários na Sala 4'],
      ['22 nov · 14:06', 'Mariana Costa', 'Atualizou equipe', 'Convite enviado para paula@cinema.com.br · Financeiro'],
      ['20 nov · 11:55', 'screeK', 'Repasse processado', 'Lote RP-2026-118 · R$ 18.420,00'],
    ].map(([date, actor, action, details]) => <article key={date} className="grid gap-2 border-b border-foreground/15 py-4 sm:grid-cols-[140px_160px_1fr]"><span className="font-mono text-[10px] text-foreground/55">{date}</span><strong className="text-xs">{actor}</strong><span><strong className="block text-xs">{action}</strong><small className="text-foreground/60">{details}</small></span></article>)}</div></section>}

    {active === 'import' && <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className={panel}><SectionHeading title="Importar programação" size="medium" className="mb-4"/><p className="mb-4 text-xs leading-relaxed text-foreground/65">Envie uma planilha CSV/XLSX do sistema do cinema para revisar conflitos antes da publicação.</p><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-foreground/35 p-4 text-center hover:border-primary"><UploadSimple size={26} className="text-primary"/><strong className="text-xs">{fileName || 'Escolher arquivo CSV ou XLSX'}</strong><small className="text-[10px] text-foreground/55">Máximo 10 MB · revisão antes da publicação</small><input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileName(file.name); setShowImportPreview(false); } }}/></label><button type="button" disabled={!fileName} onClick={() => setShowImportPreview(true)} className={`${primary} mt-4 w-full disabled:opacity-50`}><UploadSimple size={14}/> Validar planilha</button>{showImportPreview && <div className="mt-3 border-2 border-success/50 bg-success/5 p-3 text-xs"><strong className="block text-success">Planilha validada</strong>12 sessões reconhecidas · 1 conflito de sala para revisar.</div>}</section><section className={panel}><SectionHeading title="Integração e revisão" size="medium" className="mb-4"/><div className="space-y-3"><div className="border-2 border-foreground/15 p-3"><span className="text-[9px] font-black uppercase text-foreground/50">Colunas reconhecidas</span><p className="mt-1 text-xs font-bold">Cinema · Sala · Filme · Data · Horário · Formato · Áudio · Preço</p></div><div className="border-2 border-warning/40 bg-warning/5 p-3"><strong className="flex items-center gap-2 text-xs text-warning"><WarningCircle size={15}/> Conflito detectado</strong><p className="mt-1 text-xs">Sala 4 · 20:15 · Chainsaw Man coincide com outra sessão.</p></div><button type="button" onClick={() => toast.success('Programação revisada e publicada com sucesso.')} className={outline}>Revisar e publicar</button></div></section></div>}
  </main>;
}
