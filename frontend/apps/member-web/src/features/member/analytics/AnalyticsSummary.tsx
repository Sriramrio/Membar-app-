import { ChevronRight } from 'lucide-react';
import type { AnalyticsCount } from './networkingAnalytics';

export function AnalyticsSummary({
  items,
  onOpen,
  className = '',
  columns = 'default',
}: {
  items: AnalyticsCount[];
  onOpen: (route: string) => void;
  className?: string;
  columns?: 'default' | 'compact' | 'auto';
}) {
  const gridClasses = columns === 'compact'
    ? 'grid-cols-2 sm:grid-cols-3'
    : (className || 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5');

  return (
    <div className={`grid gap-3 ${gridClasses}`}>
      {items.map(item => (
        <button
          key={item.code}
          type="button"
          onClick={() => onOpen(item.route)}
          aria-label={`${item.label}: ${item.value}. ${item.description}`}
          className="group flex min-h-[82px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-200"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-2xl font-black tracking-tight text-[var(--navy-950)]">{item.value}</span>
            <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-600" />
          </div>
          <div className="mt-1.5 text-xs font-bold leading-normal text-slate-600 group-hover:text-slate-900 break-words">
            {item.label}
          </div>
        </button>
      ))}
    </div>
  );
}

