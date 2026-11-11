<script>
  import { app, ir } from '../lib/estado.svelte.js';
  import Icono from './Icono.svelte';
  const TABS = [['hoy', 'Hoy'], ['entrenar', 'Entrenar'], ['comer', 'Comer'], ['progreso', 'Progreso'], ['yo', 'Yo']];
</script>

<nav aria-label="Pestañas">
  {#each TABS as [id, nombre]}
    <button class:on={app.tab === id} style="--c: var(--{id})" onclick={() => ir(id)} aria-current={app.tab === id ? 'page' : undefined}>
      <Icono n={id} />
      <span>{nombre}</span>
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: flex; justify-content: space-around;
    background: var(--superficie); border-top: 1px solid var(--borde);
    padding: 6px max(6px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 8px) max(6px, env(safe-area-inset-left, 0px));
  }
  button {
    background: none; border: 0; color: var(--texto2); display: flex; flex-direction: column; align-items: center;
    gap: 3px; font-size: 11px; min-width: 60px; min-height: 52px; padding-top: 6px; cursor: pointer;
  }
  button.on { color: var(--c); font-weight: 600; }
</style>
