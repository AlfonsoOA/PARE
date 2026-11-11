<script>
  import { app, ir, aviso } from '../lib/estado.svelte.js';
  import { ej, GRUPOS, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { historialEjercicio, novedades, volumenSesionHecha, cargaEfectiva, usaPesoCorporal } from '../lib/entreno.js';
  import { propuestasPara, pesoEnFecha } from '../lib/sesiones.js';
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
  let prox = $state(s ? propuestasPara(s).map((p) => ({ ...p, carga: mostrar(p.prop.carga) ?? '' })) : []);
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
        it.descanso = +p.prop.descanso; it.carga = p.carga === '' ? null : guardar(p.carga);
      }
    }
    aviso('Guardado. Earn your reward.');
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
        <div class="fila entre"><b>{e?.n}</b>{#if p.sube}<span class="insignia bien">Sube</span>{/if}</div>
        <p class="sec peq">{p.motivo}</p>
        <div class="rej">
          <label class="campo">Series<input type="number" inputmode="numeric" bind:value={p.prop.series} /></label>
          <label class="campo">Reps mín.<input type="number" inputmode="numeric" bind:value={p.prop.repMin} /></label>
          <label class="campo">Reps máx.<input type="number" inputmode="numeric" bind:value={p.prop.repMax} /></label>
          <label class="campo">{p.bw ? `Lastre (${ud()})` : `Carga (${ud()})`}<input type="number" inputmode="decimal" step="0.25" bind:value={p.carga} /></label>
          <label class="campo">Descanso (s)<input type="number" inputmode="numeric" step="15" bind:value={p.prop.descanso} /></label>
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
  .logros { border-color: #5a4a1c; }
  .pantalla { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); }
</style>
