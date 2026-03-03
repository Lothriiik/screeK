import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    isDark?: boolean;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-2 text-sm">
            <Home size={16} className="opacity-60" />
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronRight size={16} className="opacity-40" />
                    {item.href ? (
                        <a
                            href={item.href}
                            className={`font-medium transition-colors ${index === items.length - 1
                                ? 'text-primary-400 font-black'
                                : 'opacity-60 hover:opacity-100 hover:text-primary-400'
                                }`}
                        >
                            {item.label}
                        </a>
                    ) : (
                        <span
                            className={`font-medium ${index === items.length - 1
                                ? 'text-primary-400 font-black'
                                : 'opacity-60'
                                }`}
                        >
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
