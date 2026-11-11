import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConflictResolutionPanel } from '@/components/concurrency/ConflictResolutionPanel';
import type { ApiErrorEnvelope } from '@/types/api';

export interface CommandExecutionFeedbackProps {
  error?: ApiErrorEnvelope;
  onReload?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  busy?: boolean;
  slow?: boolean;
  durationMs?: number;
}

export function CommandExecutionFeedback({ error, onReload, onRetry, onDismiss, busy, slow, durationMs }: CommandExecutionFeedbackProps) {
  if (!error && busy) return <div role="status" aria-live="polite" className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-900">Saving securely…{slow?' This is taking longer than usual; please keep this page open.':''}</div>;
  if (!error && slow && durationMs) return <div role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Action completed in {(durationMs/1000).toFixed(1)}s. Response time exceeded the normal target and was recorded for monitoring.</div>;
  if (!error) return null;
  if (error.type === 'CONFLICT') {
    return <ConflictResolutionPanel detail={error.detail} currentVersion={error.currentVersion} allowedRecovery={error.allowedRecovery} onReload={onReload ?? (() => window.location.reload())} onRetry={error.retryable ? onRetry : undefined} onCancel={onDismiss} />;
  }
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
    <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0"/><div className="min-w-0 flex-1"><div className="font-black">{error.title}</div><p className="mt-1 text-sm leading-6">{error.detail}</p><p className="mt-1 break-all text-xs text-red-700">Support reference: {error.correlationId}</p></div></div>
    <div className="mt-3 flex flex-wrap gap-2">{error.retryable&&onRetry&&<Button variant="secondary" onClick={onRetry}><RotateCcw className="size-4"/>Retry safely</Button>}{onDismiss&&<Button variant="ghost" onClick={onDismiss}><X className="size-4"/>Dismiss</Button>}</div>
  </div>;
}
