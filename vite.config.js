import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './': la app funciona en cualquier carpeta (GitHub Pages sirve en /pare/).
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
