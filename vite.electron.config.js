import { defineConfig } from 'vite';
import { resolve } from 'path';

// Configuration for bundling electron modules
export default defineConfig({
  build: {
    lib: {
      entry: {
        scheduler: 'src/electron/scheduler.js',
        storage: 'src/electron/storage.js',
        assistant: 'src/electron/assistant.js',
        'assistant-script': 'src/electron/assistant-script.js'
      },
      formats: ['cjs']
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-squirrel-startup',
        'node-cron',
        'electron-store',
        'sound-play',
        'child_process',
        'path',
        'fs',
        'os',
        'util'
      ],
      output: {
        dir: '.vite/build',
        format: 'cjs',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        manualChunks: undefined,
        inlineDynamicImports: false
      }
    },
    outDir: '.vite/build',
    emptyOutDir: true,
    target: 'node18'
  },
  resolve: {
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext']
  }
});