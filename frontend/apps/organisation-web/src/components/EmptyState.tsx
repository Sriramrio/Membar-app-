import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  title?: string;
  body?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No items found',
  body,
  description,
  icon,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  const displayText = body || description;

  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {displayText && <p className="mt-1 text-xs text-slate-500 max-w-sm">{displayText}</p>}
      {action && <div className="mt-4">{action}</div>}
      {children}
    </div>
  );
}

export default EmptyState;
