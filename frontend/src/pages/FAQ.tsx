import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Question, ArrowLeft, CaretDown, CaretUp, MagnifyingGlass } from '@phosphor-icons/react';

const FAQ_ITEMS = [
  {
    question: 'Como funciona o ingresso digital com QR Code no screeK?',
    answer:
      'Após concluir o pagamento via PIX ou Cartão, seu ingresso fica imediatamente disponível na aba "Meus Ingressos". Basta apresentar o QR Code gerado na catraca ou leitor do cinema parceiro para entrar na sala.',
  },
  {
    question: 'Posso cancelar meu ingresso e receber reembolso?',
    answer:
      'Sim! O cancelamento com estorno integral pode ser solicitado diretamente no aplicativo até 2 horas antes do horário de início da sessão.',
  },
  {
    question: 'Como o screeK Intelligence gera recomendações?',
    answer:
      'Nosso algoritmo utiliza cálculo vetorial de similaridade por cosseno com pesos ponderados (diretores, gêneros, elenco, estética) somado à regra 80/20 de "Niche Breakers", apresentando títulos de alta afinidade e joias para quebrar a bolha cinéfila.',
  },
  {
    question: 'Como importar minhas notas do Letterboxd?',
    answer:
      'Acesse a página "Importar Letterboxd" (/import), faça o upload do seu arquivo ratings.csv exportado do Letterboxd e o sistema calibrará automaticamente suas preferências com nosso acervo.',
  },
  {
    question: 'Como comprovar a meia-entrada no cinema?',
    answer:
      'Apresente seu documento de identidade com foto acompanhado da carteirinha de estudante (DNE), comprovante de benefício social ou documento profissional válido para sua categoria na entrada da sala.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const categories = ['Todas', 'Ingressos', 'Pagamento', 'Conta', 'Comunidade', 'IA & recomendações'];
  const categoryTerms: Record<string, string[]> = {
    Ingressos: ['ingresso', 'qr code', 'cancelar', 'meia-entrada'],
    Pagamento: ['pagamento', 'reembolso', 'cancelar'],
    Conta: ['conta', 'dados', 'senha'],
    Comunidade: ['lista', 'comunidade'],
    'IA & recomendações': ['recomendações', 'intelligence'],
  };
  const visibleItems = FAQ_ITEMS.filter((item) => {
    const text = `${item.question} ${item.answer}`.toLocaleLowerCase('pt-BR');
    const matchesQuery = !query.trim() || text.includes(query.trim().toLocaleLowerCase('pt-BR'));
    const terms = categoryTerms[category];
    return matchesQuery && (!terms || terms.some((term) => text.includes(term)));
  });

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
            Perguntas Frequentes (FAQ)
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/70">
            Tire suas dúvidas sobre compra de ingressos, catracas, sessões e recursos da comunidade.
          </p>
        </div>
      </section>

      {/* Accordion List */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-10 space-y-4">
        <label className="relative block">
          <MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar uma dúvida: cancelar, QR Code, meia-entrada..." className="h-11 w-full border-2 border-primary bg-background pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`border-2 px-3 py-1.5 text-[10px] font-black uppercase ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30 hover:border-primary'}`}>{item}</button>)}
        </div>
        {visibleItems.length === 0 && <p className="border-2 border-dashed border-foreground/30 p-8 text-center text-sm text-foreground/60">Nenhuma dúvida encontrada. Fale com o suporte para receber ajuda.</p>}
        {visibleItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className="bg-background border-4 border-foreground/30 shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-black uppercase text-xs sm:text-sm hover:text-primary transition-colors cursor-pointer"
              >
                <span>{item.question}</span>
                {isOpen ? <CaretUp size={18} weight="bold" className="shrink-0" /> : <CaretDown size={18} weight="bold" className="shrink-0" />}
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 pt-0 font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed border-t border-foreground/10 bg-muted/10">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}

        {/* Support CTA */}
        <div className="p-6 bg-primary/10 border-2 border-primary mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black uppercase text-sm text-foreground">Ainda precisa de ajuda?</h3>
            <p className="font-sans text-xs text-foreground/70">Nossa equipe de suporte está à disposição.</p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--border)] hover:bg-primary/90 transition-all"
          >
            Falar com Suporte
          </Link>
        </div>

      </main>
    </div>
  );
}
