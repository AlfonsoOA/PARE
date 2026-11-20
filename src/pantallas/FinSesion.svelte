<script>
  import PorQue from '../componentes/PorQue.svelte';
  import { app, ir, aviso } from '../lib/estado.svelte.js';
  import { ej, GRUPOS, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { historialEjercicio, novedades, volumenSesionHecha, cargaEfectiva, usaPesoCorporal } from '../lib/entreno.js';
  import { propuestasPara, propuestaDe, pesoEnFecha } from '../lib/sesiones.js';
  import { copiaAutomatica } from '../lib/archivo.js';
  import { fmt, fmtMin, fmtNum, mostrar, guardar, ud, fmtReloj } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';

  let { id } = $props();
  const s = app.datos.sesiones.find((x) => x.id === id);
  const pc = s ? pesoEnFecha(s.fecha) : null;
  const tonelaje = s ? s.ejercicios.reduce((t, x) => t + x.series.filter((z) => z.hecha).reduce((u, z) => u + cargaEfectiva(ej(x.ej), z, pc) * (z.reps || 0), 0), 0) : 0;
  const series = s ? s.ejercicios.reduce((t, x) => t + x.series.filter((z) => z.hecha).length, 0) : 0;
  const vol = s ? volumenSesionHecha(s) : {};
  const logros = s ? s.ejercicios.flatMap((x) => {
    const n = novedades(historialEjercicio(app.datos.sesiones.filter((y) => y.fecha <= s.fecha), x.ej, (f) => pesoEnFecha(f)));
    return n.map((z) => ({ ...z, ej: x.ej }));
  }) : [];
  // Para la próxima: editable (en unidades de pantalla)
  // Si durante la sesión añadiste o quitaste series de la lista, se toma ese número para la rutina (cambio hecho a propósito);
  // una serie que se queda sin marcar no cuenta como quitada. Se avisa y se puede volver a lo de la rutina.
  const deHoy = (p) => s.ejercicios.find((y) => y.uid === p.uid) ?? s.ejercicios.find((y) => y.ej === p.ej);
  let prox = $state(s ? propuestasPara(s).map((p) => {
    const x = deHoy(p);
    const hoy = x?.series.length ?? null, rut = x?.objetivo?.series ?? +p.prop.series;
    const q = { ...p, rutSeries: rut, hoySeries: hoy, cargas: (p.prop.cargas?.length ? p.prop.cargas : [p.prop.carga]).map((c) => mostrar(c) ?? '') };
    if (hoy && hoy !== rut) q.prop = { ...p.prop, series: hoy };
    return q;
  }) : []);
  // una casilla de peso por serie (si se cambia el número de series, se repite el último peso)
  const casillas = (p) => Array.from({ length: Math.max(1, +p.prop.series || 1) }, (_, k) => k);
  const valorSerie = (p, k) => p.cargas[k] ?? p.cargas.at(-1) ?? '';
  // Tope de la máquina: marcarlo o quitarlo recalcula la propuesta (sube repeticiones en vez de peso)
  function cambiarTope(p, activo) {
    const d = app.datos;
    d.topes ||= {};
    if (activo) { const x = s.ejercicios.find((y) => y.uid === p.uid) ?? s.ejercicios.find((y) => y.ej === p.ej); d.topes[p.ej] = Math.max(...(x?.series ?? []).filter((z) => z.hecha).map((z) => z.carga ?? 0)); }
    else delete d.topes[p.ej];
    const n = propuestaDe(s, p.uid);
    if (n) Object.assign(p, n, { cargas: (n.prop.cargas?.length ? n.prop.cargas : [n.prop.carga]).map((c) => mostrar(c) ?? '') });
  }
  let nota = $state(s?.nota ?? '');
  let sensacion = $state(s?.sensacion ?? null);

  function guardarTodo() {
    s.nota = nota; s.sensacion = sensacion;
    const ses = app.datos.rutina?.sesiones.find((y) => y.id === s.sesionId);
    if (ses) {
      for (const p of prox) {
        const it = ses.items.find((y) => y.uid === p.uid);
        if (!it) continue;
        it.series = +p.prop.series; it.repMin = +p.prop.repMin; it.repMax = +p.prop.repMax;
        it.descanso = +p.prop.descanso;
        const cs = casillas(p).map((k) => valorSerie(p, k)).map((v) => (v === '' || v == null ? null : guardar(v)));
        if (cs.every((c) => c == null)) { it.carga = null; it.cargas = undefined; }
        else { const f = cs.map((c, k) => c ?? cs.slice(0, k).reverse().find((y) => y != null) ?? cs.find((y) => y != null)); it.cargas = f; it.carga = Math.max(...f); }
      }
    }
    aviso(copiaAutomatica() ? 'Guardado, y copia de seguridad en Descargas.' : 'Guardado. Earn your reward.');
    ir('hoy');
  }
</script>

{#if !s}
  <div class="pantalla"><p class="vacio">Sesión no encontrada.</p><button class="boton" onclick={() => ir('hoy')}>Ir a Hoy</button></div>
{:else}
<div class="pantalla">
  <span class="etiqueta acento">Sesión terminada</span>
  <h1>{s.nombre}</h1>

  <div class="tarjeta">
    <div class="fila entre envolver">
      <div><p class="cifra">{fmtMin(s.duracion)}</p><p class="sec peq">estimado {fmtMin(s.estimada)}</p></div>
      <div><p class="cifra">{series}</p><p class="sec peq">series</p></div>
      <div><p class="cifra">{fmtNum(mostrar(tonelaje))}</p><p class="sec peq">{ud()} movidos</p></div>
    </div>
  </div>

  {#if logros.length}
    <div class="tarjeta logros">
      <span class="etiqueta" style="color:var(--progreso)">Récords</span>
      {#each logros as l}
        <p class="fila"><Icono n="trofeo" tam={20} /> <span><b>{ej(l.ej)?.n}:</b> {fmt(usaPesoCorporal(ej(l.ej)) ? l.serie.carga : l.serie.carga)} × {l.serie.reps} — {l.tipo === '1rm' ? 'mejor serie de siempre' : 'récord de repeticiones'}.</span></p>
      {/each}
      <p class="sec peq">Earn your reward.</p>
    </div>
  {/if}

  <div class="tarjeta">
    <span class="etiqueta">Series añadidas a tu semana</span>
    <div class="fila envolver" style="gap:14px">
      {#each GRUPOS.filter((g) => vol[g] > 0) as g}<span class="peq"><b>{NOMBRE_GRUPO[g]}</b> +{fmtNum(vol[g], 1)}</span>{/each}
    </div>
  </div>

  {#if prox.length}
    <h2>Para la próxima</h2>
    <p class="sec peq">Lo que PARE propone para la próxima vez. Cámbialo aquí si quieres: se guarda en tu rutina.</p>
    {#each prox as p}
      {@const e = ej(p.ej)}
      <div class="tarjeta">
        <div class="fila entre"><b>{e?.n}</b>{#if p.cambiar}<span class="insignia aviso">Cámbialo</span>{:else if p.sube}<span class="insignia bien">Sube</span>{/if}</div>
        <p class="sec peq">{p.motivo}{#if p.tope != null} <PorQue id="tope" />{/if}</p>
        {#if !p.bw}
          {#if p.sospechaTope}<p class="peq aviso">Llevas 3 sesiones con el mismo peso aunque te tocaba subir. ¿Es el máximo de la máquina?</p>{/if}
          <label class="fila tope"><input type="checkbox" checked={p.tope != null} onchange={(ev) => cambiarTope(p, ev.currentTarget.checked)} /> <span class="peq">Es el máximo de la máquina{p.tope != null ? ` (${fmt(p.tope)})` : ''}</span></label>
        {/if}
        {#if p.hoySeries && p.hoySeries !== p.rutSeries}
          <p class="peq cambio">Hoy pusiste {p.hoySeries} series y tu rutina tenía {p.rutSeries}: {+p.prop.series === p.hoySeries ? 'se guardan las de hoy.' : `se mantienen ${p.prop.series}.`}
            {#if +p.prop.series === p.hoySeries}<button class="enlace" onclick={() => (p.prop.series = p.rutSeries)}>Mantener {p.rutSeries}</button>{:else}<button class="enlace" onclick={() => (p.prop.series = p.hoySeries)}>Usar las de hoy ({p.hoySeries})</button>{/if}</p>
        {/if}
        <div class="rej">
          <label class="campo">Series<input type="number" inputmode="numeric" bind:value={p.prop.series} /></label>
          <label class="campo">Reps mín.<input type="number" inputmode="numeric" bind:value={p.prop.repMin} /></label>
          <label class="campo">Reps máx.<input type="number" inputmode="numeric" bind:value={p.prop.repMax} /></label>
          <label class="campo">Descanso (s)<input type="number" inputmode="numeric" step="15" bind:value={p.prop.descanso} /></label>
        </div>
        <span class="etiqueta">{p.bw ? `Lastre por serie (${ud()})` : `Peso por serie (${ud()})`}</span>
        <div class="series">
          {#each casillas(p) as k}
            <label class="campo">S{k + 1}<input type="number" inputmode="decimal" step="0.25" value={valorSerie(p, k)} oninput={(ev) => (p.cargas[k] = ev.currentTarget.value)} aria-label="Peso de la serie {k + 1}" /></label>
          {/each}
        </div>
      </div>
    {/each}
  {/if}

  <div class="col">
    <span class="etiqueta">¿Qué tal?</span>
    <div class="fila envolver">{#each [[1, 'Fatal'], [2, 'Regular'], [3, 'Bien'], [4, 'Muy bien'], [5, 'Bestial']] as [v, l]}<button class="chip" class:on={sensacion === v} onclick={() => (sensacion = v)}>{l}</button>{/each}</div>
    <textarea placeholder="Nota (opcional)" bind:value={nota} aria-label="Nota de la sesión"></textarea>
  </div>
  <button class="boton ancho" onclick={guardarTodo}>Guardar</button>
</div>
{/if}

<style>
  .rej { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .rej input { text-align: center; padding: 0 6px; }
  .cambio { margin: 0; padding: 8px 10px; border-radius: 10px; background: var(--elevada); }
  .cambio .enlace { padding: 0; margin-left: 4px; }
  .series { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
  .series input { text-align: center; padding: 0 6px; }
  .tope { gap: 10px; align-items: center; min-height: 40px; }
  .tope input { width: 22px; height: 22px; flex: none; }
  .aviso { color: var(--aviso, #e0a030); }
  .logros { border-color: #5a4a1c; }
  .pantalla { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); }
</style>
