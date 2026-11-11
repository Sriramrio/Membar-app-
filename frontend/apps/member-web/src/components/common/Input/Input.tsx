import type { InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  formatHint?: string;
  error?: string;
}

export function Input({ label, hint, formatHint, error, className, id, ...props }: Props) {
  const inputId = id ?? `field-${props.name ?? props.type ?? 'input'}`;

  return (
    <label className="grid gap-1.5 text-sm font-semibold" htmlFor={inputId}>
      {label && (
        <span className="text-slate-700">
          {label.trimEnd().endsWith('*') ? (
            <>
              {label.trimEnd().slice(0, -1).trimEnd()}{' '}
              <span className="text-red-500 font-bold">*</span>
            </>
          ) : props.required ? (
            <>
              {label}{' '}
              <span className="text-red-500 font-bold">*</span>
            </>
          ) : (
            label
          )}
        </span>
      )}
      <input
        id={inputId}
        className={cn(
          'min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-[var(--ink)] outline-none transition focus:border-sky-600 focus:ring-3 focus:ring-sky-100 placeholder:text-slate-400',
          error && 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-100',
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || formatHint || error ? `${inputId}-help` : undefined}
        {...props}
      />

      {/* Inline Error display below input */}
      {error && (
        <span
          id={`${inputId}-help`}
          role="alert"
          className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 mt-0.5"
        >
          <AlertCircle className="size-3.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </span>
      )}

      {/* Format Hint display below input when no error */}
      {!error && (formatHint || hint) && (
        <small id={`${inputId}-help`} className="font-normal text-slate-500 text-xs mt-0.5">
          {formatHint ?? hint}
        </small>
      )}
    </label>
  );
}
