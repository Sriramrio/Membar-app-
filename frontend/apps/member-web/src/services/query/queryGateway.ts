import { env } from '@/config/env';
import { type ApiRequestOptions } from '@/services/api/apiClient';
import { executeDomainQuery } from '@/services/api/domainPersistence';
import { normalizePageSize, type CursorPage, type DomainQueryRequest } from './queryContracts';

export interface QueryExecutionOptions extends ApiRequestOptions { maxPageSize?: number; }

export async function executeServerQuery<T>(request: DomainQueryRequest, options: QueryExecutionOptions = {}): Promise<{ data: T; version?: string; correlationId: string }> {
  if (env.useMocks) throw new Error('Server query requested while SETHU is in preview/local mode.');

  const pageSize = normalizePageSize(request.pagination?.pageSize, 25, options.maxPageSize ?? 50);
  const params: Record<string, unknown> = {
    ...request.parameters,
    pageSize,
    cursor: request.pagination?.cursor,
  };

  // Convert filters if present
  if (request.filters) {
    for (const f of request.filters) {
      params[f.field] = f.value;
    }
  }

  const result = await executeDomainQuery<T>(request.domain, request.queryId, params);
  return {
    data: result.data,
    version: result.version,
    correlationId: result.correlationId,
  };
}

export async function executeServerPage<T>(request: DomainQueryRequest, options: QueryExecutionOptions = {}): Promise<{ page: CursorPage<T>; version?: string; correlationId: string }> {
  const result = await executeServerQuery<unknown>(request, options);
  const raw = result.data;

  let items: T[] = [];
  let totalEstimate = 0;
  let hasMore = false;
  const pageSize = normalizePageSize(request.pagination?.pageSize, 25, options.maxPageSize ?? 50);

  if (Array.isArray(raw)) {
    items = raw as T[];
    totalEstimate = items.length;
    hasMore = false;
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      items = obj.items as T[];
      totalEstimate = typeof obj.total === 'number' ? obj.total : items.length;
      hasMore = Boolean(obj.hasMore);
    }
  }

  const page: CursorPage<T> = {
    items,
    page: {
      pageSize,
      returned: items.length,
      hasMore,
      totalEstimate,
    },
  };

  return {
    page,
    version: result.version,
    correlationId: result.correlationId,
  };
}
