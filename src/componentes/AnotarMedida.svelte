<script>
  import { app, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { enLb, mostrar, guardar, ud } from '../lib/unidades.js';
  import Hoja from './Hoja.svelte';
  import { MEDIDAS_EXTRA } from '../lib/medidas.js';
  import GuiaMedidas from './GuiaMedidas.svelte';
  let { cerrar } = $props();
  const hoy = hoyISO();
  // se puede anotar otro día (p. ej., una pesada antigua): al cambiar la fecha se cargan las medidas de ese día
  let fecha = $state(hoy);
  let peso = $state(''), cintura = $state(''), cuello = $state('');
  let extra = $state(Object.fromEntries(MEDIDAS_EXTRA.map(([k]) => [k, ''])));
  let guia = $state(false);
  $effect(() => {
    const previa = app.datos.medidas.find((m) => m.fecha === fecha);
    peso = mostrar(previa?.peso ?? (fecha === hoy ? app.datos.medidas.at(-1)?.peso : null)) ?? '';
    cintura = previa?.cintura ?? ''; cuello = previa?.cuello ?? '';
    extra = Object.fromEntries(MEDIDAS_EXTRA.map(([k]) => [k, previa?.[k] ?? '']));
  });
  function guardarla() {
    if (!fecha) return;
    const m = { fecha, peso: guardar(peso), cintura: cintura ? +cintura : null, cuello: cuello ? +cuello : null, ...Object.fromEntries(MEDIDAS_EXTRA.map(([k]) => [k, extra[k] !== '' && extra[k] != null ? +extra[k] : null])) };
    if (!Object.entries(m).some(([k, v]) => k !== 'fecha' && v)) return cerrar();
    const i = app.datos.medidas.findIndex((x) => x.fecha === fecha);
    if (i >= 0) app.datos.medidas[i] = { ...app.datos.medidas[i], ...Object.fromEntries(Object.entries(m).filter(([, v]) => v != null)) };
    else app.datos.medidas.push(m);
    app.datos.medidas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    aviso('Medida guardada');
    cerrar();
  }
</script>

<Hoja titulo="Anotar medidas" {cerrar}>
  <label class="campo">Fecha<input type="date" max={hoy} bind:value={fecha} /></label>
  {#if fecha !== hoy}<p class="sec peq">Vas a anotar o corregir las medidas del {new Date(fecha + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>{/if}
  <label class="campo">Peso ({ud()})<input type="number" inputmode="decimal" step="0.1" bind:value={peso} /></label>
  <div class="fila">
    <label class="campo" style="flex:1">Cintura (cm)<input type="number" inputmode="decimal" bind:value={cintura} /></label>
    <label class="campo" style="flex:1">Cuello (cm)<input type="number" inputmode="decimal" bind:value={cuello} /></label>
  </div>
  <button class="enlace" style="align-self:flex-start" onclick={() => (guia = !guia)}>{guia ? 'Ocultar' : '¿Cómo y dónde medir?'}</button>
  {#if guia}<GuiaMedidas />{/if}
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
