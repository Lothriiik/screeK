import { useState } from 'react';
import {
  Sparkle,
  MagnifyingGlass,
  SlidersHorizontal,
  Star,
  CloudArrowUp
} from '@phosphor-icons/react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tag } from '../../components/custom/tag';

export function IntelligenceScreens() {
  const [selectedOnboardingMovies, setSelectedOnboardingMovies] = useState<number[]>([1, 4]);
  const [moodQuery, setMoodQuery] = useState<string>('cult anos 80 < 90 min');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-secondary/10 border-2 border-primary/40 p-6 rounded-xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-primary font-black text-xl">
          <Sparkle size={26} weight="fill" />
          <span>screeK Intelligence — Motor de Recomendação Híbrido</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Arquitetura de Machine Learning em Python combinando <strong>Sentence-BERT + FAISS</strong>, pesos de 12 dimensões, Time Decay e regra Niche Breaker (80/20).
        </p>

        {/* Mood / Natural Language Query Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={moodQuery}
              onChange={(e) => setMoodQuery(e.target.value)}
              placeholder="Exemplo de busca por mood: 'filme curto < 90 min cult dos anos 80'"
              className="w-full bg-background border-2 border-border pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium focus:border-primary outline-none shadow-inner"
            />
          </div>
          <Button className="font-bold">
            <SlidersHorizontal size={16} className="mr-1.5" /> Filtrar com Meilisearch NLP
          </Button>
        </div>
      </div>

      {/* Recommendation Feed (80/20 Rule showcase) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Comfort zone 1 */}
        <div className="bg-card border-2 border-border p-5 rounded-xl space-y-3 shadow-sm hover:border-primary transition-all">
          <div className="flex justify-between items-start">
            <Badge variant="default">MATCH 98%</Badge>
            <Tag>ZONA DE CONFORTO (80%)</Tag>
          </div>
          <div>
            <h3 className="font-black text-lg">Matrix (1999)</h3>
            <p className="text-xs text-muted-foreground">Lana & Lilly Wachowski • Sci-Fi / Cyberpunk • EUA</p>
          </div>
          <div className="text-xs bg-muted/40 p-3 rounded-lg border border-border/80 space-y-1">
            <p className="font-bold text-foreground">💡 Justificativa Matemática:</p>
            <p className="text-muted-foreground">
              Forte afinidade vetorial com a direção das irmãs Wachowski (0.15), tags de Cyberpunk (0.10) e nota 5.0 dada em Speed Racer.
            </p>
          </div>
        </div>

        {/* Card 2: Comfort zone 2 */}
        <div className="bg-card border-2 border-border p-5 rounded-xl space-y-3 shadow-sm hover:border-primary transition-all">
          <div className="flex justify-between items-start">
            <Badge variant="secondary">MATCH 92%</Badge>
            <Tag>ZONA DE CONFORTO (80%)</Tag>
          </div>
          <div>
            <h3 className="font-black text-lg">Blade Runner 2049 (2017)</h3>
            <p className="text-xs text-muted-foreground">Denis Villeneuve • Sci-Fi / Neo-Noir • EUA / UK</p>
          </div>
          <div className="text-xs bg-muted/40 p-3 rounded-lg border border-border/80 space-y-1">
            <p className="font-bold text-foreground">💡 Proximidade Semântica:</p>
            <p className="text-muted-foreground">
              Embedding denso da sinopse no FAISS com distância de cosseno de 0.92 em relação ao seu perfil histórico.
            </p>
          </div>
        </div>

        {/* Card 3: Niche Breaker 20% */}
        <div className="bg-card border-2 border-secondary p-5 rounded-xl space-y-3 shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <Badge variant="destructive">NICHE BREAKER ⭐</Badge>
            <Tag>DESCOBERTA (20%)</Tag>
          </div>
          <div>
            <h3 className="font-black text-lg">Memórias de Matsuko (2006)</h3>
            <p className="text-xs text-muted-foreground">Tetsuya Nakashima • Drama Musical • Japão</p>
          </div>
          <div className="text-xs bg-secondary/10 p-3 rounded-lg border border-secondary/30 space-y-1">
            <p className="font-bold text-secondary">🌐 Controle de Bolha (80/20):</p>
            <p className="text-foreground/80">
              Filme aclamado internacionalmente injetado fora da sua bolha de Sci-Fi para promover descoberta de novas estéticas cinematográficas.
            </p>
          </div>
        </div>
      </div>

      {/* Split Section: Onboarding & Letterboxd CSV Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Onboarding Flow Card */}
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-black text-lg flex items-center gap-2">
                <Star size={20} className="text-primary" weight="fill" />
                Onboarding Interativo
              </h3>
              <p className="text-xs text-muted-foreground">Calibração do vetor inicial de preferências do novo usuário</p>
            </div>
            <Badge variant="default">PASSO 1</Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Selecione de 3 a 5 filmes para inicializar sua conta com recomendações personalizadas:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 1, title: 'Speed Racer', year: 2008, genre: 'Sci-Fi / Ação' },
              { id: 2, title: 'Parasita', year: 2019, genre: 'Thriller Coreano' },
              { id: 3, title: 'In The Mood For Love', year: 2000, genre: 'Romance HK' },
              { id: 4, title: 'Duna: Parte 2', year: 2024, genre: 'Sci-Fi Épico' },
              { id: 5, title: 'Retrato de uma Jovem', year: 2019, genre: 'Drama Francês' },
              { id: 6, title: 'Chainsaw Man: Reze', year: 2025, genre: 'Anime Ação' },
            ].map((m) => {
              const isSelected = selectedOnboardingMovies.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedOnboardingMovies(selectedOnboardingMovies.filter((id) => id !== m.id));
                    } else {
                      setSelectedOnboardingMovies([...selectedOnboardingMovies, m.id]);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-muted-foreground">{m.year}</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary text-white text-[9px]' : 'border-border'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight line-clamp-1">{m.title}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{m.genre}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 text-xs">
            <span className="text-muted-foreground font-semibold">
              {selectedOnboardingMovies.length} de 3 selecionados
            </span>
            <Button size="sm" disabled={selectedOnboardingMovies.length < 3}>
              Calibrar Perfil
            </Button>
          </div>
        </div>

        {/* Letterboxd Import Flow Card */}
        <div className="bg-card border-2 border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-black text-lg flex items-center gap-2">
                <CloudArrowUp size={20} className="text-green-600" weight="bold" />
                Importação do Letterboxd
              </h3>
              <p className="text-xs text-muted-foreground">Upload de ratings.csv com processamento assíncrono</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600/40">CSV PARSER</Badge>
          </div>

          {/* Dropzone mockup */}
          <div className="border-2 border-dashed border-border hover:border-primary transition-all p-6 rounded-lg text-center space-y-2 bg-muted/10 cursor-pointer">
            <CloudArrowUp size={36} className="mx-auto text-primary" />
            <p className="font-bold text-xs">Arraste seu arquivo ratings.csv aqui</p>
            <p className="text-[11px] text-muted-foreground">ou clique para procurar no seu computador</p>
            <Badge variant="secondary" className="text-[10px]">Normalização 0.5 a 5.0 ⭐</Badge>
          </div>

          {/* Simulated Parser stats */}
          <div className="bg-muted/20 border border-border p-3 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between font-bold">
              <span>Processador em Segundo Plano:</span>
              <span className="text-green-600 font-bold">Ativo & Otimizado</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cruza títulos com o TMDB, aplica decaimento temporal nas notas antigas e gera o feed sem travar o app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
