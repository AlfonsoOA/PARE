<script>
  import { wodsHechos, mejoresWod, resumenWod, textoResultado, ESCALAS } from '../lib/wods.js';
  import { app, hoyISO } from '../lib/estado.svelte.js';
  import { ej, GRUPOS, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { volumenSemana, lunes, BANDA, banda, mejorSerie, usaPesoCorporal, deltoidesSemana, MIN_CABEZA } from '../lib/entreno.js';
  import { estadosEjercicios } from '../lib/avisos.js';
  import { grasaNavy } from '../lib/plan.js';
  import { sumar } from '../lib/dieta.js';
  import { fmt, fmtCarga, fmtNum, fmtFecha, fmtMin, mostrar, ud } from '../lib/unidades.js';
  import Grafica from '../componentes/Grafica.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import AnotarMedida from '../componentes/AnotarMedida.svelte';
  import ContrasteBascula from '../componentes/ContrasteBascula.svelte';
  import { barrerasFrecuentes, NOMBRE_BARRERA, pautasDe, nivel, P_ESTADO } from '../lib/adherencia.js';

  // Si se pasa `datos` (modo entrenador), se muestran los de ese deportista en solo lectura.
  let { datos = null, depId = null } = $props();
  let d = $derived(datos ?? app.datos);
  const lectura = $derived(!!datos);
  let sub = $state(app.subProgreso || 'ejercicios');
  const wods = $derived(wodsHechos(d.sesiones));
  let detalle = $state(null);
  let medir = $state(false);

  const ESTADO = { progresando: ['Progresando', 'bien'], estable: ['Estable', ''], estancado: ['Estancado', 'aviso'], bajando: ['Bajando', 'mal'], mantiene: ['Mantiene en déficit', 'bien'], nuevo: ['Pocos datos', ''] };
  const estados = $derived(Object.entries(estadosEjercicios(d)).filter(([, e]) => e.hist.length)
    .sort((a, b) => b[1].hist.at(-1).fecha.localeCompare(a[1].hist.at(-1).fecha)));

  const semanas = $derived.by(() => {
    const out = [];
    let l = lunes(hoyISO());
    for (let k = 0; k < 8; k++) {
      out.push({ lunes: l, v: volumenSemana(d.sesiones, l), delt: deltoidesSemana(d.sesiones, l) });
      const x = new Date(l + 'T12:00:00'); x.setDate(x.getDate() - 7); l = x.toISOString().slice(0, 10);
    }
    return out;
  });

  const pesos = $derived(d.medidas.filter((m) => m.peso).map((m) => ({ f: m.fecha, v: mostrar(m.peso) })));
  const mediaMovil = $derived(pesos.map((p) => {
    const desde = new Date(Date.parse(p.f) - 6 * 864e5).toISOString().slice(0, 10);
    const w = pesos.filter((q) => q.f >= desde && q.f <= p.f);
    return { f: p.f, v: w.reduce((s, q) => s + q.v, 0) / w.length };
  }));
  const cinturas = $derived(d.medidas.filter((m) => m.cintura).map((m) => ({ f: m.fecha, v: m.cintura })));
  const grasa = $derived.by(() => {
    const ult = [...d.medidas].reverse().find((m) => m.cintura && m.cuello);
    if (!ult || !d.perfil.altura) return null;
    return grasaNavy({ sexo: d.perfil.sexo, altura: d.perfil.altura, cintura: ult.cintura, cuello: ult.cuello, cadera: ult.cadera });
  });
</script>

<div class="pantalla">
  {#if !lectura}<div class="cabecera"><h1>Progreso</h1></div>{/if}
  <div class="pestanas" role="tablist">
    {#each [['ejercicios', 'Ejercicios'], ...(wods.length ? [['wod', 'WOD']] : []), ['volumen', 'Volumen'], ['cuerpo', 'Cuerpo'], ['adherencia', 'Adherencia'], ['historial', 'Historial']] as [v, l]}
      <button role="tab" aria-selected={sub === v} class:on={sub === v} onclick={() => { sub = v; app.subProgreso = v; }}>{l}</button>
    {/each}
  </div>

  {#if sub === 'ejercicios'}
    <p class="sec peq">Nivel actual: <b>{d.perfil.nivel}</b>{d.perfil.faseDieta === 'deficit' ? ' · en déficit: mantener la fuerza ya es ganar' : ''}.</p>
    {#each estados as [id, e]}
      {@const m = mejorSerie(e.hist.at(-1).series)}
      <button class="tarjeta fila entre pulsable" onclick={() => (app.vista = { nombre: 'progresoEj', id, acento: 'progreso', datos, depId })}>
        <span class="col" style="gap:2px;align-items:flex-start;min-width:0">
          <b>{ej(id)?.n ?? id}</b>
          <span class="sec peq">Última: {fmtCarga(m.carga, usaPesoCorporal(ej(id)))} × {m.reps} · {fmtFecha(e.hist.at(-1).fecha)} · {e.hist.length} sesiones</span>
        </span>
        <span class="insignia {ESTADO[e.estado]?.[1]}">{ESTADO[e.estado]?.[0]}</span>
      </button>
    {:else}
      <p class="vacio">Aún no hay series registradas. La primera sesión es la que más cuesta.</p>
    {/each}

  {:else if sub === 'volumen'}
    <div class="tarjeta">
      <span class="etiqueta">Esta semana · series por grupo</span>
      {#each GRUPOS as g}
        {@const v = semanas[0].v[g]}
        {@const bg = banda(g)}
        {@const tope = bg.max * 1.25}
        <div class="col" style="gap:4px">
          <div class="fila entre peq"><span>{NOMBRE_GRUPO[g]}</span><span class="sec">{fmtNum(v, 1)}</span></div>
          <div class="barra-p"><i style="width:{Math.min(100, (v / tope) * 100)}%"></i>{#if bg.min}<b style="left:{(bg.min / tope) * 100}%"></b>{/if}<b style="left:{(bg.max / tope) * 100}%"></b></div>
          {#if g === 'hombros' && v > 0}<div class="fila peq sec" style="gap:12px;justify-content:flex-end">{#each ['anterior', 'lateral', 'posterior'] as c}<span>{c} {fmtNum(semanas[0].delt[c], 1)}</span>{/each}</div>{/if}
        </div>
      {/each}
      <p class="sec peq">Las marcas señalan la banda recomendada ({BANDA.min}-{BANDA.max}; piernas {banda('piernas').min}-{banda('piernas').max}). Conteo fraccional: principal 1, secundario 0,5.</p>
    </div>
    <div class="tarjeta">
      <span class="etiqueta">Últimas 8 semanas</span>
      <div class="tabla">
        <table>
          <thead><tr><th>Grupo</th>{#each [...semanas].reverse() as s}<th>{fmtFecha(s.lunes)}</th>{/each}</tr></thead>
          <tbody>
            {#each GRUPOS as g}<tr><td>{NOMBRE_GRUPO[g]}</td>{#each [...semanas].reverse() as s}<td class:baja={s.v[g] > 0 && s.v[g] < banda(g).min} class:alta={s.v[g] > banda(g).max}>{s.v[g] ? fmtNum(s.v[g], 1) : '·'}</td>{/each}</tr>
              {#if g === 'hombros'}{#each ['lateral', 'posterior'] as c}<tr class="sub"><td>· {c}</td>{#each [...semanas].reverse() as s}<td class:baja={s.delt[c] > 0 && s.delt[c] < MIN_CABEZA(d.perfil.diasSemana)}>{s.delt[c] ? fmtNum(s.delt[c], 1) : '·'}</td>{/each}</tr>{/each}{/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  {:else if sub === 'cuerpo'}
    <div class="tarjeta">
      <div class="fila entre"><span class="etiqueta">Peso ({ud()})</span>{#if !lectura}<button class="enlace" onclick={() => (medir = true)}>Anotar</button>{/if}</div>
      <Grafica puntos={pesos} media={mediaMovil} unidad={ud()} />
      <p class="sec peq">Línea continua: el peso de cada día. Discontinua: la media de 7 días, que es la que cuenta.</p>
    </div>
    <div class="tarjeta">
      <span class="etiqueta">Cintura (cm)</span>
      <Grafica puntos={cinturas} unidad="cm" />
      {#if grasa != null}<p class="peq">Grasa corporal estimada (fórmula de la Marina de EE. UU.): <b>{fmtNum(grasa, 1)} %</b></p>{/if}
    </div>
    <ContrasteBascula datos={d} />

  {:else if sub === 'adherencia'}
    {@const enc = d.encuestas ?? []}
    {@const ult = enc.at(-1)}
    {#if !enc.length}
      <p class="sec peq">Cada dos semanas aparece en Hoy una revisión de menos de un minuto. Con ella, aquí verás cómo evoluciona tu adherencia a la dieta y al entreno.</p>
    {:else}
      <div class="tarjeta">
        <span class="etiqueta">Adherencia (%)</span>
        <Grafica puntos={enc.filter((e) => e.puntos.global != null).map((e) => ({ f: e.fecha, v: e.puntos.global }))} unidad="%" />
        <p class="peq">Última ({fmtFecha(ult.fecha)}): <b>{nivel(ult.puntos.global)} ({ult.puntos.global} %)</b>{[['dieta', ult.puntos.dieta], ['entreno', ult.puntos.entreno], ['hábito', ult.puntos.habito]].filter(([, v]) => v != null).map(([k, v]) => ` · ${k} ${v} %`).join('')}</p>
        {#if ult.auto?.previstas}<p class="sec peq">Sesiones: {ult.auto.hechas} de {ult.auto.previstas} previstas en {ult.auto.dias ?? 14} días.</p>{/if}
        <p class="sec peq">{P_ESTADO.map((p) => `${p.t.split(' (')[0]}: ${p.escala.find(([v]) => v === ult.r[p.id])?.[1]?.toLowerCase() ?? '—'}`).join(' · ')}</p>
      </div>
      {@const frec = barrerasFrecuentes(d)}
      {#if frec.length}
        <div class="tarjeta" style="gap:6px">
          <span class="etiqueta">Lo que más cuesta (últimas revisiones)</span>
          {#each frec.slice(0, 3) as f}
            <p class="peq"><b>{NOMBRE_BARRERA[f.id]}</b>{f.veces > 1 ? ` · ${f.veces} veces` : ''}</p>
            {#each pautasDe(f.id) as t}<p class="sec peq">· {t}</p>{/each}
          {/each}
        </div>
      {/if}
    {/if}
    <ContrasteBascula datos={d} />
    {#if !lectura}<button class="boton sec2 ancho" onclick={() => (app.vista = { nombre: 'encuesta', acento: 'progreso' })}>Hacer la revisión ahora</button>{/if}

  {:else if sub === 'wod'}
    <p class="sec peq">Cada WOD se compara solo consigo mismo y con la misma escala (RX, escalado o personalizado).</p>
    {#each wods as g (g.clave)}
      {@const mejores = mejoresWod(g.clave, d.sesiones)}
      <button class="tarjeta pulsable" onclick={() => (app.vista = { nombre: 'progresoWod', clave: g.clave, acento: 'progreso', datos: lectura ? datos : null })}>
        <div class="fila entre"><b>{g.wod.nombre || 'WOD'}</b><span class="sec peq">{g.n} {g.n === 1 ? 'vez' : 'veces'}</span></div>
        <span class="sec peq">{resumenWod(g.wod)}</span>
        <span class="peq">{#each Object.entries(mejores) as [esc, m]}<span class="marca">{ESCALAS[esc]}: <b>{textoResultado(m.s.wod, m.s.resultado)}</b></span>{/each}</span>
      </button>
    {/each}
  {:else}
    {#each [...d.sesiones].reverse() as s (s.id)}
      <button class="tarjeta pulsable" onclick={() => (s.tipo === 'wod' ? (app.vista = { nombre: 'progresoWod', clave: s.clave, acento: 'progreso', datos: lectura ? datos : null }) : (detalle = s))}>
        <div class="fila entre"><b>{s.nombre}</b><span class="sec peq">{fmtFecha(s.fecha)}</span></div>
        {#if s.tipo === 'wod'}
          <span class="sec peq">WOD · {ESCALAS[s.escala]} · {textoResultado(s.wod, s.resultado)}</span>
        {:else}
          <span class="sec peq">{fmtMin(s.duracion)} · {s.ejercicios.reduce((t, x) => t + x.series.filter((z) => z.hecha).length, 0)} series · {s.ejercicios.map((x) => ej(x.ej)?.n).join(', ')}</span>
        {/if}
      </button>
    {:else}
      <p class="vacio">Sin sesiones todavía.</p>
    {/each}
  {/if}
</div>

{#if detalle}
  <Hoja titulo="{detalle.nombre} · {fmtFecha(detalle.fecha)}" cerrar={() => (detalle = null)}>
    {#each detalle.ejercicios as x}
      <div class="col" style="gap:6px">
        <b>{ej(x.ej)?.n}</b>
        {#each x.series as z, k}
          <div class="fila">
            <span class="sec" style="width:18px">{k + 1}</span>
            {#if lectura}<span>{fmt(z.carga)} × {z.reps} {z.hecha ? '' : '(no hecha)'}</span>
            {:else}
              <input type="number" inputmode="decimal" step="0.25" value={mostrar(z.carga) ?? ''} onchange={(ev) => (z.carga = ev.target.value === '' ? null : (ud() === 'lb' ? +ev.target.value / 2.20462 : +ev.target.value))} aria-label="Carga" />
              <span class="sec">×</span>
              <input type="number" inputmode="numeric" bind:value={z.reps} aria-label="Repeticiones" />
              <input type="checkbox" bind:checked={z.hecha} aria-label="Hecha" style="width:26px;height:26px" />
            {/if}
          </div>
        {/each}
      </div>
    {/each}
    {#if detalle.nota}<p class="sec">{detalle.nota}</p>{/if}
    {#if !lectura}
      <button class="boton peligro ancho" onclick={() => { const i = app.datos.sesiones.findIndex((y) => y.id === detalle.id); if (i >= 0) app.datos.sesiones.splice(i, 1); detalle = null; }}>Borrar esta sesión</button>
    {/if}
  </Hoja>
{/if}
{#if medir}<AnotarMedida cerrar={() => (medir = false)} />{/if}

<style>
  .marca { margin-right: 12px; }
  .pestanas { display: flex; gap: 4px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 4px; }
  .pestanas button { flex: 1; background: none; border: 0; border-radius: 9px; min-height: 40px; color: var(--texto2); font-size: 14px; cursor: pointer; }
  .pestanas button.on { background: var(--elevada); color: var(--acento); font-weight: 600; }
  .pulsable { text-align: left; cursor: pointer; width: 100%; }
  .tabla { overflow-x: auto; }
  table { border-collapse: collapse; font-size: 13px; min-width: 100%; }
  th, td { padding: 6px 6px; text-align: center; border-bottom: 1px solid var(--borde); white-space: nowrap; }
  th:first-child, td:first-child { text-align: left; position: sticky; left: 0; background: var(--superficie); }
  th { color: var(--texto2); font-weight: 500; }
  td.baja { color: var(--aviso); }
  tr.sub td { color: var(--texto2); font-size: 12px; }
  td.alta { color: var(--entrenar); }
  .fila input[type='number'] { max-width: 90px; text-align: center; }
</style>
