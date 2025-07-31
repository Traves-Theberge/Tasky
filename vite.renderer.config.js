import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  root: resolve('src/renderer'),
  base: './',
  css: {
    postcss: './postcss.config.mjs'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'src/renderer/dist',
    rollupOptions: {
      input: resolve('src/renderer/index.html')
    }
  },
  server: {
    port: 3000
  }
});