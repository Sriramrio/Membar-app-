import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Strictly configured from .env - No hardcoded fallback URL
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL;

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)),
        'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
        'react/jsx-runtime': fileURLToPath(new URL('./node_modules/react/jsx-runtime', import.meta.url)),
      },
      dedupe: ['react', 'react-dom']
    },
    server: {
      proxy: backendTarget
        ? {
            '/v3/organisational': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/v3/organisational': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/membership': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/auth': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/org': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/chapters': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/roles': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/members': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/onboarding': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api/payments': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
            '/api': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    build: { target: 'es2022', chunkSizeWarningLimit: 750 },
  };
});
