import { useCallback, useRef, useState } from 'react';
import { useDomainCommandExecutor, type DomainCommandInput } from '@/hooks/useDomainCommandExecutor';
import { toApiError } from '@/services/api/errorMapper';
import type { ApiErrorEnvelope } from '@/types/api';
import { stableClientId } from '@/utils/stableId';
import { classifyLatency } from '@/config/performanceBudgets';
import { telemetry } from '@/services/telemetry/telemetry';

export interface GovernedCommandState {
  busy: boolean;
  error?: ApiErrorEnvelope;
  durationMs?: number;
  slow?: boolean;
  commandId?: string;
}

/**
 * UI-level command controller.
 * - prevents duplicate in-flight submissions
 * - preserves a stable command id for safe retry of the same failed operation
 * - normalizes every failure for conflict/recovery UI
 * - measures mutation latency against the V7.1 command budget
 */
export function useGovernedCommand() {
  const executeBase = useDomainCommandExecutor();
  const inFlight = useRef(false);
  const last = useRef<{ input: DomainCommandInput<unknown>; commandId: string } | undefined>(undefined);
  const [state, setState] = useState<GovernedCommandState>({ busy: false });

  const runWithId = useCallback(async <TPayload, TResult = unknown>(input: DomainCommandInput<TPayload>, commandId: string) => {
    if (inFlight.current) return { ok: false as const, duplicateSuppressed: true as const };
    inFlight.current = true;
    const started = performance.now?.() ?? Date.now();
    setState({ busy: true, commandId });
    try {
      const result = await executeBase<TPayload, TResult>({ ...input, commandId });
      const durationMs = Math.round((performance.now?.() ?? Date.now()) - started);
      const budget = classifyLatency(durationMs, 'command');
      if (!result.ok) {
        const error = toApiError(result.error);
        telemetry.warning('performance', 'command.failed', `Command ${input.command} failed`, { command: input.command, durationMs, targetMs: budget.targetMs, slow: budget.slow }, commandId);
        setState({ busy: false, error, durationMs, slow: budget.slow, commandId });
        return { ...result, error };
      }
      telemetry.info('performance', 'command.completed', `Command ${input.command} completed`, { command: input.command, durationMs, targetMs: budget.targetMs, slow: budget.slow, critical: budget.critical }, commandId);
      setState({ busy: false, durationMs, slow: budget.slow, commandId });
      return result;
    } catch (cause) {
      const durationMs = Math.round((performance.now?.() ?? Date.now()) - started);
      const budget = classifyLatency(durationMs, 'command');
      const error = toApiError(cause);
      telemetry.error('performance', 'command.exception', cause, { command: input.command, durationMs, targetMs: budget.targetMs, slow: budget.slow }, commandId);
      setState({ busy: false, error, durationMs, slow: budget.slow, commandId });
      return { ok: false as const, error };
    } finally {
      inFlight.current = false;
    }
  }, [executeBase]);

  const execute = useCallback(async <TPayload, TResult = unknown>(input: DomainCommandInput<TPayload>) => {
    const commandId = input.commandId ?? stableClientId('cmd');
    last.current = { input: input as DomainCommandInput<unknown>, commandId };
    return runWithId<TPayload, TResult>(input, commandId);
  }, [runWithId]);

  const retry = useCallback(async () => {
    const previous = last.current;
    if (!previous) return undefined;
    return runWithId(previous.input, previous.commandId);
  }, [runWithId]);

  const clearError = useCallback(() => setState(s => ({ busy: s.busy, durationMs: s.durationMs, slow: s.slow, commandId: s.commandId })), []);
  return { ...state, execute, retry, clearError };
}
