import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Info } from '@phosphor-icons/react';

export function Terms() {
  return (
    <div className="bg-background text-foreground font-display">
      
      {/* Header */}
      <section className="bg-background page-divider px-4 sm:px-0 py-10">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para o Início</span>
          </Link>

          <h1 className="text-3xl sm:text-5xl font-black uppercase text-primary tracking-tight">
            Termos de Uso
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/60">
            Última atualização: 21 de Agosto de 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 font-sans text-xs leading-relaxed text-foreground/80 sm:px-0 md:grid-cols-[190px_minmax(0,1fr)] sm:text-sm">
        <nav aria-label="Nesta página" className="h-fit border-l-2 border-foreground/20 md:sticky md:top-24">
          <span className="mb-2 block px-3 text-[9px] font-black uppercase tracking-wider text-foreground/50">Nesta página</span>
          {['Objeto e serviços', 'Cadastro e responsabilidades', 'Compra e cancelamento', 'Meia-entrada', 'Conduta na comunidade'].map((label, index) => <a key={label} href={`#termo-${index + 1}`} className="block border-l-2 border-transparent px-3 py-2 text-[10px] font-bold hover:border-primary hover:bg-muted/30 hover:text-primary">{index + 1}. {label}</a>)}
        </nav>
        <div className="max-w-3xl space-y-7">
        
        <div className="p-4 bg-muted/20 border-2 border-foreground/20 flex gap-3 items-start">
          <Info size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs">
            Ao utilizar a plataforma <strong>screeK</strong>, você concorda com os termos descritos abaixo. Leia atentamente para entender seus direitos e responsabilidades.
          </p>
        </div>

        <section id="termo-1" className="scroll-mt-24 space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            1. Objeto e Serviços Oferecidos
          </h2>
          <p>
            O <strong>screeK</strong> é uma plataforma integrada de entretenimento cinematográfico que permite aos usuários explorar acervos de filmes, consultar programações de cinemas parceiros, adquirir ingressos digitais, gerenciar listas personalizadas e participar de uma rede social cinéfila.
          </p>
        </section>

        <section id="termo-2" className="scroll-mt-24 space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            2. Cadastro e Responsabilidades do Usuário
          </h2>
          <p>
            Para realizar compras de ingressos e interagir na rede social, é necessário criar uma conta com dados verídicos e atualizados. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas através de sua conta.
          </p>
        </section>

        <section id="termo-3" className="scroll-mt-24 space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            3. Compra de Ingressos e Cancelamento
          </h2>
          <p>
            A compra de ingressos digitais é processada em tempo real com garantia de reserva de assento durante o checkout (10 minutos). O cancelamento e reembolso integral de ingressos podem ser solicitados até <strong>2 horas antes do início da sessão</strong>, diretamente pela aba <em>Meus Ingressos</em>.
          </p>
        </section>

        <section id="termo-4" className="scroll-mt-24 space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            4. Regras de Meia-Entrada e Benefícios
          </h2>
          <p>
            A comprovação do direito ao benefício de meia-entrada (estudantes, idosos, jovens de baixa renda, professores e PCDs) é obrigatória na entrada da sala de cinema parceira, conforme legislação federal vigente. A ausência de documento comprobatório impedirá o acesso sem direito a reembolso imediato.
          </p>
        </section>

        <section id="termo-5" className="scroll-mt-24 space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            5. Conduta na Comunidade Social
          </h2>
          <p>
            É expressamente proibida a publicação de conteúdos que promovam discurso de ódio, assédio, spoilers não sinalizados maliciosamente ou violação de direitos autorais. O descumprimento pode levar à suspensão temporária ou cancelamento definitivo da conta.
          </p>
        </section>

        </div>
      </main>
    </div>
  );
}
