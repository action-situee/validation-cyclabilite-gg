import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('maplibre-gl') || id.includes('pmtiles')) return 'map';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('lucide-react') || id.includes('sonner')) return 'ui';
          if (id.includes('react')) return 'react';
          return undefined;
        },
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});
