import type { AxiosInstance } from 'axios';
import { newCorrelationId, telemetry } from '@/services/telemetry/telemetry';
import { serverClock } from '@/services/time/serverClock';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { localStorageService } from '@/services/storage/localStorage';

function requestId() { return newCorrelationId('REQ') }
function idempotencyKey() { return newCorrelationId('IDEM') }

export function attachInterceptors(api: AxiosInstance) {
  api.interceptors.request.use(config => {
    if (config.url) {
      if (config.url.startsWith('/api/') && (config.baseURL?.endsWith('/api') || config.baseURL?.endsWith('/api/'))) {
        config.url = config.url.replace(/^\/api/, '');
      }
      // Safety clamp: ensure size and pageSize never exceed 50 to avoid backend pagination 400
      config.url = config.url.replace(/([?&](?:size|pageSize)=)(\d+)/gi, (match, prefix, numStr) => {
        const num = parseInt(numStr, 10);
        return num > 50 ? `${prefix}50` : match;
      });
    }
    if (config.params && typeof config.params === 'object') {
      if (typeof (config.params as any).size === 'number' && (config.params as any).size > 50) (config.params as any).size = 50;
      if (typeof (config.params as any).pageSize === 'number' && (config.params as any).pageSize > 50) (config.params as any).pageSize = 50;
    }
    config.headers['X-Correlation-ID'] = config.headers['X-Correlation-ID'] ?? newCorrelationId('API');
    config.headers['X-Request-ID'] = config.headers['X-Request-ID'] ?? requestId();
    if (['post', 'put', 'patch', 'delete'].includes((config.method ?? '').toLowerCase())) config.headers['Idempotency-Key'] = config.headers['Idempotency-Key'] ?? idempotencyKey();
    const token = sessionStorageService.get<string>('sethu:token') || localStorageService.get<string>('sethu:token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });
  api.interceptors.response.use(
    response => {
      serverClock.sync(response.headers?.date);
      const token = response.headers?.['x-access-token'] ?? (response.data as { token?: string } | undefined)?.token;
      if (token) {
        sessionStorageService.rawSetResult('sethu:token', String(token));
      }
      return response;
    },
    error => {
      const config = error?.config;
      const correlationId = String(config?.headers?.['X-Correlation-ID'] ?? newCorrelationId('API'));
      telemetry.error('api','request.failed', error, { method: String(config?.method ?? 'unknown').toUpperCase(), url: String(config?.url ?? 'unknown'), status: Number(error?.response?.status ?? 0), requestId: String(config?.headers?.['X-Request-ID'] ?? 'unknown') }, correlationId);
      return Promise.reject(error);
    },
  );
}