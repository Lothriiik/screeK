import { Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface TagProps {
    children: ReactNode;
    isDark?: boolean;
    closable?: boolean;
    onClose?: () => void;
    className?: string;
}

export function Tag({ children, isDark = true, closable, onClose, className = '' }: TagProps) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-bold border-2 transition-colors ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-black/5 border-black/10 hover:bg-black/10 text-black'} ${className}`}>
            {children}
            {closable && (
                <button onClick={onClose} className="hover:text-danger-400 transition-colors">
                    <Trash2 size={12} />
                </button>
            )}
        </span>
    );
}
