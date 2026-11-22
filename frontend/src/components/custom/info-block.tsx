import React, { type ReactNode } from 'react';

interface InfoBlockProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const InfoBlock: React.FC<InfoBlockProps> = ({ label, value, icon, className = '' }) => {
  return (
    <div
      className={`p-3 sm:p-4 bg-card border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1">
        <span>{label}</span>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <div className="font-bold text-sm sm:text-base text-foreground break-words">{value}</div>
    </div>
  );
};
