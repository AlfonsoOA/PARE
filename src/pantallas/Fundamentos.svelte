<script>
  // «En qué se basa PARE»: las decisiones de la app con su explicación y su bibliografía. Se abre desde Yo, la guía
  // o los «¿Por qué?» de cada pantalla (con `abrir` = id del apartado).
  import { app } from '../lib/estado.svelte.js';
  import { REFS } from '../lib/referencias.gen.js';
  import { FUNDAMENTOS } from '../lib/fundamentos.js';
  import Icono from '../componentes/Icono.svelte';
  let { volver = null, abrir = null } = $props();
  let abierto = $state(abrir);
  const atras = () => (app.vista = volver);
  $effect(() => { if (abrir) document.getElementById('f-' + abrir)?.scrollIntoView({ block: 'start' }); });
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={atras} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">En qué se basa PARE</span></div>
  <h1>En qué se basa PARE</h1>
  <p class="sec peq">Cada decisión de la app, explicada y con los estudios en los que se apoya. Donde PARE ha tenido que decidir algo que los estudios no dicen tal cual, lo pone como «criterio de PARE».</p>

  {#each FUNDAMENTOS as [bloque, items]}
    <span class="etiqueta">{bloque}</span>
    {#each items as f (f.id)}
      <section class="tarjeta fund" id="f-{f.id}">
        <button class="cab" onclick={() => (abierto = abierto === f.id ? null : f.id)} aria-expanded={abierto === f.id}>
          <b>{f.t}</b><span class="flecha" class:abierta={abierto === f.id}><Icono n="atras" tam={18} /></span>
        </button>
        {#if abierto === f.id}
          <div class="cuerpo">
            <p>{f.x}</p>
            {#if f.criterio}<p class="sec peq"><b>{f.etiqueta ?? 'Criterio de PARE'}:</b> {f.criterio}</p>{/if}
            {#if f.refs?.length}
              <span class="etiqueta">Referencias</span>
              <ul class="refs">
                {#each f.refs as r}
                  {@const ref = REFS[r]}
                  {#if ref}<li class="peq">{#each ref.apa.split('*') as trozo, k}{#if k % 2}<i>{trozo}</i>{:else}{trozo}{/if}{/each}{#if ref.url}{' '}<a href={ref.url} target="_blank" rel="noopener">{ref.url}</a>{/if}</li>{/if}
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </section>
    {/each}
  {/each}
  <p class="sec peq">PARE da criterios generales de entrenamiento y nutrición; no es consejo médico.</p>
</div>

<style>
  .fund { padding: 0; gap: 0; scroll-margin-top: 12px; }
  .cab { all: unset; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; font-size: 16px; min-height: 52px; }
  .cab:focus-visible { outline: 2px solid var(--acento); outline-offset: -2px; border-radius: 12px; }
  .flecha { transform: rotate(-90deg); color: var(--texto2); transition: transform 0.15s; display: flex; }
  .flecha.abierta { transform: rotate(90deg); }
  .cuerpo { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; line-height: 1.45; }
  .cuerpo p { margin: 0; }
  .refs { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; color: var(--texto2); }
  .refs li { padding-left: 1.4em; text-indent: -1.4em; overflow-wrap: anywhere; } /* sangría francesa, como en APA */
  .refs a { color: var(--acento); }
</style>
