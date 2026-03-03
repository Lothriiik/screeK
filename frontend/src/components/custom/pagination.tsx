import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isDark?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isDark = true,
}: PaginationProps) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 border-4 flex items-center justify-center font-black transition-all ${isDark
                        ? 'border-white/20 hover:border-primary-400 disabled:opacity-50'
                        : 'border-black/20 hover:border-primary-400 disabled:opacity-50'
                    } disabled:cursor-not-allowed disabled:hover:border-white/20`}
            >
                <ChevronLeft size={20} />
            </button>

            {getPageNumbers().map((page, index) => (
                <div key={index}>
                    {page === '...' ? (
                        <span className="w-10 h-10 flex items-center justify-center font-black opacity-40">
                            ...
                        </span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            className={`w-10 h-10 border-4 flex items-center justify-center font-black transition-all ${currentPage === page
                                    ? 'bg-primary-400 border-primary-400 text-white'
                                    : isDark
                                        ? 'border-white/20 hover:border-primary-400'
                                        : 'border-black/20 hover:border-primary-400'
                                }`}
                        >
                            {page}
                        </button>
                    )}
                </div>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 border-4 flex items-center justify-center font-black transition-all ${isDark
                        ? 'border-white/20 hover:border-primary-400 disabled:opacity-50'
                        : 'border-black/20 hover:border-primary-400 disabled:opacity-50'
                    } disabled:cursor-not-allowed disabled:hover:border-white/20`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
