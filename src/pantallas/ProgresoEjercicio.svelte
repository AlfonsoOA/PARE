<script>
  import { app } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { historialEjercicio, mejorSerie, recordsReps, estadoEjercicio, PLAZO_ESTANCAMIENTO } from '../lib/entreno.js';
  import { pesoEnFecha } from '../lib/sesiones.js';
  import { fmt, fmtFecha, mostrar, ud } from '../lib/unidades.js';
  import Grafica from '../componentes/Grafica.svelte';
  import Icono from '../componentes/Icono.svelte';

  let { id, datos = null, depId = null } = $props();
  const d = datos ?? app.datos;
  const e = ej(id);
  const hist = historialEjercicio(d.sesiones, id, (f) => pesoEnFecha(f, d));
  const rec = recordsReps(hist);
  const est = estadoEjercicio(hist, d.perfil.nivel, d.perfil.faseDieta, new Date().toISOString().slice(0, 10));
  const item = d.rutina?.sesiones.flatMap((s) => s.items).find((x) => x.ej === id);
  const e1 = hist.map((h) => ({ f: h.fecha, v: Math.round(mostrar(mejorSerie(h.series).e1rm) * 10) / 10 }));
  const mejor = hist.map((h) => ({ f: h.fecha, v: mostrar(mejorSerie(h.series).efectiva) }));
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
  <div class="fila"><button class="icono-b" onclick={() => (app.vista = datos ? { nombre: 'deportista', id: depId, acento: 'yo' } : null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Progreso</span></div>
  <h1>{e?.n ?? id}</h1>
  <div class="tarjeta"><p>{TXT[est.estado]}</p>
    {#if item}<p class="sec peq">Próxima vez: {item.series} × {item.repMin}-{item.repMax} con {item.carga != null ? fmt(item.carga) : 'la carga del último día'}.</p>{/if}
  </div>
  <div class="tarjeta">
    <span class="etiqueta">1RM estimado ({ud()})</span>
    <Grafica puntos={e1} unidad={ud()} />
    <p class="sec peq">Calculado con la mejor serie de cada sesión (fórmula de Epley). Sirve para comparar series con distinto número de repeticiones.</p>
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Carga de la mejor serie ({ud()})</span>
    <Grafica puntos={mejor} unidad={ud()} />
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Récords de repeticiones</span>
    {#each [1, 3, 5, 8, 10, 12, 15] as r}
      {#if rec[r]}<div class="fila entre peq"><span>{r} {r === 1 ? 'repetición' : 'repeticiones'}</span><span><b>{fmt(rec[r].efectiva)}</b> <span class="sec">· {fmtFecha(rec[r].fecha)}</span></span></div>{/if}
    {/each}
    {#if !Object.keys(rec).length}<p class="sec peq">Sin datos.</p>{/if}
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Últimas sesiones</span>
    {#each [...hist].reverse().slice(0, 8) as h}
      <div class="fila entre peq"><span class="sec">{fmtFecha(h.fecha)}</span><span>{h.series.map((z) => `${fmt(z.carga, false)}×${z.reps}`).join(' · ')}</span></div>
    {/each}
  </div>
</div>
