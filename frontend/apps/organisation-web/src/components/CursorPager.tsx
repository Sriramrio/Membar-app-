import React from 'react';

export function CursorPager({
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  totalEstimate
}: {
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  totalEstimate?: number;
}) {
  const count = totalEstimate ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / 25));

  return (
    <div className="pager-row flex items-center justify-between gap-4 py-4 px-3 bg-white/60 border border-slate-200/80 rounded-xl mt-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-slate-600 font-medium">
          {count > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{count}</span> records
              <span className="text-slate-400 mx-1.5">·</span>
              <span className="text-slate-500">Page 1 of {totalPages}</span>
            </>
          ) : (
            <span className="text-slate-500">0 records</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            canPrevious
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer shadow-2xs active:scale-95'
              : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          onClick={canPrevious ? onPrevious : undefined}
          disabled={!canPrevious}
          title={canPrevious ? 'Go to previous page' : 'You are on the first page'}
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Previous
        </button>

        <span className="px-2.5 py-1 rounded-md bg-[#1b5fa7]/10 text-[#1b5fa7] font-bold text-xs border border-[#1b5fa7]/20 select-none">
          1
        </span>

        <button
          type="button"
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            canNext
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer shadow-2xs active:scale-95'
              : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          onClick={canNext ? onNext : undefined}
          disabled={!canNext}
          title={canNext ? 'Go to next page' : 'No more pages available'}
        >
          Next
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
