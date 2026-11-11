import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Strictly configured from .env - No hardcoded fallback URL
  const backendTarget = env.VITE_PLATFORM_ADMIN_API_BASE || env.VITE_BACKEND_URL;

  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 4179,
      proxy: backendTarget
        ? {
            '/api': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/v6': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});