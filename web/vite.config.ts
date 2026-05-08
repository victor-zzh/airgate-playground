import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const watchOptions = process.argv.includes('--watch')
  ? { chokidar: { usePolling: true, interval: 1000 } }
  : undefined;

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-i18next'],
      output: {
        inlineDynamicImports: true,
      },
    },
    watch: watchOptions,
  },
});
