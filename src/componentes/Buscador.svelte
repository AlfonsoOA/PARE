<script>
  // Hoja para elegir un ejercicio del catálogo (editor de rutina y sesión en curso).
  import { app } from '../lib/estado.svelte.js';
  import { cat, GRUPOS, NOMBRE_GRUPO, normalizar, etiqueta } from '../lib/catalogo.js';
  import { restriccion } from '../lib/entreno.js';
  import Hoja from './Hoja.svelte';
  let { cerrar, elegir, titulo = 'Añadir ejercicio', ids = null } = $props();
  let q = $state('');
  let grupo = $state('');
  let eq = $state('');
  const EQ = [['barra', 'Barra'], ['mancuerna', 'Mancuernas'], ['maquina', 'Máquina'], ['polea', 'Polea'], ['peso_corporal', 'Peso corporal'], ['kettlebell', 'Kettlebell']];
  const lista = $derived.by(() => {
    const n = normalizar(q.trim());
    let l = ids ? ids.map((i) => cat.porId.get(i)).filter(Boolean) : cat.ejercicios;
    if (grupo) l = l.filter((e) => e.gp?.includes(grupo));
    if (eq) l = l.filter((e) => e.eq === eq);
    if (n) l = l.filter((e) => normalizar(e.n).includes(n) || normalizar(e.en).includes(n));
    return l.slice(0, 80);
  });
</script>

<Hoja {titulo} {cerrar}>
  <input type="search" placeholder="Buscar (press, remo, curl…)" bind:value={q} aria-label="Buscar ejercicio" />
  {#if !ids}
    <div class="desliza">
      <button class="chip" class:on={!grupo} onclick={() => (grupo = '')}>Todos</button>
      {#each GRUPOS as g}<button class="chip" class:on={grupo === g} onclick={() => (grupo = grupo === g ? '' : g)}>{NOMBRE_GRUPO[g]}</button>{/each}
    </div>
    <div class="desliza">
      {#each EQ as [v, l]}<button class="chip" class:on={eq === v} onclick={() => (eq = eq === v ? '' : v)}>{l}</button>{/each}
    </div>
  {/if}
  <div class="lista">
    {#each lista as e (e.id)}
      {@const r = restriccion(e.id, app.datos.perfil.molestias)}
      <button class="item" onclick={() => elegir(e.id)}>
        {#if e.img}<img src="./img/{e.id}_1.webp" alt="" loading="lazy" width="56" height="56" />{:else}<span class="sinimg">{e.n.slice(0, 1)}</span>{/if}
        <span class="col" style="gap:2px;min-width:0">
          <b>{e.n}</b>
          <span class="sec peq">{(e.gp || []).map((g) => NOMBRE_GRUPO[g]).join(', ')} · {etiqueta('equipamiento', e.eq)}</span>
          {#if r}<span class="insignia {r.nivel === 'evitar' ? 'mal' : r.nivel === 'precaucion' ? 'aviso' : 'bien'}">{r.nivel === 'evitar' ? 'Evitar' : r.nivel === 'precaucion' ? 'Precaución' : 'Recomendado'} · {r.zona}</span>{/if}
        </span>
      </button>
    {:else}
      <p class="vacio">Nada con ese nombre.</p>
    {/each}
  </div>
</Hoja>

<style>
  .desliza { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
  .desliza .chip { flex-shrink: 0; }
  .lista { display: flex; flex-direction: column; gap: 6px; }
  .item { display: flex; gap: 12px; align-items: center; text-align: left; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 8px; cursor: pointer; min-height: 64px; }
  img, .sinimg { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #fff; }
  .sinimg { display: flex; align-items: center; justify-content: center; background: var(--elevada); color: var(--texto2); font-family: var(--titulos); font-size: 24px; }
  .insignia { align-self: flex-start; }
</style>
