import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  title: ReactNode;
  titleAction?: ReactNode;
  actions?: ReactNode;
  level?: 'h2' | 'h3';
  size?: 'large' | 'medium';
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  title,
  titleAction,
  actions,
  level = 'h2',
  size = 'large',
  className = '',
  titleClassName = '',
}: SectionHeadingProps) {
  const Heading = level;
  const titleSize = size === 'large'
    ? 'text-xl sm:text-2xl'
    : 'text-lg sm:text-xl';

  return (
    <div className={`flex items-center justify-between gap-3 border-b-2 border-foreground/30 pb-2 ${className}`}>
      <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
        <Heading className={cn(titleSize, 'truncate font-black uppercase tracking-tight text-primary', titleClassName)}>
          {title}
        </Heading>
        {titleAction}
      </div>
      {actions}
    </div>
  );
}
