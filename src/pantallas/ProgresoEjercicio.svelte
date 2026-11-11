<script>
  import { app } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { historialEjercicio, mejorSerie, recordsReps, estadoEjercicio, PLAZO_ESTANCAMIENTO, usaPesoCorporal } from '../lib/entreno.js';
  import { pesoEnFecha } from '../lib/sesiones.js';
  import { fmt, fmtFecha, fmtCarga, mostrar, ud } from '../lib/unidades.js';
  import Grafica from '../componentes/Grafica.svelte';
  import Icono from '../componentes/Icono.svelte';

  let { id, datos = null, depId = null, volver = null } = $props();
  const d = datos ?? app.datos;
  const e = ej(id);
  const hist = historialEjercicio(d.sesiones, id, (f) => pesoEnFecha(f, d));
  const rec = recordsReps(hist);
  const est = estadoEjercicio(hist, d.perfil.nivel, d.perfil.faseDieta, new Date().toISOString().slice(0, 10));
  const item = d.rutina?.sesiones.flatMap((s) => s.items).find((x) => x.ej === id);
  const e1 = hist.map((h) => ({ f: h.fecha, v: Math.round(mostrar(mejorSerie(h.series).e1rm) * 10) / 10 }));
  const pcEj = usaPesoCorporal(e);
  const mejor = hist.map((h) => ({ f: h.fecha, v: mostrar(mejorSerie(h.series).efectiva) }));
  // en ejercicios con peso corporal, lo que tú controlas: lastre (+) o asistencia (−) de la mejor serie
  const extra = hist.map((h) => ({ f: h.fecha, v: mostrar(mejorSerie(h.series).carga || 0) }));
  const atras = () => (app.vista = volver ?? (datos ? { nombre: 'deportista', id: depId, acento: 'yo' } : null));
  const aqui = { nombre: 'progresoEj', id, datos, depId, volver, acento: 'progreso' };
  const TXT = {
    progresando: 'Progresando: has mejorado en las últimas dos semanas.',
    estable: 'Estable: sin mejora reciente, pero dentro de lo normal para tu nivel.',
    estancado: `Estancado: más de ${Math.round(PLAZO_ESTANCAMIENTO[d.perfil.nivel] / 7)} semanas sin mejorar el 1RM estimado ni ningún récord de repeticiones. Prueba otro rango, una variante o más descanso.`,
    bajando: 'Bajando: tus últimas tres sesiones están por debajo de tu mejor marca.',
    mantiene: 'Estás en déficit y mantienes la fuerza: eso es ganar.',
    nuevo: 'Pocos datos todavía: hacen falta al menos tres sesiones.',
  };
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={atras} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Progreso</span></div>
  <h1>{e?.n ?? id}</h1>
  <button class="enlace" style="align-self:flex-start;padding:0;min-height:32px" onclick={() => (app.vista = { nombre: 'ficha', id, acento: 'progreso', volver: aqui })}>Ver ficha técnica</button>
  <div class="tarjeta"><p>{TXT[est.estado]}</p>
    {#if item}<p class="sec peq">Próxima vez: {item.series} × {item.repMin}-{item.repMax} con {item.carga != null ? fmtCarga(item.carga, pcEj) : 'la carga del último día'}.</p>{/if}
  </div>
  <div class="tarjeta">
    <span class="etiqueta">1RM estimado ({ud()})</span>
    <Grafica puntos={e1} unidad={ud()} />
    <p class="sec peq">Calculado con la mejor serie de cada sesión (fórmula de Epley). Sirve para comparar series con distinto número de repeticiones.{pcEj ? ' Incluye tu peso corporal: si adelgazas, puede bajar aunque estés más fuerte; mira también la gráfica de lastre y asistencia.' : ''}</p>
  </div>
  {#if pcEj}
    <div class="tarjeta">
      <span class="etiqueta">Lastre (+) o asistencia (−) de la mejor serie ({ud()})</span>
      <Grafica puntos={extra} unidad={ud()} cero />
      <p class="sec peq">Por encima de la línea, con lastre; por debajo, con asistencia. Subir es progresar: menos asistencia o más lastre.</p>
    </div>
  {/if}
  <div class="tarjeta">
    <span class="etiqueta">{pcEj ? 'Carga total movida en la mejor serie' : 'Carga de la mejor serie'} ({ud()})</span>
    <Grafica puntos={mejor} unidad={ud()} />
    {#if pcEj}<p class="sec peq">Tu peso corporal (la fracción que mueve este ejercicio) más el lastre o menos la asistencia.</p>{/if}
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Récords de repeticiones</span>
    {#each [1, 3, 5, 8, 10, 12, 15] as r}
      {#if rec[r]}<div class="fila entre peq"><span>{r} {r === 1 ? 'repetición' : 'repeticiones'}</span><span>{#if pcEj}<b>{fmtCarga(rec[r].carga, true)}</b> <span class="sec">({fmt(rec[r].efectiva)} total)</span>{:else}<b>{fmt(rec[r].efectiva)}</b>{/if} <span class="sec">· {fmtFecha(rec[r].fecha)}</span></span></div>{/if}
    {/each}
    {#if !Object.keys(rec).length}<p class="sec peq">Sin datos.</p>{/if}
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Últimas sesiones</span>
    {#each [...hist].reverse().slice(0, 8) as h}
      <div class="fila entre peq"><span class="sec">{fmtFecha(h.fecha)}</span><span>{h.series.map((z) => `${fmtCarga(z.carga, pcEj, false)}×${z.reps}`).join(' · ')}</span></div>
    {/each}
  </div>
</div>
