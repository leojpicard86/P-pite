/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The production build is a single self-contained HTML file (fonts and code inlined),
// so dist/index.html opens with a double-click (file://) and needs no network.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: { assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 4000 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
