import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EnvelopeSimple, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';

export function EmailVerification() {
  const [verified, setVerified] = useState(false);
  return <main className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-4 py-10"><section className="w-full border-4 border-foreground/30 bg-background p-6 text-center sm:p-10"><EnvelopeSimple size={34} className="mx-auto text-primary"/><h1 className="mt-4 font-display text-2xl font-black uppercase text-primary sm:text-3xl">{verified ? 'E-mail confirmado' : 'Confirme seu e-mail'}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-foreground/65">{verified ? 'Seu endereço de e-mail foi confirmado com sucesso.' : 'Enviamos um link de verificação para o endereço cadastrado. Confirme antes de comprar ou solicitar acesso de gestão.'}</p>{!verified ? <div className="mt-6 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => { setVerified(true); toast.success('E-mail confirmado com sucesso.'); }} className="border-2 border-primary bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground">Confirmar e-mail</button><button type="button" onClick={() => toast.success('Novo link de verificação enviado para seu e-mail.')} className="inline-flex items-center gap-2 border-2 border-foreground/40 px-4 py-3 text-xs font-black uppercase"><ArrowClockwise size={15}/> Reenviar link</button></div> : <Link to="/" className="mt-6 inline-flex border-2 border-primary bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground">Continuar</Link>}</section></main>;
}

export function SessionExpired() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const loginHref = redirect?.startsWith('/') && !redirect.startsWith('//') ? '/login?redirect=' + encodeURIComponent(redirect) : '/login';
  return <main className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-4 py-10"><section className="w-full border-4 border-foreground/30 bg-background p-6 text-center sm:p-10"><ArrowClockwise size={34} className="mx-auto text-warning"/><h1 className="mt-4 font-display text-2xl font-black uppercase text-primary sm:text-3xl">Entre novamente para continuar</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-foreground/65">Sua sessão expirou por segurança. O que você estava fazendo foi preservado quando possível.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link to={loginHref} className="border-2 border-primary bg-primary px-4 py-3 text-xs font-black uppercase text-primary-foreground">Fazer login</Link><Link to="/" className="border-2 border-foreground/40 px-4 py-3 text-xs font-black uppercase">Voltar ao início</Link></div></section></main>;
}