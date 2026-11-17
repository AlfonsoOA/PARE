<script>
  // Enlace «¿Por qué?» a un apartado de «En qué se basa PARE».
  import { app } from '../lib/estado.svelte.js';
  let { id, texto = '¿Por qué?' } = $props();
  const abrir = () => (app.vista = { nombre: 'fundamentos', abrir: id, acento: app.vista?.acento ?? app.tab, volver: app.vista });
</script>
<button class="porque" onclick={abrir}>{texto}</button>
<style>
  .porque { background: none; border: 0; padding: 0 2px; color: var(--acento); font-weight: 600; font-size: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; min-height: 28px; }
</style>
