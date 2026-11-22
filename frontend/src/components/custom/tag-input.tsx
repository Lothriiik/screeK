import React, { useState, type KeyboardEvent } from 'react';
import { TagChip } from './tag-chip';
import { Hash, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  suggestions?: string[];
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  maxTags = 8,
  suggestions = ['sci-fi', 'cult', 'imax', 'horror', 'anos-80', 'animacao', 'brasil', 'festival'],
  placeholder = 'Adicionar tag e apertar Enter...',
}) => {
  const [inputVal, setInputVal] = useState('');

  const cleanTag = (val: string) => {
    return val
      .trim()
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleAdd = (tagToAdd: string) => {
    const cleaned = cleanTag(tagToAdd);
    if (!cleaned || tags.includes(cleaned) || tags.length >= maxTags) return;
    onChange([...tags, cleaned]);
    setInputVal('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(tags.filter((_, i) => i !== indexToRemove));
  };

  const availableSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[46px] p-2 bg-card border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] focus-within:border-primary focus-within:shadow-[3px_3px_0px_0px_var(--primary)] transition-all">
        {tags.map((tag, idx) => (
          <TagChip key={tag} tag={tag} onRemove={() => handleRemove(idx)} size="sm" />
        ))}

        {tags.length < maxTags && (
          <div className="flex items-center flex-1 min-w-[140px]">
            <Hash className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => inputVal && handleAdd(inputVal)}
              placeholder={tags.length === 0 ? placeholder : 'Outra tag...'}
              className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        )}
      </div>

      {availableSuggestions.length > 0 && tags.length < maxTags && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <span className="font-semibold text-[11px] uppercase tracking-wider">Sugestões:</span>
          {availableSuggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleAdd(s)}
              className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border bg-muted/40 hover:bg-primary/20 hover:text-primary transition-colors text-[11px] font-mono"
            >
              <Plus className="h-2.5 w-2.5" />
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
