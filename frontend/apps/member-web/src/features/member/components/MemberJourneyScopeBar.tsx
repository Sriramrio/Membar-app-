import { User, Home, Network } from 'lucide-react';
import { cn } from '@/utils/cn';

export type MemberJourneyScope = 'for-you' | 'chapter' | 'network';

const items = [
  {
    key: 'for-you' as const,
    label: 'For You',
    subtitle: 'Your personal workspace',
    Icon: User,
  },
  {
    key: 'chapter' as const,
    label: 'Parivar',
    subtitle: 'Your local community',
    Icon: Home,
  },
  {
    key: 'network' as const,
    label: 'Sangha',
    subtitle: 'Your wider DBN network',
    Icon: Network,
  },
];

export function MemberJourneyScopeBar({
  value,
  onChange,
  className = '',
}: {
  value: MemberJourneyScope;
  onChange: (scope: MemberJourneyScope) => void;
  className?: string;
}) {
  return (
    <section className={cn('member-scope-shell w-full my-2', className)} aria-label="Member journey scope">
      <div
        className="member-scope-tabs grid grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs"
        role="tablist"
        aria-label="For You, Parivar, Sangha"
      >
        {items.map(({ key, label, subtitle, Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${label}. ${subtitle}`}
              onClick={() => onChange(key)}
              className={cn(
                'member-scope-tab group relative flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-xl transition-all duration-200 focus:outline-none cursor-pointer',
                active
                  ? 'member-scope-tab-active bg-gradient-to-b from-amber-50 to-white text-[#5A121A] border border-amber-300/90 shadow-sm ring-2 ring-amber-400/20'
                  : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 hover:border-slate-200/60'
              )}
            >
              <span
                className={cn(
                  'grid size-8 place-items-center rounded-lg transition-colors mb-1.5',
                  active ? 'bg-amber-100/90 text-amber-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                )}
              >
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className={cn('text-xs sm:text-sm font-black leading-tight', active ? 'text-[#5A121A]' : 'text-slate-800 group-hover:text-slate-950')}>
                {label}
              </span>
              <span className={cn('mt-0.5 text-[10px] sm:text-[11px] font-medium leading-tight line-clamp-1', active ? 'text-amber-900/90 font-semibold' : 'text-slate-400 group-hover:text-slate-500')}>
                {subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
