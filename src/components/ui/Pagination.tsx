import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium">{(page - 1) * limit + 1}</span>–
        <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-medium">{total}</span>
      </div>
      <div className="flex gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className={cn(
            'rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'min-w-[2rem] rounded px-2 py-1 text-sm font-medium',
              p === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
            )}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className={cn(
            'rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
