import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './': la app funciona en cualquier carpeta (GitHub Pages sirve en /pare/).
export default defineConfig({
  base: './',
  plugins: [svelte()],
  // fecha de publicación, visible en Yo para saber si el móvil tiene la última versión
  define: { __PUBLICADA__: JSON.stringify(new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })) },
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
