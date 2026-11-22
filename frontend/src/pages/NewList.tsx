import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarksSimple,
  MagnifyingGlass,
  Plus,
  Trash,
  Check,
  Lock,
  Globe,
  FilmStrip
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIES } from '../mocks';
import type { Movie } from '../types/movie';
import { TagInput } from '../components/custom/tag-input';

export function NewList() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['sci-fi', 'cult']);
  const [isPrivate, setIsPrivate] = useState(false);

  // Movie search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([MOCK_MOVIES[0], MOCK_MOVIES[1]]);

  const searchResults = searchQuery.trim()
    ? MOCK_MOVIES.filter(
        (m) =>
          !selectedMovies.some((sm) => sm.id === m.id) &&
          (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.directors.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : [];

  const handleAddMovie = (movie: Movie) => {
    setSelectedMovies([...selectedMovies, movie]);
    setSearchQuery('');
  };

  const handleRemoveMovie = (id: string) => {
    setSelectedMovies(selectedMovies.filter((m) => m.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Informe um título para a sua lista.');
      return;
    }
    if (selectedMovies.length === 0) {
      toast.error('Adicione pelo menos um filme à sua lista.');
      return;
    }

    toast.success(`Lista "${title}" criada com sucesso!`);
    navigate('/lists');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. HEADER ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          
          <button
            type="button"
            onClick={() => navigate('/lists')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background text-foreground border-2 border-foreground/40 text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar para Listas</span>
          </button>

          <div className="flex items-center gap-2">
            <BookmarksSimple size={26} weight="bold" className="text-primary" />
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-foreground tracking-tight">
              Criar Nova Lista
            </h1>
          </div>

        </div>
      </section>

      {/* ─── 2. FORM BODY ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Metadata Section */}
          <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
            <h2 className="text-base font-black uppercase text-foreground border-b-2 border-foreground/10 pb-2">
              1. Detalhes da Coleção
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-foreground/70">
                  Título da Lista *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Melhores Ficções Científicas dos Anos 2000"
                  className="w-full h-11 px-3.5 bg-background border-2 border-foreground/30 font-sans text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/40"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-foreground/70">
                  Descrição / Notas Curatórias
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o conceito ou critério desta lista..."
                  className="w-full p-3 bg-background border-2 border-foreground/30 font-sans text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/40 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase text-foreground/70">
                  Tags
                </label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {/* Privacy Setting */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-black uppercase text-foreground/70">
                  Visibilidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 p-3 border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      !isPrivate
                        ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)] font-black text-xs uppercase'
                        : 'bg-background text-foreground/70 border-foreground/30 font-bold text-xs uppercase hover:bg-muted'
                    }`}
                  >
                    <Globe size={18} weight="bold" />
                    <span>Pública (Feed &amp; Perfil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 p-3 border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isPrivate
                        ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)] font-black text-xs uppercase'
                        : 'bg-background text-foreground/70 border-foreground/30 font-bold text-xs uppercase hover:bg-muted'
                    }`}
                  >
                    <Lock size={18} weight="bold" />
                    <span>Privada (Apenas Você)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add Movies Section */}
          <div className="bg-background border-4 border-foreground/40 shadow-[6px_6px_0px_0px_var(--border)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
              <h2 className="text-base font-black uppercase text-foreground">
                2. Adicionar Filmes ({selectedMovies.length})
              </h2>
              <span className="text-xs text-foreground/50 font-sans">
                Busque pelo título ou diretor
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass
                size={18}
                weight="bold"
                className="absolute left-3.5 top-3.5 text-foreground/50 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digitar nome de um filme para adicionar..."
                className="w-full h-11 pl-10 pr-4 bg-background border-2 border-foreground/30 font-sans text-xs sm:text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/40"
              />

              {/* Autosuggest dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-12 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_var(--border)] z-20 max-h-60 overflow-y-auto divide-y divide-foreground/10">
                  {searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => handleAddMovie(movie)}
                      className="w-full p-2.5 flex items-center justify-between hover:bg-muted text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-8 aspect-[2/3] object-cover border border-foreground/40 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-black uppercase text-foreground">{movie.title}</h4>
                          <span className="text-[10px] text-foreground/60 font-sans">
                            {movie.release_year} • {movie.directors.join(', ')}
                          </span>
                        </div>
                      </div>
                      <Plus size={16} weight="bold" className="text-primary shrink-0 mr-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Movies List */}
            {selectedMovies.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-foreground/30 text-center space-y-2">
                <FilmStrip size={32} className="text-foreground/30 mx-auto" />
                <p className="text-xs font-bold text-foreground/60 font-sans">
                  Nenhum filme selecionado. Use o campo acima para buscar filmes.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedMovies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="p-3 bg-muted/20 border-2 border-foreground/20 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-black text-foreground/40 w-4 text-center">
                        {index + 1}
                      </span>
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-10 aspect-[2/3] object-cover border border-foreground/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase text-foreground truncate">
                          {movie.title}
                        </h4>
                        <span className="text-[10px] text-foreground/60 font-sans block truncate">
                          {movie.release_year} • {movie.genres.join(', ')} • {movie.directors.join(', ')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMovie(movie.id)}
                      className="p-2 text-foreground/50 hover:text-red-500 hover:bg-background border border-transparent hover:border-red-400 transition-colors cursor-pointer"
                      title="Remover filme"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/lists')}
              className="px-5 py-2.5 bg-background hover:bg-muted border-2 border-foreground text-foreground font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground border-2 border-primary font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[3px_3px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Check size={16} weight="bold" />
              <span>Salvar Lista</span>
            </button>
          </div>

        </form>
      </main>

    </div>
  );
}
