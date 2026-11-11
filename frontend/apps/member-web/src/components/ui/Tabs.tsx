import type { ComponentType } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface TabsProps<T extends string = string> {
  value: T;
  onChange: (key: T) => void;
  items: TabItem<T>[];
  className?: string;
  variant?: 'pill' | 'underline' | 'buttons';
  ariaLabel?: string;
}

export function Tabs<T extends string = string>({
  value,
  onChange,
  items,
  className,
  variant = 'pill',
  ariaLabel = 'Navigation tabs',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-slate-200 overflow-x-auto', className)} role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const active = item.key === value;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.key)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors focus:outline-hidden',
                active
                  ? 'border-[var(--navy-900)] text-[var(--navy-900)]'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              {Icon && <Icon className="size-4" />}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-black', active ? 'bg-sky-100 text-sky-900' : 'bg-slate-100 text-slate-600')}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={cn('flex flex-wrap gap-2 overflow-x-auto pb-1', className)} role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const active = item.key === value;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.key)}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500',
                active
                  ? 'bg-[var(--navy-900)] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              )}
            >
              {Icon && <Icon className="size-4" />}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-black', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'pill' segmented style
  return (
    <div
      className={cn('inline-flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1.5 max-w-full', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = item.key === value;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all min-h-10 focus:outline-hidden focus:ring-2 focus:ring-sky-400',
              active
                ? 'bg-white text-[var(--navy-950)] shadow-sm'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-black', active ? 'bg-sky-100 text-sky-900' : 'bg-slate-200 text-slate-700')}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
