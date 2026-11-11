import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface NumberedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  canPrevious: boolean;
  canNext: boolean;
  itemName?: string;
  className?: string;
}

export function NumberedPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 24,
  onPageChange,
  canPrevious,
  canNext,
  itemName = 'items',
  className = ''
}: NumberedPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(totalItems, currentPage * pageSize) : currentPage * pageSize;

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-5 ${className}`}>
      <div className="text-sm font-semibold text-slate-600">
        {totalItems !== undefined ? (
          <>
            Showing <span className="font-black text-slate-900">{startItem}–{endItem}</span> of{' '}
            <span className="font-black text-slate-900">{totalItems}</span> {itemName}{' '}
            <span className="text-slate-400 font-normal">· Page {currentPage} of {totalPages}</span>
          </>
        ) : (
          <span>Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong></span>
        )}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="secondary"
          className="min-h-10 px-3 text-sm font-bold gap-1"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="grid size-10 place-items-center text-sm font-bold text-slate-400 select-none">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`grid size-10 place-items-center rounded-xl text-sm font-black transition-all ${
                  p === currentPage
                    ? 'bg-[var(--navy-950)] text-white shadow-sm ring-2 ring-[var(--navy-950)]/20'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          className="min-h-10 px-3 text-sm font-bold gap-1"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
