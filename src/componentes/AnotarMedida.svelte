<script>
  import { app, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { enLb, mostrar, guardar, ud } from '../lib/unidades.js';
  import Hoja from './Hoja.svelte';
  let { cerrar } = $props();
  const hoy = hoyISO();
  const previa = app.datos.medidas.find((m) => m.fecha === hoy);
  let peso = $state(mostrar(previa?.peso ?? app.datos.medidas.at(-1)?.peso) ?? '');
  let cintura = $state(previa?.cintura ?? '');
  let cuello = $state(previa?.cuello ?? '');
  function guardarla() {
    const m = { fecha: hoy, peso: guardar(peso), cintura: cintura ? +cintura : null, cuello: cuello ? +cuello : null };
    if (!m.peso && !m.cintura) return cerrar();
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
  <p class="sec peq">El peso, a diario y al levantarte; la cintura, cada 2 semanas. Lo que cuenta es la media semanal.</p>
  <button class="boton ancho" onclick={guardarla}>Guardar</button>
</Hoja>
