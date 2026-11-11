import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { toast, type ToastItem } from './toastService';
import { cn } from '@/utils/cn';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="fixed right-4 top-4 z-[9999] flex w-[min(92vw,400px)] flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toastItem={t} onDismiss={() => toast.dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toastItem, onDismiss }: { toastItem: ToastItem; onDismiss: () => void }) {
  const { tone, title, message } = toastItem;

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-red-50 border-red-300 text-red-950',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      barColor: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-300 text-amber-950',
      icon: TriangleAlert,
      iconColor: 'text-amber-600',
      barColor: 'bg-amber-500',
    },
    info: {
      bg: 'bg-sky-50 border-sky-300 text-sky-950',
      icon: Info,
      iconColor: 'text-sky-600',
      barColor: 'bg-sky-500',
    },
  }[tone];

  const Icon = config.icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-xs transition-all animate-in slide-in-from-top-2 duration-200',
        config.bg
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', config.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <strong className="block text-sm font-black leading-5">{title}</strong>}
        <p className="mt-0.5 text-sm leading-5 font-medium">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-black/5 active:scale-95 transition"
        aria-label="Close notification"
      >
        <X className="size-4 opacity-70" />
      </button>
      <div className={cn('absolute bottom-0 left-0 h-1 w-full opacity-60', config.barColor)} />
    </div>
  );
}

export { toast } from './toastService';
