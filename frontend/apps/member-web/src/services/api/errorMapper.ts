import axios from 'axios';
import type { ApiErrorEnvelope, ApiErrorType } from '@/types/api';

function typeForStatus(status: number): ApiErrorType {
  if (status === 400 || status === 422) return 'VALIDATION';
  if (status === 401) return 'AUTHENTICATION';
  if (status === 403) return 'AUTHORIZATION';
  if (status === 404) return 'NOT_FOUND';
  if (status === 410) return 'GONE';
  if (status === 409 || status === 412) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 502 && status <= 504) return 'DEPENDENCY';
  return 'SERVER';
}

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiErrorEnvelope>;
  return typeof candidate.type === 'string' &&
    typeof candidate.code === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.detail === 'string' &&
    typeof candidate.status === 'number' &&
    typeof candidate.correlationId === 'string' &&
    typeof candidate.retryable === 'boolean' &&
    Array.isArray(candidate.fieldErrors);
}

export function toApiError(error: unknown): ApiErrorEnvelope {
  if (isApiErrorEnvelope(error)) return error;

  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') {
      return {
        type:'CANCELLED',
        code:'REQUEST_CANCELLED',
        title: 'Request cancelled',
        detail: 'The request was cancelled before completion.',
        status: 0,
        correlationId: String(error.config?.headers?.['X-Correlation-ID'] ?? 'cancelled'),
        retryable: false,
        fieldErrors: [],
      };
    }
    const status = error.response?.status ?? 500;
    const body = error.response?.data as Partial<ApiErrorEnvelope> | undefined;
    return {
      type: body?.type ?? typeForStatus(status),
      code: body?.code ?? 'REQUEST_FAILED',
      title: body?.title ?? 'Request could not be completed',
      detail: body?.detail ?? 'Try again or use the support reference if the problem continues.',
      status,
      correlationId: body?.correlationId ?? String(error.config?.headers?.['X-Correlation-ID'] ?? 'unknown'),
      retryable: (body?.retryable ?? status === 429) || status >= 500,
      fieldErrors: body?.fieldErrors ?? [],
      currentVersion: body?.currentVersion,
      allowedRecovery: body?.allowedRecovery,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      type: 'OFFLINE',
      code: 'NETWORK_OFFLINE',
      title: 'You are offline',
      detail: 'Reconnect before continuing.',
      status: 0,
      correlationId: 'offline',
      retryable: true,
      fieldErrors: [],
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: 'CANCELLED',
      code: 'REQUEST_CANCELLED',
      title: 'Request cancelled',
      detail: 'The request was cancelled before completion.',
      status: 0,
      correlationId: 'cancelled',
      retryable: false,
      fieldErrors: [],
    };
  }

  return {
    type: 'SERVER',
    code: 'UNEXPECTED_ERROR',
    title: 'Unexpected error',
    detail: 'The request could not be completed.',
    status: 500,
    correlationId: 'unknown',
    retryable: false,
    fieldErrors: [],
  };
}
