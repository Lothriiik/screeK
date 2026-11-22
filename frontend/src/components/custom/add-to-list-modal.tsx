import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BookmarksSimple, Plus, Check, Lock, Globe } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_MOVIE_LISTS } from '../../mocks/lists';
import type { Movie } from '../../types/movie';
import type { MovieList } from '../../types/social';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, movie }) => {
  const [lists, setLists] = useState<MovieList[]>(MOCK_MOVIE_LISTS);
  const [selectedListIds, setSelectedListIds] = useState<string[]>(() => {
    return MOCK_MOVIE_LISTS.filter((l) => l.movie_ids.includes(movie.id)).map((l) => l.id);
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListTag, setNewListTag] = useState('');

  const toggleList = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    );
  };

  const handleSave = () => {
    // Atualiza listas mock em memória
    setLists((prev) =>
      prev.map((l) => {
        const shouldHave = selectedListIds.includes(l.id);
        const has = l.movie_ids.includes(movie.id);
        if (shouldHave && !has) {
          return { ...l, movie_ids: [...l.movie_ids, movie.id] };
        }
        if (!shouldHave && has) {
          return { ...l, movie_ids: l.movie_ids.filter((id) => id !== movie.id) };
        }
        return l;
      })
    );

    toast.success(`Filme "${movie.title}" atualizado nas suas listas!`);
    onClose();
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) {
      toast.error('Dê um título para a nova lista.');
      return;
    }

    const createdList: MovieList = {
      id: `list-${Date.now()}`,
      title: newListTitle.trim(),
      description: 'Lista personalizada criada no screeK',
      author_id: 'usr-1',
      author_name: 'Lothrik Junior',
      author_username: 'lothrik',
      author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      is_private: false,
      likes_count: 0,
      movie_ids: [movie.id],
      tags: newListTag.trim() ? [newListTag.trim().toLowerCase().replace(/^#/, '')] : ['cinema'],
      created_at: new Date().toISOString().split('T')[0],
      backdrop_url: movie.backdrop_url,
    };

    setLists((prev) => [createdList, ...prev]);
    setSelectedListIds((prev) => [...prev, createdList.id]);
    setNewListTitle('');
    setNewListTag('');
    setIsCreating(false);
    toast.success(`Lista "${createdList.title}" criada e filme adicionado!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-background border-4 border-foreground text-foreground p-6 shadow-[8px_8px_0px_0px_var(--border)] rounded-none font-display">
        <DialogHeader className="border-b-2 border-foreground/20 pb-3">
          <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
            <BookmarksSimple size={22} weight="bold" className="text-primary" />
            <span>Adicionar a uma Lista</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-sans pt-0.5">
            Filme selecionado: <strong className="text-foreground">{movie.title}</strong> ({movie.release_year})
          </p>
        </DialogHeader>

        {/* List of user's lists */}
        <div className="space-y-2 py-3 max-h-60 overflow-y-auto pr-1">
          {lists.map((list) => {
            const isChecked = selectedListIds.includes(list.id);
            return (
              <div
                key={list.id}
                onClick={() => toggleList(list.id)}
                className={`p-3 border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_var(--primary)]'
                    : 'border-border bg-card hover:bg-muted'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                    {list.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>{list.movie_ids.length} filmes</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {list.is_private ? <Lock size={10} /> : <Globe size={10} />}
                      {list.is_private ? 'Privada' : 'Pública'}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${
                    isChecked
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-foreground/40 bg-background'
                  }`}
                >
                  {isChecked && <Check size={14} weight="bold" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick create inline form */}
        {isCreating ? (
          <form onSubmit={handleCreateList} className="p-3 bg-muted border-2 border-border space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-primary">
              Nova Coleção Rápida
            </span>
            <Input
              type="text"
              placeholder="Título da lista..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              className="text-xs h-9 bg-background"
              autoFocus
            />
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="#tag (ex: terror, cult)"
                value={newListTag}
                onChange={(e) => setNewListTag(e.target.value)}
                className="text-xs h-9 bg-background flex-1"
              />
              <Button type="submit" size="sm" className="font-black text-xs uppercase shrink-0">
                Criar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="text-xs uppercase shrink-0"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 border border-dashed border-foreground/40 hover:border-primary text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-primary"
          >
            <Plus size={14} weight="bold" />
            <span>Criar Nova Lista</span>
          </button>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t-2 border-border pt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="uppercase font-black text-xs">
            Cancelar
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} className="uppercase font-black text-xs">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
