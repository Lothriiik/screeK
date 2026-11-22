import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Info, UploadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  intelligenceService,
  type LetterboxdImportJob,
  type ImportFailure,
} from '../services/intelligenceService';

const SOURCE_LABELS: Record<ImportFailure['source'], string> = {
  ratings: 'Avaliação',
  watched: 'Assistido',
  likes: 'Curtida',
  watchlist: 'Watchlist',
};

const stageLabel: Record<LetterboxdImportJob['stage'], string> = {
  queued: 'Na fila',
  matching: 'Localizando filmes no catálogo e no TMDB',
  saving: 'Salvando os dados na sua conta',
  complete: 'Importação concluída',
  failed: 'Importação interrompida',
};

export function LetterboxdImport() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<LetterboxdImportJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifiedJob = useRef<string | null>(null);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;

    let active = true;
    let timer: number;
    const poll = async () => {
      try {
        const latest = await intelligenceService.getLetterboxdImportStatus(job.job_id);
        if (!active) return;
        setJob(latest);
      } catch {
        if (active) setError('Não consegui atualizar o andamento. A importação continua no servidor; tentando consultar novamente.');
      }
      if (active) timer = window.setTimeout(poll, 1200);
    };
    timer = window.setTimeout(poll, 1200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [job?.job_id, job?.status]);

  useEffect(() => {
    if (!job || (job.status !== 'completed' && job.status !== 'failed')) return;
    if (notifiedJob.current === job.job_id) return;
    notifiedJob.current = job.job_id;

    if (job.status === 'failed') {
      toast.error(job.error || 'A importação falhou.');
    } else if ((job.summary?.errors?.length || 0) > 0 || (job.summary?.failed_items?.length || 0) > 0) {
      toast.warning('Importação concluída com alguns itens para revisar.');
    } else {
      toast.success('Histórico do Letterboxd importado.');
    }
  }, [job]);

  const handleFileChange = (selected: File | undefined) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Selecione o ZIP completo exportado pelo Letterboxd.');
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError('O ZIP precisa ter no máximo 50 MB.');
      return;
    }
    setError(null);
    setFile(selected);
    setJob(null);
  };

  const startImport = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const started = await intelligenceService.startLetterboxdImport(file);
      setJob(started);
      if (started.status === 'running' || started.status === 'pending') {
        toast.info('Importação iniciada. Você pode acompanhar o progresso nesta tela.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível iniciar a importação.');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = job?.summary;
  const failedItems = summary?.failed_items || [];
  const categories = [
    ['ratings', 'Avaliações'],
    ['watched', 'Assistidos'],
    ['likes', 'Curtidas'],
    ['watchlist', 'Watchlist'],
  ] as const;
  const visibleFailures = failedItems.slice(0, 100);

  return (
    <div className="bg-background text-foreground font-display">
      <section className="bg-background px-4 sm:px-0 py-8">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={24} weight="bold" className="text-secondary" />
            <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
              screeK Intelligence • Integrações
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Importar Histórico do Letterboxd
          </h1>
          <p className="font-sans text-sm text-foreground/80 leading-relaxed max-w-2xl">
            Envie o ZIP exportado pelo Letterboxd. O histórico será associado à sua conta e você poderá acompanhar o matching e a gravação dos dados.
          </p>
        </div>
      </section>

      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-6">
        <div className="bg-muted/20 border-2 border-foreground/20 p-4 flex gap-3.5 items-start">
          <Info size={22} weight="bold" className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-sans text-foreground/80">
            <h4 className="font-display font-black uppercase text-foreground">Como exportar</h4>
            <p>No Letterboxd, acesse <strong>Settings &gt; Data &gt; Export Your Data</strong> e envie o ZIP baixado. Não precisa descompactar.</p>
          </div>
        </div>

        <section className="bg-background border-4 border-dashed border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 border-2 border-primary mx-auto flex items-center justify-center text-primary">
            <UploadSimple size={32} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase">{file?.name || 'Selecione o ZIP do Letterboxd'}</h3>
            <p className="font-sans text-xs text-foreground/60">Até 50 MB • ratings, assistidos, curtidas e watchlist</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <label className="px-5 py-2.5 bg-background hover:bg-muted border-2 border-foreground/40 font-black text-xs uppercase cursor-pointer">
              Escolher ZIP
              <input type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => handleFileChange(event.target.files?.[0])} />
            </label>
            <button
              type="button"
              onClick={startImport}
              disabled={!file || submitting || (!!job && (job.status === 'pending' || job.status === 'running'))}
              className="px-5 py-2.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase disabled:opacity-50"
            >
              {submitting ? 'Enviando…' : 'Iniciar importação'}
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive font-semibold">{error}</p>}
        </section>

        {job && (
          <section className="bg-background border-4 border-foreground/30 shadow-[6px_6px_0px_0px_var(--border)] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-black uppercase">Andamento da importação</h2>
              <span className="text-xs font-mono uppercase">{job.status === 'completed' ? 'Concluída' : job.status === 'failed' ? 'Falhou' : 'Em andamento'}</span>
            </div>
            <p className="text-sm text-foreground/70">{stageLabel[job.stage]}{job.total > 0 ? ` • ${job.processed}/${job.total}` : ''}</p>
            <div className="w-full h-3 bg-black/20 border border-foreground/30 overflow-hidden" aria-label={`Progresso ${job.percent}%`}>
              <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${job.percent}%` }} />
            </div>
            <p className="text-right text-xs font-mono font-bold">{job.percent}%</p>
            {job.error && <p role="alert" className="text-sm text-destructive">{job.error}</p>}

            {summary && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map(([key, label]) => {
                    const item = summary[key];
                    if (!item) return null;
                    return (
                      <div key={key} className="p-3 bg-muted/20 border-2 border-foreground/20 text-center">
                        <span className="block text-lg font-black font-mono">{item.success}/{item.total}</span>
                        <span className="block text-[10px] font-black uppercase text-foreground/60">{label} • {item.failed} falhas</span>
                      </div>
                    );
                  })}
                </div>

                {failedItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <h3 className="font-black uppercase text-sm">Itens para revisar ({failedItems.length}{summary.failed_items_truncated ? '+' : ''})</h3>
                      <p className="text-xs text-foreground/60">Pesquise pelo título e ano no catálogo para localizar manualmente.</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto border-2 border-foreground/20 divide-y divide-foreground/10">
                      {visibleFailures.map((item, index) => (
                        <div key={`${item.source}-${item.name}-${item.year}-${index}`} className="p-3 flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-semibold">{item.name} ({item.year})</span>
                          <span className="text-xs text-foreground/60">{SOURCE_LABELS[item.source]} • {item.reason}</span>
                        </div>
                      ))}
                    </div>
                    {(failedItems.length > visibleFailures.length || summary.failed_items_truncated) && (
                      <p className="text-xs text-foreground/60">Exibindo os primeiros {visibleFailures.length}; a lista completa ultrapassou o limite de exibição.</p>
                    )}
                  </div>
                )}

                {summary.errors?.map((message, index) => (
                  <p key={index} className="text-xs text-destructive">{message}</p>
                ))}
              </>
            )}
          </section>
        )}

        <div className="flex justify-end">
          <Link to="/intelligence" className="px-5 py-2.5 bg-background hover:bg-muted border-2 border-foreground/40 font-black text-xs uppercase">
            Ir para Intelligence
          </Link>
        </div>
      </main>
    </div>
  );
}
