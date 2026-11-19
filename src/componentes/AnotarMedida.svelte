<script>
  import { app, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { enLb, mostrar, guardar, ud } from '../lib/unidades.js';
  import Hoja from './Hoja.svelte';
  import { MEDIDAS_EXTRA } from '../lib/medidas.js';
  let { cerrar } = $props();
  const hoy = hoyISO();
  const previa = app.datos.medidas.find((m) => m.fecha === hoy);
  let peso = $state(mostrar(previa?.peso ?? app.datos.medidas.at(-1)?.peso) ?? '');
  let cintura = $state(previa?.cintura ?? '');
  let cuello = $state(previa?.cuello ?? '');
  let extra = $state(Object.fromEntries(MEDIDAS_EXTRA.map(([k]) => [k, previa?.[k] ?? ''])));
  function guardarla() {
    const m = { fecha: hoy, peso: guardar(peso), cintura: cintura ? +cintura : null, cuello: cuello ? +cuello : null, ...Object.fromEntries(MEDIDAS_EXTRA.map(([k]) => [k, extra[k] !== '' && extra[k] != null ? +extra[k] : null])) };
    if (!Object.entries(m).some(([k, v]) => k !== 'fecha' && v)) return cerrar();
    const i = app.datos.medidas.findIndex((x) => x.fecha === hoy);
    if (i >= 0) app.datos.medidas[i] = { ...app.datos.medidas[i], ...Object.fromEntries(Object.entries(m).filter(([, v]) => v != null)) };
    else app.datos.medidas.push(m);
    app.datos.medidas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    aviso('Medida guardada');
    cerrar();
  }
</script>

<Hoja titulo="Medidas de hoy" {cerrar}>
  <label class="campo">Peso ({ud()})<input type="number" inputmode="decimal" step="0.1" bind:value={peso} /></label>
  <div class="fila">
    <label class="campo" style="flex:1">Cintura (cm)<input type="number" inputmode="decimal" bind:value={cintura} /></label>
    <label class="campo" style="flex:1">Cuello (cm)<input type="number" inputmode="decimal" bind:value={cuello} /></label>
  </div>
  <details class="mas">
    <summary>Más medidas (opcional)</summary>
    <div class="rejilla">
      {#each MEDIDAS_EXTRA as [k, n, u]}<label class="campo">{n} ({u})<input type="number" inputmode="decimal" step="0.1" bind:value={extra[k]} /></label>{/each}
    </div>
  </details>
  <p class="sec peq">El peso, a diario y al levantarte; la cintura, cada 2 semanas. Lo que cuenta es la media semanal.</p>
  <button class="boton ancho" onclick={guardarla}>Guardar</button>
</Hoja>

<style>
  .mas summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; color: var(--acento); font-weight: 600; }
  .rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
</style>
