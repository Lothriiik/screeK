import { Link } from 'react-router-dom';
import { LockKey, ArrowLeft } from '@phosphor-icons/react';

export function Privacy() {
  return (
    <div className="bg-background text-foreground font-display">
      
      {/* Header */}
      <section className="bg-background border-b-2 border-foreground/20 px-4 sm:px-0 py-10">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para o Início</span>
          </Link>

          <div className="flex items-center gap-2 text-secondary">
            <LockKey size={28} weight="bold" />
            <span className="text-xs font-black uppercase tracking-wider">Segurança &amp; LGPD</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase text-foreground tracking-tight">
            Política de Privacidade
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/60">
            Em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-10 space-y-8 font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed">
        
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            1. Informações que Coletamos
          </h2>
          <p>
            Coletamos apenas as informações necessárias para prestar nossos serviços com excelência:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Dados Cadastrais:</strong> Nome, endereço de e-mail, nome de usuário (@) e cidade de preferência.</li>
            <li><strong>Dados de Pagamento:</strong> Processados de forma criptografada por gateways certificados (PCI-DSS); o screeK não armazena números de cartões.</li>
            <li><strong>Preferências Cinéfilas:</strong> Filmes avaliados, histórico de sessões e listas, utilizados para treinar o algoritmo screeK Intelligence.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            2. Como Usamos Seus Dados
          </h2>
          <p>
            Seus dados são utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Emissão e validação de ingressos e QR Codes nas catracas dos cinemas parceiros.</li>
            <li>Geração de recomendações personalizadas com base na similaridade de vetores de gosto.</li>
            <li>Envio de notificações sobre ingressos adquiridos, lembretes de sessão e lançamentos favoritos.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-black uppercase font-display text-foreground">
            3. Seus Direitos e Controle de Privacidade
          </h2>
          <p>
            Você pode a qualquer momento exportar seus dados, tornar seu perfil público ou privado, desativar notificações ou solicitar a exclusão definitiva de sua conta através da tela de <strong>Configurações de Perfil</strong>.
          </p>
        </section>

      </main>
    </div>
  );
}
