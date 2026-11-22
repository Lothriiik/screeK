import React from 'react';
import { Link } from 'react-router-dom';

interface TagChipProps {
  tag: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  asLink?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  active = false,
  onRemove,
  onClick,
  asLink = false,
  size = 'md',
  className = '',
}) => {
  const formattedTag = tag.replace(/^#/, '');
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  const baseClasses = `inline-flex items-center gap-1 font-display font-extrabold uppercase tracking-wide rounded-none border transition-colors select-none ${
    active
      ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
      : 'border-foreground/40 bg-foreground/10 text-foreground hover:border-primary hover:text-primary'
  } ${sizeClasses} ${className}`;

  if (asLink) {
    return (
      <Link to={`/lists?tag=${encodeURIComponent(formattedTag)}`} className={baseClasses}>
        <span>{formattedTag}</span>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClasses} cursor-pointer`}>
        <span>{formattedTag}</span>
        {onRemove && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="hover:text-destructive font-black text-xs ml-0.5 cursor-pointer"
          >
            ×
          </span>
        )}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      <span>{formattedTag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-destructive font-black text-xs ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  );
};
