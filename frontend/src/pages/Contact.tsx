import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeSimple, ChatTeardropText, ArrowLeft, CheckCircle, Buildings } from '@phosphor-icons/react';
import { toast } from 'sonner';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Dúvida sobre Ingressos');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Preencha todos os campos para enviar sua mensagem.');
      return;
    }

    setIsSent(true);
    toast.success('Mensagem enviada com sucesso! Responderemos em até 24 horas.');
  };

  return (
    <div className="bg-background text-foreground font-display">
      
      {/* Header */}
      <section className="bg-background px-4 sm:px-0 py-10">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para o Início</span>
          </Link>

          <div className="flex items-center gap-2 text-secondary">
            <ChatTeardropText size={28} weight="bold" />
            <span className="text-xs font-black uppercase tracking-wider">Suporte &amp; Contato</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase text-foreground tracking-tight">
            Fale com a Equipe screeK
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/70">
            Dúvidas sobre ingressos, parcerias com cinemas ou suporte técnico.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Form Column */}
        <div className="md:col-span-7 bg-background border-4 border-foreground/40 p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--border)]">
          {isSent ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-[#34A853]/10 border-2 border-[#34A853] text-[#34A853] mx-auto flex items-center justify-center">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h3 className="text-lg font-black uppercase text-foreground">Mensagem Enviada!</h3>
              <p className="font-sans text-xs text-foreground/70 max-w-sm mx-auto">
                Obrigado pelo contato. Um de nossos especialistas retornará para o email <strong>{email}</strong> em breve.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setMessage('');
                }}
                className="px-5 py-2 bg-primary text-primary-foreground font-black text-xs uppercase"
              >
                Enviar Outra Mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-foreground">Seu Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full h-11 px-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-foreground">Seu E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-11 px-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-foreground">Assunto</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Dúvida sobre Ingressos">Dúvida sobre Ingressos e Cancelamento</option>
                  <option value="Suporte Técnico">Problema no Aplicativo / Conta</option>
                  <option value="Parceria B2B">Sou um Cinema e quero fazer parceria</option>
                  <option value="Sugestão">Sugestão de Funcionalidade ou Acervo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-foreground">Mensagem</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva detalhadamente sua dúvida ou solicitação..."
                  className="w-full p-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Enviar Mensagem
              </button>
            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-background border-4 border-foreground/40 p-5 space-y-3 shadow-[4px_4px_0px_0px_var(--border)]">
            <h3 className="text-sm font-black uppercase text-foreground">Atendimento Direto</h3>
            <div className="space-y-2 text-xs font-sans text-foreground/80">
              <div className="flex items-center gap-2">
                <EnvelopeSimple size={16} weight="bold" className="text-primary shrink-0" />
                <span>suporte@screek.com.br</span>
              </div>
              <div className="flex items-center gap-2">
                <Buildings size={16} weight="bold" className="text-secondary shrink-0" />
                <span>cinemas@screek.com.br (Parcerias B2B)</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 border-2 border-foreground/20 p-5 space-y-2">
            <h4 className="text-xs font-black uppercase text-foreground">Horário de Atendimento</h4>
            <p className="font-sans text-xs text-foreground/70 leading-relaxed">
              Segunda a Domingo, das 09h às 23h (suporte especial para sessões noturnas nos cinemas parceiros).
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
