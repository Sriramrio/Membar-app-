import type { BootstrapResponse, CommandRequest, CommandResponse, QueryRequest, QueryResponse, StructuredError } from '@/contracts/platform';

export const API_BASE = (() => {
  const envBase = (
    (typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_PLATFORM_ADMIN_API_BASE || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL)
      : '') || ''
  ).trim().replace(/\/+$/, '');

  if (envBase) return envBase;

  // In production browser environments (e.g. platformsethu.dharmicbusines.com), default to production backend
  if (typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://sethudbnapi.dharmicbusines.com';
  }

  return '';
})();
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_PLATFORM_ADMIN_REQUEST_TIMEOUT_MS || 30000);

async function decode<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: StructuredError = {
      code: (body.code || 'UNKNOWN') as StructuredError['code'],
      message: body.message || `Request failed (${res.status})`,
      correlationId: body.correlationId,
      requestId: body.requestId,
      retryable: Boolean(body.retryable),
      fieldErrors: body.fieldErrors,
      currentVersion: body.currentVersion,
      allowedRecovery: body.allowedRecovery,
      retryAfter: Number(res.headers.get('retry-after') || body.retryAfter || 0) || undefined,
      unknownOutcome: Boolean(body.unknownOutcome)
    };
    throw err;
  }
  return body as T;
}

function boundedSignal(parent?: AbortSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const abort = () => controller.abort(parent?.reason);
  if (parent?.aborted) abort();
  else parent?.addEventListener('abort', abort, { once: true });
  if (timeoutMs > 0) timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeout) clearTimeout(timeout);
      parent?.removeEventListener('abort', abort);
    }
  };
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('sethu:token') || localStorage.getItem('sethu:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, init: RequestInit, parent?: AbortSignal, unknownOutcome = false) {
  const bounded = boundedSignal(parent);
  const authHeaders = getAuthHeader();
  const existingHeaders = (init.headers as Record<string, string>) || {};
  const mergedHeaders = { ...authHeaders, ...existingHeaders };
  try {
    return await decode<T>(await fetch(url, { ...init, headers: mergedHeaders, signal: bounded.signal }));
  } catch (e) {
    if (parent?.aborted) throw e;
    if ((e as StructuredError)?.code) throw e;
    const aborted = bounded.signal.aborted;
    const err: StructuredError = {
      code: aborted ? 'DEPENDENCY' : 'UNKNOWN',
      message: aborted ? 'Request timed out. The operation can be retried after checking current state.' : 'Network request failed.',
      retryable: true,
      unknownOutcome
    };
    throw err;
  } finally {
    bounded.cleanup();
  }
}

// There is deliberately no browser-side authority or fabricated result fallback.
// A failed request is a failed request, never an administrator session or a commit.
export async function loadBootstrap(signal?: AbortSignal): Promise<BootstrapResponse> {
  const url = API_BASE ? `${API_BASE}/v6/bootstrap` : '/v6/bootstrap';
  return request<BootstrapResponse>(url, { credentials: 'include', headers: { accept: 'application/json', 'cache-control': 'no-store' } }, signal);
}

export async function runQuery<T>(requestBody: QueryRequest, signal?: AbortSignal): Promise<QueryResponse<T>> {
  const url = API_BASE ? `${API_BASE}/v6/platform-admin/query` : '/v6/platform-admin/query';
  return request<QueryResponse<T>>(url, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(requestBody)
  }, signal);
}

export async function runCommand(requestBody: CommandRequest, signal?: AbortSignal): Promise<CommandResponse> {
  const url = API_BASE ? `${API_BASE}/v6/platform-admin/commands` : '/v6/platform-admin/commands';
  return request<CommandResponse>(url, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(requestBody)
  }, signal, true);
}
