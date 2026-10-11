import { defineConfig } from 'vite';

export default defineConfig({
  // Served from the root of picksandshovels.org.
  base: '/',
  build: {
    // three.js is most of the bundle; one file loads fine.
    chunkSizeWarningLimit: 1000,
  },
});
