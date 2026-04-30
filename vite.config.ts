import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'KDKMP Digital',
          short_name: 'KDKMP',
          description: 'Solusi digital pengurus koperasi: Kelola anggota, tagih iuran & laporan keuangan transparan.',
          theme_color: '#dc2626',
          icons: [
            {
              src: 'https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
