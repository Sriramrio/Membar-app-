export type ApiErrorType = 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'NOT_FOUND' | 'GONE' | 'CONFLICT' | 'RATE_LIMIT' | 'DEPENDENCY' | 'SERVER' | 'OFFLINE' | 'CANCELLED';
export interface ApiErrorEnvelope {
  type: ApiErrorType;
  code: string;
  title: string;
  detail: string;
  status: number;
  correlationId: string;
  retryable: boolean;
  fieldErrors: Array<{ field: string; message: string }>;
  currentVersion?: string;
  allowedRecovery?: string[];
}
export interface ApiResponse<T> { data: T; correlationId: string; version?: string; }
