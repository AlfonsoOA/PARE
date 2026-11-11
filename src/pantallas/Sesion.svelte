<script>
  import { onDestroy, onMount } from 'svelte';
  import { app, uuid } from '../lib/estado.svelte.js';
  import { ej, cat, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { bloques, etiquetasBloque, avisosSuperseries, restriccion, incremento, usaPesoCorporal, duracionSesion, descansoPorDefecto, DESCANSO_ENTRE_SUPERSERIE } from '../lib/entreno.js';
  import { terminarSesion, cancelarSesion, nuevaSerie, ultimaVez } from '../lib/sesiones.js';
  import { fmt, fmtReloj, fmtMin, mostrar, guardar, ud } from '../lib/unidades.js';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Animacion from '../componentes/Animacion.svelte';
  import Buscador from '../componentes/Buscador.svelte';

  const sa = app.sesionActiva;
  let ahora = $state(Date.now());
  const reloj = setInterval(() => (ahora = Date.now()), 500);
  let abierto = $state(sa ? Math.max(0, sa.ejercicios.findIndex((x) => x.series.some((z) => !z.hecha))) : 0);
  let hoja = $state(null); // { tipo: 'serie'|'menu'|'buscar'|'sustituir'|'terminar', i, k }
  let ed = $state({ carga: '', reps: 0, rir: null });

  // Pantalla encendida durante la sesión (si el móvil lo permite)
  let bloqueo = null;
  async function pedirPantalla() {
    if (!app.datos.ajustes.pantallaEncendida) return;
    try { bloqueo = await navigator.wakeLock?.request('screen'); } catch { /* sin permiso: no pasa nada */ }
  }
  const visible = () => { if (document.visibilityState === 'visible') pedirPantalla(); };
  onMount(() => { pedirPantalla(); document.addEventListener('visibilitychange', visible); });
  onDestroy(() => { clearInterval(reloj); bloqueo?.release?.().catch(() => {}); document.removeEventListener('visibilitychange', visible); });

  const objetivo = $derived(app.datos.rutina?.objetivo ?? 'hipertrofia');
  const et = $derived(sa ? etiquetasBloque(sa.ejercicios) : []);
  const avisosSS = $derived(sa ? avisosSuperseries(sa.ejercicios) : []);
  const transcurrido = $derived(sa ? (ahora - sa.inicio) / 1000 : 0);
  const restante = $derived.by(() => {
    if (!sa) return 0;
    const items = sa.ejercicios.map((x) => ({ ...x, series: x.series.filter((z) => !z.hecha).length }))
      .filter((x) => x.series > 0);
    return items.length ? duracionSesion(items, app.datos.ajustes) : 0;
  });
  const descansoRest = $derived(sa?.descanso ? (sa.descanso.fin - ahora) / 1000 : null);
  const hechas = $derived(sa ? sa.ejercicios.reduce((s, x) => s + x.series.filter((z) => z.hecha).length, 0) : 0);
  const totales = $derived(sa ? sa.ejercicios.reduce((s, x) => s + x.series.length, 0) : 0);
  const pc = $derived(app.datos.medidas.filter((m) => m.peso).at(-1)?.peso ?? null);

  $effect(() => { if (sa?.descanso && descansoRest != null && descansoRest <= -1) sa.descanso = null; });

  function bloqueDe(i) { return bloques(sa.ejercicios).find((b) => b.some((x) => x.i === i)).map((x) => x.i); }

  function despuesDeSerie(i) {
    const b = bloqueDe(i);
    const pos = b.indexOf(i);
    const x = sa.ejercicios[i];
    // superserie: pasa al siguiente del bloque sin descanso
    if (b.length > 1 && pos < b.length - 1) {
      sa.descanso = { fin: Date.now() + DESCANSO_ENTRE_SUPERSERIE * 1000, total: DESCANSO_ENTRE_SUPERSERIE, corto: true };
      abierto = b[pos + 1];
      return;
    }
    const desc = Math.max(...b.map((j) => sa.ejercicios[j].descanso || 90));
    const quedan = b.some((j) => sa.ejercicios[j].series.some((z) => !z.hecha));
    if (quedan) {
      sa.descanso = { fin: Date.now() + desc * 1000, total: desc };
      abierto = b.find((j) => sa.ejercicios[j].series.some((z) => !z.hecha)) ?? i;
    } else {
      const sig = sa.ejercicios.findIndex((y, j) => j > i && y.series.some((z) => !z.hecha));
      sa.descanso = sig >= 0 ? { fin: Date.now() + desc * 1000, total: desc } : null;
      abierto = sig >= 0 ? sig : i;
    }
    void x;
  }

  function casilla(i, k) {
    const x = sa.ejercicios[i], z = x.series[k], e = ej(x.ej);
    if (z.hecha) { z.hecha = false; return; }
    if (z.carga == null && !usaPesoCorporal(e) && e?.carga !== 'sin_carga') { abrirSerie(i, k); return; }
    z.hecha = true;
    // la siguiente serie hereda la carga de esta si no tenía
    const sig = x.series[k + 1];
    if (sig && sig.carga == null) sig.carga = z.carga;
    despuesDeSerie(i);
  }
  function abrirSerie(i, k) {
    const z = sa.ejercicios[i].series[k];
    const prev = sa.ejercicios[i].series[k - 1];
    ed = { carga: mostrar(z.carga ?? prev?.carga ?? null) ?? '', reps: z.reps ?? sa.ejercicios[i].objetivo.repMin, rir: z.rir };
    hoja = { tipo: 'serie', i, k };
  }
  function guardarSerie(marcar) {
    const { i, k } = hoja;
    const x = sa.ejercicios[i], z = x.series[k];
    z.carga = ed.carga === '' || ed.carga == null ? (usaPesoCorporal(ej(x.ej)) ? 0 : null) : guardar(ed.carga);
    z.reps = +ed.reps;
    z.rir = ed.rir;
    for (let j = k + 1; j < x.series.length; j++) if (!x.series[j].hecha && x.series[j].carga == null) x.series[j].carga = z.carga;
    const antes = z.hecha;
    if (marcar) z.hecha = true;
    hoja = null;
    if (marcar && !antes) despuesDeSerie(i);
  }
  const paso = (i) => incremento(sa.ejercicios[i].ej, app.datos.ajustes);
  const masCarga = (s) => { const v = (+ed.carga || 0) + s * (mostrar(paso(hoja.i)) || 1); ed.carga = Math.round(v * 100) / 100; };

  // ---- Menú del ejercicio ----
  function anadirSerie(i) { const x = sa.ejercicios[i]; const u = x.series.at(-1); x.series.push({ carga: u?.carga ?? x.objetivo.carga, reps: u?.reps ?? x.objetivo.repMin, hecha: false, rir: null }); hoja = null; }
  function quitarSerie(i) { const x = sa.ejercicios[i]; const k = x.series.findLastIndex((z) => !z.hecha); if (k >= 0) x.series.splice(k, 1); hoja = null; }
  function mover(i, dir) {
    const j = i + dir; if (j < 0 || j >= sa.ejercicios.length) return;
    const [x] = sa.ejercicios.splice(i, 1); sa.ejercicios.splice(j, 0, x); abierto = j; hoja = null;
  }
  function unir(i) { sa.ejercicios[i].unir = !sa.ejercicios[i].unir; hoja = null; }
  function quitar(i) { sa.ejercicios.splice(i, 1); abierto = Math.min(abierto, sa.ejercicios.length - 1); hoja = null; }
  function anadir(id) {
    const it = { uid: uuid(), ej: id, series: 3, repMin: 8, repMax: 12, carga: null, descanso: descansoPorDefecto(id, objetivo) };
    const previa = ultimaVez(id);
    sa.ejercicios.push({ uid: it.uid, ej: id, unir: false, descanso: it.descanso, objetivo: { series: 3, repMin: 8, repMax: 12, carga: null }, series: Array.from({ length: 3 }, (_, k) => nuevaSerie(it, previa, k)) });
    abierto = sa.ejercicios.length - 1; hoja = null;
  }
  function sustituir(i, id) {
    const x = sa.ejercicios[i];
    x.ej = id; x.objetivo.carga = null;
    x.series.forEach((z) => { if (!z.hecha) z.carga = null; });
    hoja = null;
  }
  const alternativas = (i) => {
    const e = ej(sa.ejercicios[i].ej);
    const fam = e?.fam ? cat.variantes[e.fam] || [] : [];
    const mismoPatron = cat.ejercicios.filter((y) => y.pat === e?.pat).map((y) => y.id);
    return [...new Set([...fam, ...mismoPatron])].filter((id) => id !== e?.id && restriccion(id, app.datos.perfil.molestias)?.nivel !== 'evitar');
  };
  const pendientes = $derived(totales - hechas);
  const desc = (z, e) => (usaPesoCorporal(e) ? (z.carga ? (z.carga > 0 ? `PC + ${fmt(z.carga, false)}` : `PC − ${fmt(-z.carga, false)}`) : 'PC') : z.carga == null ? '¿peso?' : fmt(z.carga, false));
</script>

{#if !sa}
  <div class="pantalla"><p class="vacio">No hay ninguna sesión en curso.</p><button class="boton" onclick={() => (app.vista = null)}>Volver</button></div>
{:else}
<div class="sesion">
  <header>
    <button class="icono-b" onclick={() => (app.vista = null)} aria-label="Salir sin terminar (la sesión sigue abierta)"><Icono n="atras" /></button>
    <div class="col" style="gap:0;min-width:0;flex:1">
      <b class="tit">{sa.nombre}</b>
      <span class="sec peq">{fmtReloj(transcurrido)} · quedan ~{fmtMin(restante)} · {hechas}/{totales} series</span>
    </div>
    <button class="boton" style="min-height:44px;padding:0 14px" onclick={() => (hoja = { tipo: 'terminar' })}>Terminar</button>
  </header>

  <div class="lista">
    {#each sa.ejercicios as x, i (x.uid)}
      {@const e = ej(x.ej)}
      {@const r = restriccion(x.ej, app.datos.perfil.molestias)}
      {@const hechasX = x.series.filter((z) => z.hecha).length}
      {@const prev = ultimaVez(x.ej)}
      {@const ss = avisosSS.find((a) => a.i === i)}
      {#if ss}
        <div class="ss-aviso" class:etq={ss.nivel === 'etiqueta'}>{#if ss.nivel === 'aviso'}<Icono n="aviso" tam={16} />{/if}{ss.texto}</div>
      {/if}
      <section class="ej" class:abierto={abierto === i} class:hecho={hechasX === x.series.length} class:unido={x.unir}>
        <div class="cab">
          <button class="nombre" onclick={() => (abierto = abierto === i ? -1 : i)} aria-expanded={abierto === i}>
            {#if et[i]}<span class="ssl">{et[i]}</span>{/if}
            <span class="col" style="gap:0;min-width:0;align-items:flex-start">
              <b>{e?.n ?? x.ej}</b>
              <span class="sec peq">{hechasX}/{x.series.length} series · {x.objetivo.repMin}-{x.objetivo.repMax}{e?.ud === 'tiempo' ? ' s' : ' reps'} · descanso {fmtReloj(x.descanso)}</span>
            </span>
            {#if hechasX === x.series.length}<span class="ok"><Icono n="check" tam={20} /></span>{/if}
          </button>
          <button class="icono-b" onclick={() => (hoja = { tipo: 'menu', i })} aria-label="Opciones de {e?.n}"><Icono n="puntos" /></button>
        </div>

        {#if abierto === i}
          <div class="cuerpo">
            {#if e?.img}
              <button class="img" onclick={() => (app.vista = { nombre: 'ficha', id: x.ej, acento: 'entrenar', volver: { nombre: 'sesion', acento: 'entrenar' } })} aria-label="Ver ficha técnica de {e.n}">
                <Animacion id={x.ej} tam="peq" />
                <span class="sec peq">Ficha <Icono n="info" tam={16} /></span>
              </button>
            {:else}
              <button class="enlace" style="align-self:flex-start" onclick={() => (app.vista = { nombre: 'ficha', id: x.ej, acento: 'entrenar', volver: { nombre: 'sesion', acento: 'entrenar' } })}>Ver ficha técnica</button>
            {/if}
            {#if r && r.nivel !== 'recomendado'}<div class="aviso-l peq"><Icono n="aviso" tam={18} /><p><b>{r.zona}:</b> {r.motivo}</p></div>{/if}
            {#if usaPesoCorporal(e)}<p class="sec peq">PC = tu peso corporal{pc ? ` (${fmt(pc)})` : ''}. Apunta el lastre con + y la asistencia con −.</p>{/if}
            {#if x.objetivo.carga == null && !usaPesoCorporal(e) && !prev}
              <p class="guia peq">Primer día: elige un peso con el que te sobren 2-3 repeticiones y apúntalo.</p>
            {/if}

            {#each x.series as z, k}
              <div class="serie" class:hecha={z.hecha}>
                <button class="datos" onclick={() => abrirSerie(i, k)} aria-label="Editar serie {k + 1}">
                  <span class="n">{k + 1}</span>
                  <span class="carga">{desc(z, e)}</span>
                  <span class="por">×</span>
                  <span class="reps">{z.reps ?? '—'}</span>
                  {#if prev?.series[k]}<span class="ant">antes {desc(prev.series[k], e)}×{prev.series[k].reps}</span>{/if}
                </button>
                <button class="check" class:on={z.hecha} onclick={() => casilla(i, k)} aria-label={z.hecha ? 'Desmarcar serie' : 'Marcar serie como hecha'} aria-pressed={z.hecha}>
                  <Icono n="check" tam={26} />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/each}

    <button class="boton sec2 ancho" onclick={() => (hoja = { tipo: 'buscar' })}><Icono n="mas" /> Añadir ejercicio</button>
  </div>

  {#if sa.descanso && descansoRest != null}
    <div class="descanso" role="timer" aria-live="off">
      <div class="col" style="gap:0">
        <span class="sec peq">{sa.descanso.corto ? 'Cambio al siguiente' : 'Descanso'}</span>
        <span class="cuenta" class:fin={descansoRest <= 0}>{descansoRest > 0 ? fmtReloj(descansoRest) : '¡Vamos!'}</span>
      </div>
      <div class="barra-p" style="flex:1"><i style="width:{Math.max(0, Math.min(100, (1 - descansoRest / sa.descanso.total) * 100))}%"></i></div>
      <button class="icono-b" onclick={() => (sa.descanso.fin += 15000)} aria-label="Quince segundos más">+15</button>
      <button class="icono-b" onclick={() => (sa.descanso = null)} aria-label="Saltar descanso"><Icono n="cerrar" /></button>
    </div>
  {/if}
</div>

{#if hoja?.tipo === 'serie'}
  {@const x = sa.ejercicios[hoja.i]}
  {@const e = ej(x.ej)}
  <Hoja titulo="Serie {hoja.k + 1} · {e?.n}" cerrar={() => (hoja = null)}>
    <div class="ajuste">
      <span class="sec">{usaPesoCorporal(e) ? `Lastre (+) o asistencia (−), ${ud()}` : `Carga (${ud()})`}</span>
      <div class="fila">
        <button class="icono-b grande" onclick={() => masCarga(-1)} aria-label="Menos carga"><Icono n="menos" /></button>
        <input type="number" inputmode="decimal" step="0.25" bind:value={ed.carga} aria-label="Carga" class="num" />
        <button class="icono-b grande" onclick={() => masCarga(1)} aria-label="Más carga"><Icono n="mas" /></button>
      </div>
    </div>
    <div class="ajuste">
      <span class="sec">{e?.ud === 'tiempo' ? 'Segundos' : 'Repeticiones'}</span>
      <div class="fila">
        <button class="icono-b grande" onclick={() => (ed.reps = Math.max(0, +ed.reps - (e?.ud === 'tiempo' ? 5 : 1)))} aria-label="Menos"><Icono n="menos" /></button>
        <input type="number" inputmode="numeric" bind:value={ed.reps} aria-label="Repeticiones" class="num" />
        <button class="icono-b grande" onclick={() => (ed.reps = +ed.reps + (e?.ud === 'tiempo' ? 5 : 1))} aria-label="Más"><Icono n="mas" /></button>
      </div>
    </div>
    <details><summary class="sec">Repeticiones en reserva (RIR), opcional</summary>
      <div class="fila envolver" style="margin-top:8px">{#each [0, 1, 2, 3, 4] as v}<button class="chip" class:on={ed.rir === v} onclick={() => (ed.rir = ed.rir === v ? null : v)}>{v === 4 ? '4+' : v}</button>{/each}</div>
    </details>
    <button class="boton ancho" onclick={() => guardarSerie(true)}>Hecha</button>
    <button class="boton sec2 ancho" onclick={() => guardarSerie(false)}>Guardar sin marcar</button>
  </Hoja>
{/if}

{#if hoja?.tipo === 'menu'}
  {@const i = hoja.i}
  {@const x = sa.ejercicios[i]}
  <Hoja titulo={ej(x.ej)?.n} cerrar={() => (hoja = null)}>
    <button class="boton sec2 ancho" onclick={() => (hoja = { tipo: 'sustituir', i })}>Sustituir por otro</button>
    <div class="fila"><button class="boton sec2" style="flex:1" onclick={() => anadirSerie(i)}>+ Serie</button><button class="boton sec2" style="flex:1" onclick={() => quitarSerie(i)}>− Serie</button></div>
    {#if i < sa.ejercicios.length - 1}
      <button class="boton sec2 ancho" onclick={() => unir(i)}><Icono n="enlace" /> {x.unir ? 'Separar del siguiente' : 'Unir con el siguiente (superserie)'}</button>
    {/if}
    <div class="fila"><button class="boton sec2" style="flex:1" disabled={i === 0} onclick={() => mover(i, -1)}>Subir</button><button class="boton sec2" style="flex:1" disabled={i === sa.ejercicios.length - 1} onclick={() => mover(i, 1)}>Bajar</button></div>
    <label class="campo">Descanso (segundos)<input type="number" inputmode="numeric" step="15" bind:value={x.descanso} /></label>
    <button class="boton peligro ancho" onclick={() => quitar(i)}>Quitar de esta sesión</button>
  </Hoja>
{/if}

{#if hoja?.tipo === 'sustituir'}
  {@const i = hoja.i}
  <Buscador titulo="Sustituir" ids={alternativas(i)} cerrar={() => (hoja = null)} elegir={(id) => sustituir(i, id)} />
{/if}
{#if hoja?.tipo === 'buscar'}
  <Buscador cerrar={() => (hoja = null)} elegir={anadir} />
{/if}

{#if hoja?.tipo === 'terminar'}
  <Hoja titulo="¿Terminar la sesión?" cerrar={() => (hoja = null)}>
    {#if pendientes > 0}<p class="sec">Quedan {pendientes} series sin marcar; no contarán.</p>{:else}<p class="sec">Todas las series hechas.</p>{/if}
    <button class="boton ancho" disabled={hechas === 0} onclick={() => terminarSesion()}>Terminar y guardar</button>
    <button class="boton sec2 ancho" onclick={() => (hoja = null)}>Seguir entrenando</button>
    <button class="boton peligro ancho" onclick={() => (hoja = { tipo: 'descartar' })}>Descartar la sesión</button>
  </Hoja>
{/if}
{#if hoja?.tipo === 'descartar'}
  <Hoja titulo="¿Descartar la sesión?" cerrar={() => (hoja = null)}>
    <p class="sec">Se pierde lo anotado hoy y la secuencia no avanza.</p>
    <button class="boton peligro ancho" onclick={cancelarSesion}>Sí, descartar</button>
    <button class="boton sec2 ancho" onclick={() => (hoja = null)}>No</button>
  </Hoja>
{/if}
{/if}

<style>
  .sesion { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 120px); max-width: 640px; margin: 0 auto; }
  header {
    position: sticky; top: 0; z-index: 20; display: flex; gap: 10px; align-items: center; background: var(--fondo);
    padding: calc(env(safe-area-inset-top, 0px) + 10px) max(16px, env(safe-area-inset-right, 0px)) 10px max(16px, env(safe-area-inset-left, 0px));
    border-bottom: 1px solid var(--borde);
  }
  body:has(header) { background: var(--fondo); }
  .tit { font-family: var(--titulos); font-size: 22px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lista { display: flex; flex-direction: column; gap: 10px; padding: 12px max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); }
  .ej { background: var(--superficie); border: 1px solid var(--borde); border-radius: 14px; }
  .ej.abierto { border-color: var(--entrenar); }
  .ej.hecho:not(.abierto) { opacity: 0.6; }
  .ej.unido { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; margin-bottom: -6px; }
  .cab { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; }
  .nombre { flex: 1; display: flex; align-items: center; gap: 10px; background: none; border: 0; text-align: left; min-height: 56px; cursor: pointer; min-width: 0; }
  .ssl { font-family: var(--titulos); font-weight: 800; color: var(--entrenar); font-size: 20px; width: 28px; flex-shrink: 0; }
  .ok { color: var(--comer); margin-left: auto; }
  .cuerpo { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 10px; }
  .img { display: flex; align-items: center; gap: 10px; background: none; border: 0; padding: 0; cursor: pointer; color: inherit; }
  .guia { color: var(--progreso); }
  .serie { display: flex; gap: 8px; align-items: stretch; }
  .datos { flex: 1; display: flex; align-items: baseline; gap: 8px; background: var(--elevada); border: 1px solid var(--borde); border-radius: 12px; padding: 10px 12px; min-height: 60px; cursor: pointer; text-align: left; flex-wrap: wrap; }
  .serie.hecha .datos { border-color: #1f4a30; }
  .n { color: var(--texto2); font-size: 14px; width: 16px; }
  .carga, .reps { font-family: var(--titulos); font-weight: 800; font-size: 26px; line-height: 1; }
  .por { color: var(--texto2); }
  .ant { color: var(--texto2); font-size: 12px; margin-left: auto; align-self: center; }
  .check { width: 64px; flex-shrink: 0; border-radius: 12px; border: 2px solid var(--borde); background: var(--elevada); color: var(--texto2); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .check.on { background: var(--comer); border-color: var(--comer); color: var(--fondo); }
  .ss-aviso { font-size: 13px; color: var(--aviso); display: flex; gap: 6px; align-items: center; padding: 0 4px; }
  .ss-aviso.etq { color: var(--texto2); }
  .descanso {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; display: flex; align-items: center; gap: 12px; background: var(--elevada);
    border-top: 2px solid var(--entrenar); padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 12px) max(16px, env(safe-area-inset-left, 0px));
  }
  .cuenta { font-family: var(--titulos); font-weight: 800; font-size: 44px; line-height: 1; min-width: 104px; }
  .cuenta.fin { color: var(--comer); font-size: 32px; }
  .ajuste { display: flex; flex-direction: column; gap: 6px; }
  .num { text-align: center; font-family: var(--titulos); font-weight: 800; font-size: 32px !important; min-height: 60px !important; }
  .grande { width: 60px; height: 60px; }
  details summary { cursor: pointer; min-height: 32px; }
</style>
