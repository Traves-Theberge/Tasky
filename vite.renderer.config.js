import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  root: resolve('src/renderer'),
  build: {
    rollupOptions: {
      input: resolve('src/renderer/index.html')
    }
  },
  server: {
    port: 3000
  }
});