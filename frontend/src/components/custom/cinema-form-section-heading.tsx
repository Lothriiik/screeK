import type { ReactNode } from 'react';

interface CinemaFormSectionHeadingProps {
  icon: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}

export function CinemaFormSectionHeading({ icon, title, actions }: CinemaFormSectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-foreground/20 pb-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h3 className="text-base font-black uppercase text-foreground">{title}</h3>
      </div>
      {actions}
    </div>
  );
}
