import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  iconContainerClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-none border-4 border-dashed border-foreground/30 bg-background/50 font-display', className)}>
      {icon && (
        <div className={cn('mb-4 p-4 border-4 border-foreground/20 bg-background text-primary', iconContainerClassName)}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: cn((icon.props as { className?: string }).className, iconClassName),
          }) : icon}
        </div>
      )}
      <h3 className={cn('text-lg sm:text-xl font-extrabold uppercase tracking-wide text-foreground', titleClassName)}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-2 text-xs sm:text-sm font-bold text-foreground/60 max-w-md leading-relaxed', descriptionClassName)}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="default"
          size="sm"
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
