<script>
  // Hoja que sube desde abajo, para acciones rápidas con el pulgar.
  import { onMount } from 'svelte';
  import { registrarHoja } from '../lib/atras.js';
  let { titulo = '', cerrar, children } = $props();
  onMount(() => registrarHoja(() => cerrar?.()));
  let y0 = null, dy = $state(0);
  const empezar = (e) => { y0 = e.touches[0].clientY; };
  const mover = (e) => { if (y0 != null) dy = Math.max(0, e.touches[0].clientY - y0); };
  const soltar = () => { if (dy > 90) cerrar?.(); dy = 0; y0 = null; };
</script>

<div class="velo" onclick={() => cerrar?.()} role="presentation"></div>
<div class="hoja" role="dialog" aria-modal="true" aria-label={titulo} style="transform: translateY({dy}px)">
  <div class="asa" ontouchstart={empezar} ontouchmove={mover} ontouchend={soltar} role="presentation"><span></span></div>
  {#if titulo}
    <div class="tit"><h2>{titulo}</h2><button class="icono-b" onclick={() => cerrar?.()} aria-label="Cerrar">✕</button></div>
  {/if}
  <div class="cuerpo">{@render children?.()}</div>
</div>

<style>
  .velo { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 40; }
  .hoja {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; background: var(--elevada);
    border-radius: 20px 20px 0 0; border-top: 1px solid var(--borde); max-height: 88vh; overflow-y: auto;
    padding: 0 max(16px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 20px) max(16px, env(safe-area-inset-left, 0px));
    max-width: 640px; margin: 0 auto; transition: transform 0.12s; animation: sube 0.18s ease-out;
  }
  @keyframes sube { from { transform: translateY(40%); opacity: 0.6; } }
  .asa { display: flex; justify-content: center; padding: 10px 0 6px; position: sticky; top: 0; background: var(--elevada); }
  .asa span { width: 44px; height: 5px; border-radius: 3px; background: var(--borde); }
  .tit { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 12px; }
  .cuerpo { display: flex; flex-direction: column; gap: 14px; }
</style>
