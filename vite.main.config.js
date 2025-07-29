import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both web and node.js environments
    // List of modules that should always be bundled, despite whether they are dependencies or not
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'main',
      fileName: 'main',
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
        /^\.\/electron\//
      ],
    },
    emptyOutDir: false,
    brotliSize: false,
  }
});
