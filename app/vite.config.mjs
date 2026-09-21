import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.BASE_URL || './',
  ...(mode === 'curriculum-preview' ? {
    resolve: {
      alias: {
        './data/content.json': fileURLToPath(new URL('./.preview/src/data/content.json', import.meta.url))
      }
    },
    publicDir: '.preview/public'
  } : {}),
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: mode === 'curriculum-preview' ? '.preview/dist' : 'dist',
  }
}));
