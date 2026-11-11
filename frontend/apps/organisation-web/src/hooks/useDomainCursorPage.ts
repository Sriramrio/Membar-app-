import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import type { OrgQuery } from '@/services/queryGateway';
import { runtimeProviders } from '@/infrastructure/runtimeProviders';
import { assertCursorResponse } from '@/contracts/runtimeContracts';
import { performanceBudgets } from '@/config/performanceBudgets';
import { toApiError } from '@/services/errorMapper';
import type { ApiErrorEnvelope } from '@/types/api';

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
  totalEstimate?: number;
  serverTime?: string;
  consistencyToken?: string;
  summary?: unknown;
}

interface State<T> {
  page?: CursorPage<T>;
  loading: boolean;
  refreshing: boolean;
  stale: boolean;
  error?: ApiErrorEnvelope;
  lastUpdatedAt?: string;
  requestDurationMs?: number;
  correlationId?: string;
}

const enc = (n: number) => n > 0 ? `local:${n}` : undefined;
const dec = (s?: string) => s?.startsWith('local:') ? Math.max(0, Number(s.slice(6)) || 0) : 0;

export function useDomainCursorPage<T>(request: OrgQuery, localItems: readonly T[], deps: readonly unknown[] = [], enabled = true) {
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<(string | undefined)[]>([]);
  const [revision, setRevision] = useState(0);

  const initialPage = useMemo<CursorPage<T> | undefined>(() => {
    if (env.useMocks && localItems && localItems.length > 0) {
      return {
        items: [...localItems],
        hasMore: false,
        totalEstimate: localItems.length
      };
    }
    return undefined;
  }, [localItems.length]);

  const [state, setState] = useState<State<T>>({
    page: initialPage,
    loading: !initialPage,
    refreshing: Boolean(initialPage),
    stale: false
  });

  const seq = useRef(0);
  const key = useMemo(() => JSON.stringify({ ...request, cursor: undefined }), [request]);

  useEffect(() => {
    setCursor(undefined);
    setHistory([]);
  }, [key, ...deps]);

  const localDependency = env.useMocks ? localItems : undefined;

  useEffect(() => {
    if (!enabled) {
      setState(x => ({ ...x, loading: false, refreshing: false }));
      return;
    }

    const ctl = new AbortController();
    const current = ++seq.current;
    const had = Boolean(state.page);

    setState(x => ({
      ...x,
      page: x.page,
      loading: !had,
      refreshing: had,
      stale: false,
      error: undefined
    }));

    const started = performance.now();

    const load = async () => {
      const pageSize = Math.min(request.pageSize ?? performanceBudgets.defaultPageSize, performanceBudgets.maxPageSize);
      if (env.useMocks) {
        const off = dec(cursor);
        const items = localItems.slice(off, off + pageSize);
        return {
          items: [...items],
          nextCursor: off + items.length < localItems.length ? enc(off + items.length) : undefined,
          previousCursor: off ? enc(Math.max(0, off - pageSize)) : undefined,
          hasMore: off + items.length < localItems.length,
          totalEstimate: localItems.length
        } as CursorPage<T>;
      }

      try {
        const raw = await runtimeProviders().query.execute<unknown>({ ...request, cursor, pageSize }, ctl.signal);
        const result = assertCursorResponse<T>(raw);
        return {
          items: result.items ?? [],
          nextCursor: result.nextCursor,
          previousCursor: result.previousCursor,
          hasMore: Boolean(result.hasMore),
          totalEstimate: result.totalEstimate,
          serverTime: result.serverTime,
          consistencyToken: result.consistencyToken,
          summary: result.summary ?? (raw as { summary?: unknown })?.summary
        } as CursorPage<T>;
      } catch (err) {
        if (env.useMocks && localItems && localItems.length > 0) {
          const off = dec(cursor);
          const items = localItems.slice(off, off + pageSize);
          return {
            items: [...items],
            nextCursor: off + items.length < localItems.length ? enc(off + items.length) : undefined,
            previousCursor: off ? enc(Math.max(0, off - pageSize)) : undefined,
            hasMore: off + items.length < localItems.length,
            totalEstimate: localItems.length
          } as CursorPage<T>;
        }
        throw err;
      }
    };

    load().then(page => {
      if (current === seq.current && !ctl.signal.aborted) {
        setState({
          page,
          loading: false,
          refreshing: false,
          stale: false,
          lastUpdatedAt: new Date().toISOString(),
          requestDurationMs: Math.round(performance.now() - started)
        });
      }
    }).catch(err => {
      if (current === seq.current && !ctl.signal.aborted) {
        setState(x => ({
          ...x,
          loading: false,
          refreshing: false,
          stale: x.page !== undefined,
          error: toApiError(err)
        }));
      }
    });

    return () => ctl.abort();
  }, [cursor, key, revision, localDependency, enabled, ...deps]);

  const next = useCallback(() => {
    if (state.page?.nextCursor) {
      setHistory(h => [...h, cursor]);
      setCursor(state.page.nextCursor);
    }
  }, [state.page?.nextCursor, cursor]);

  const previous = useCallback(() => setHistory(h => {
    if (!h.length) return h;
    const c = [...h];
    setCursor(c.pop());
    return c;
  }), []);

  const reload = useCallback(() => setRevision(v => v + 1), []);

  return {
    ...state,
    next,
    previous,
    reload,
    canNext: Boolean(state.page?.nextCursor),
    canPrevious: history.length > 0
  };
}
