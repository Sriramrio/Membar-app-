const defaultApiBaseUrl = 'https://sethudbnapi.dharmicbusines.com';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;

function normaliseApiBaseUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const url = new URL(trimmed);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (import.meta.env.PROD && url.protocol !== 'https:' && !local) {
      throw new Error('Production API base URL must use HTTPS.');
    }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported API URL protocol.');
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Invalid API base URL.');
  }
}

// Preview fixtures are NEVER enabled by default in a production build.
// Production preview is deliberately disallowed, regardless of developer flags.
const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';
const previewAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PREVIEW_AUTH === 'true';
const clientRuntimePersistence = useMocks && import.meta.env.VITE_ENABLE_CLIENT_RUNTIME_PERSISTENCE === 'true';
const isStrictAuthoritativeBackend = import.meta.env.VITE_AUTHORITATIVE_SERVER === 'true';
if (isStrictAuthoritativeBackend && (useMocks || previewAuthEnabled)) {
  throw new Error('Authoritative runtime cannot enable preview mocks or preview authentication.');
}

export const env = {
  apiBaseUrl: normaliseApiBaseUrl(rawApiBaseUrl),
  useMocks,
  previewAuthEnabled,
  clientRuntimePersistence,
  authoritativeServer: !useMocks,
  appName: import.meta.env.VITE_APP_NAME ?? 'SETHU',
  releaseVersion: import.meta.env.VITE_APP_VERSION ?? '7.1.0'
};
