import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Buildings, CheckCircle, EnvelopeSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

export function ManagementInvitation() {
  const { token = '' } = useParams<{ token: string }>();
  const { user, accessToken } = useAuthStore();
  const [accepted, setAccepted] = useState(false);
  const isAuthenticated = Boolean(user && accessToken);
  const loginLink = `/login?redirect=${encodeURIComponent(`/management/invitations/${token}`)}`;

  return <main className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center px-4 py-10"><section className="w-full border-4 border-foreground/30 bg-background p-6 sm:p-9">
    {accepted ? <CheckCircle size={38} weight="fill" className="text-success"/> : <Buildings size={38} weight="bold" className="text-primary"/>}
    <h1 className="mt-4 font-display text-2xl font-black uppercase text-primary sm:text-3xl">{accepted ? 'Convite aceito' : 'Convite para gerenciar uma unidade'}</h1>
    <div className="mt-5 border-2 border-foreground/20 p-4"><span className="text-[10px] font-black uppercase text-foreground/55">Cinema</span><p className="font-display text-lg font-black">Cinemark Bourbon Shopping</p><span className="mt-3 block text-[10px] font-black uppercase text-foreground/55">Permissão</span><p className="text-sm font-bold">Gestor da unidade</p></div>
    {accepted ? <p className="mt-4 text-sm text-foreground/70">Convite aceito. Sua conta foi vinculada com sucesso a esta unidade.</p> : !isAuthenticated ? <div className="mt-5 space-y-3"><p className="text-sm text-foreground/70">Entre na sua conta para confirmar o vínculo com este cinema.</p><Link to={loginLink} className="inline-flex items-center gap-2 bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground"><EnvelopeSimple size={15}/>Entrar para aceitar</Link></div> : <div className="mt-5 space-y-3"><p className="text-sm text-foreground/70">Você entrou como <strong>{user?.username}</strong>. Confirme o convite para concluir a associação.</p><button type="button" onClick={() => { setAccepted(true); toast.success('Convite aceito com sucesso.'); }} className="bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground">Aceitar convite</button></div>}
  </section></main>;
}
