import { useState, type FormEvent } from 'react';
import { Buildings, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_CINEMAS } from '../mocks/cinemas';

const control = 'h-11 w-full border-2 border-foreground/35 bg-background px-3 text-sm outline-none focus:border-primary';

export function ManagementAccessRequest() {
  const [sent, setSent] = useState(false);
  const [cinemaId, setCinemaId] = useState(MOCK_CINEMAS[0]?.id ?? '');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    toast.success('Solicitação registrada e enviada para análise.');
  };

  return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-0">
    <div><h1 className="font-display text-3xl font-black uppercase text-primary sm:text-4xl">Solicitar acesso de gestor</h1><p className="mt-2 max-w-2xl text-sm text-foreground/65">Informe sua relação com a unidade. A equipe screeK revisa os dados antes de conceder qualquer permissão.</p></div>
    {sent ? <section className="border-4 border-success/50 bg-success/5 p-6 sm:p-8"><CheckCircle size={32} className="text-success"/><h2 className="mt-3 font-display text-xl font-black uppercase">Pedido enviado para análise</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/65">A solicitação fica vinculada apenas ao cinema escolhido. O status e as atualizações chegam por e-mail e aparecem na sua conta.</p><button type="button" onClick={() => setSent(false)} className="mt-5 border-2 border-foreground/40 px-4 py-2 text-xs font-black uppercase">Enviar outro pedido</button></section> : <form onSubmit={submit} className="space-y-5 border-4 border-foreground/30 bg-background p-5 sm:p-7">
      <div className="flex items-start gap-3 border-l-4 border-primary bg-muted/20 p-3 text-xs leading-relaxed text-foreground/70"><ShieldCheck size={18} className="shrink-0 text-primary"/><span>O pedido não concede acesso automaticamente. Cada unidade e função são aprovadas após conferência da equipe.</span></div>
      <label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Cinema</span><select required value={cinemaId} onChange={(event) => setCinemaId(event.target.value)} className={control}>{MOCK_CINEMAS.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Seu nome completo</span><input required autoComplete="name" className={control}/></label><label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Cargo na unidade</span><select required className={control} defaultValue=""><option value="" disabled>Selecione</option><option>Proprietário / sócio</option><option>Gerente da unidade</option><option>Equipe de operações</option><option>Financeiro</option></select></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[10px] font-black uppercase">CNPJ da empresa</span><input required inputMode="numeric" placeholder="00.000.000/0000-00" className={control}/></label><label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Telefone de contato</span><input required type="tel" autoComplete="tel" placeholder="(00) 0000-0000" className={control}/></label></div>
      <label className="block"><span className="mb-1 block text-[10px] font-black uppercase">E-mail corporativo</span><input required type="email" autoComplete="email" placeholder="nome@empresa.com.br" className={control}/></label>
      <label className="block"><span className="mb-1 block text-[10px] font-black uppercase">Observações e comprovação do vínculo</span><textarea required rows={4} placeholder="Descreva sua responsabilidade e como confirmar o vínculo com esta unidade." className="w-full resize-y border-2 border-foreground/35 bg-background p-3 text-sm outline-none focus:border-primary"/></label>
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 border-2 border-primary bg-primary px-5 text-xs font-black uppercase text-primary-foreground"><Buildings size={16}/> Enviar para análise</button>
    </form>}
  </main>;
}
