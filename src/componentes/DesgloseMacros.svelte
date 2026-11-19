<script>
  // De dónde sale cada macro: lo anotado ordenado de más a menos, en el día o en la media de los últimos 7 días.
  // Las recetas van en una línea que se abre para ver sus ingredientes.
  import { app } from '../lib/estado.svelte.js';
  import { desglose, MACRO_NOMBRE } from '../lib/dieta.js';
  import { fmtNum, fmtFecha } from '../lib/unidades.js';
  let { fecha, macro = $bindable('g') } = $props();
  let ambito = $state('dia');
  let abierta = $state(null);
  const fechas = $derived(ambito === 'dia' ? [fecha] : Array.from({ length: 7 }, (_, i) => { const x = new Date(fecha + 'T12:00:00'); x.setDate(x.getDate() - i); return x.toISOString().slice(0, 10); }));
  const des = $derived(desglose(fechas));
  const div = $derived(Math.max(1, des.dias));
  const lineas = $derived(des.lineas.filter((l) => l.m[macro] > 0.05).sort((a, b) => b.m[macro] - a.m[macro]));
  const total = $derived(des.lineas.reduce((s, l) => s + l.m[macro], 0));
  const uni = $derived(macro === 'kcal' ? 'kcal' : 'g');
  const nombreComida = (id) => app.datos.dieta?.comidas.find((c) => c.id === id)?.nombre ?? id;
  const v = (x) => fmtNum(x / div, x / div < 10 && macro !== 'kcal' ? 1 : 0);
</script>

<div class="pestanas">
  {#each Object.entries(MACRO_NOMBRE) as [k, t]}<button class:on={macro === k} onclick={() => { macro = k; abierta = null; }}>{t}</button>{/each}
</div>
<div class="pestanas dos">
  <button class:on={ambito === 'dia'} onclick={() => { ambito = 'dia'; abierta = null; }}>Este día</button>
  <button class:on={ambito === 'semana'} onclick={() => { ambito = 'semana'; abierta = null; }}>Media de 7 días</button>
</div>
{#if !lineas.length}
  <p class="sec peq">No hay nada anotado {ambito === 'dia' ? 'este día' : 'en estos 7 días'}.</p>
{:else}
  <p class="peq"><b>{MACRO_NOMBRE[macro]}: {v(total)} {uni}{ambito === 'semana' ? ' al día' : ''}</b>
    {#if ambito === 'semana'}<span class="sec"> · media de {des.dias} {des.dias === 1 ? 'día' : 'días'} con registros, del {fmtFecha(fechas.at(-1))} al {fmtFecha(fecha)}</span>{/if}</p>
  <ul class="lista">
    {#each lineas as l (l.clave)}
      {@const pc = total > 0 ? (l.m[macro] / total) * 100 : 0}
      <li>
        <button class="lin" disabled={!l.hijos.length} onclick={() => (abierta = abierta === l.clave ? null : l.clave)} aria-expanded={abierta === l.clave}>
          <span class="nom"><span>{l.nombre}{#if l.hijos.length} <span class="sec">{abierta === l.clave ? '▾' : '▸'}</span>{/if}</span>
            <span class="sec peq">{ambito === 'dia' ? [...l.comidas].map(nombreComida).join(', ') : `${l.dias.size} de ${des.dias} días`}</span></span>
          <span class="num"><b>{v(l.m[macro])} {uni}</b> <span class="sec">{fmtNum(pc)} %</span></span>
          <span class="barra"><span style="width:{Math.max(1, pc)}%"></span></span>
        </button>
        {#if abierta === l.clave}
          <ul class="hijos">
            {#each l.hijos.filter((h) => h.m[macro] > 0.05).sort((a, b) => b.m[macro] - a.m[macro]) as h}
              <li class="peq"><span>{h.nombre}</span><span>{v(h.m[macro])} {uni}</span></li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
  <p class="sec peq">{ambito === 'semana' ? 'La media se hace sobre los días con algo anotado; un día sin anotar no cuenta como cero. ' : ''}En las recetas, toca la línea para ver qué ingrediente aporta cada parte.</p>
{/if}

<style>
  .pestanas { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 4px; margin-bottom: 8px; }
  .pestanas.dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pestanas button { white-space: nowrap; padding: 0 4px; background: none; border: 0; border-radius: 9px; min-height: 38px; color: var(--texto2); font-size: 13px; cursor: pointer; }
  .pestanas button.on { background: var(--elevada); color: var(--acento); font-weight: 600; }
  .lista, .hijos { list-style: none; margin: 0; padding: 0; }
  .lista > li { border-bottom: 1px solid var(--borde); }
  .lin { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 10px; padding: 10px 0; background: none; border: 0; color: inherit; text-align: left; font: inherit; cursor: pointer; }
  .lin:disabled { cursor: default; opacity: 1; }
  .nom { display: flex; flex-direction: column; min-width: 0; }
  .num { text-align: right; white-space: nowrap; }
  .barra { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: var(--borde); overflow: hidden; }
  .barra span { display: block; height: 100%; background: var(--acento); border-radius: 3px; }
  .hijos { padding: 0 0 10px 12px; }
  .hijos li { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; color: var(--texto2); }
</style>
