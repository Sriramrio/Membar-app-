import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Strictly configured from .env - No hardcoded fallback URL
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'brand/sethu-logo-512.png',
          'brand/sethu-logo-192.png',
          'brand/sethu-logo.jpeg',
          'brand/sethu-logo.webp',
          'brand/dbn-logo.webp',
          'brand/app-icon.svg',
          'brand/apple-touch-icon.png',
          'brand/favicon-64.png'
        ],
        manifest: {
          name: 'SETHU - Dharmic Business Network',
          short_name: 'SETHU',
          description: 'Enterprise business-networking and organisational-management PWA for DBN.',
          theme_color: '#0b2f5b',
          background_color: '#f5f7fb',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/brand/sethu-logo-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/brand/sethu-logo-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/brand/sethu-logo-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/brand/app-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
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
            '/auth': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    preview: {
      port: 4173,
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
            '/auth': {
              target: backendTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    build: { sourcemap: false, target: 'es2022' }
  };
});