<script>
  import { app, uuid, aviso } from '../lib/estado.svelte.js';
  import { ej, GRUPOS, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { duracionSesion, etiquetasBloque, bloques, avisosSuperseries, restriccion, volumenPlanificado, BANDA, banda } from '../lib/entreno.js';
  import { nuevoItem, generarRutina, repartosPara, REPARTO_POR_DEFECTO } from '../lib/plan.js';
  import Hoja from '../componentes/Hoja.svelte';
  import { fmtMin, fmtNum, mostrar, guardar, ud } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  import Buscador from '../componentes/Buscador.svelte';

  // modo 'propia' edita la rutina del deportista; modo 'entrenador' edita una copia de la de un deportista.
  let { modo = 'propia', depId = null } = $props();
  const dep = modo === 'entrenador' ? app.datos.entrenador.deportistas.find((x) => x.id === depId) : null;
  const origen = modo === 'entrenador' ? (dep?.propuesta?.rutina ?? dep?.datos?.rutina) : app.datos.rutina;
  const perfil = modo === 'entrenador' ? (dep?.datos?.perfil ?? {}) : app.datos.perfil;

  let r = $state(origen ? JSON.parse(JSON.stringify(origen)) : { id: uuid(), version: 0, nombre: 'Mi rutina', objetivo: 'hipertrofia', sesiones: [{ id: uuid(), nombre: 'Sesión A', exigente: false, items: [] }] });
  // Cargas en unidades de pantalla para editarlas
  for (const s of r.sesiones) for (const it of s.items) it._carga = mostrar(it.carga) ?? '';
  let abierta = $state(0);
  let buscar = $state(null); // índice de sesión donde añadir
  let reparto = $state(null); // hoja "Cambiar reparto": { dias }
  function montar(id) {
    const dias = reparto.dias;
    const cargas = {};
    for (const s of r.sesiones) for (const it of s.items) if (it._carga !== '' && it._carga != null) cargas[it.ej] = guardar(it._carga);
    let nueva;
    if (id === 'blanco') nueva = { id: uuid(), version: r.version, nombre: 'Mi rutina', objetivo: r.objetivo, sesiones: Array.from({ length: dias }, (_, k) => ({ id: uuid(), nombre: `Sesión ${String.fromCharCode(65 + k)}`, exigente: false, items: [] })) };
    else nueva = generarRutina({ ...perfil, diasSemana: dias }, app.datos.ajustes, id, cargas);
    for (const s of nueva.sesiones) for (const it of s.items) it._carga = mostrar(it.carga) ?? '';
    nueva.version = r.version;
    nueva._dias = dias;
    r = nueva;
    abierta = 0;
    reparto = null;
    aviso('Reparto cambiado. Revísalo y guarda.');
  }

  const dsem = $derived(r._dias || perfil.diasSemana || r.sesiones.length);
  const vol = $derived(volumenPlanificado(r, dsem));
  const balance = $derived.by(() => {
    let emp = 0, tir = 0, cua = 0, isq = 0;
    for (const s of r.sesiones) for (const it of s.items) {
      const p = ej(it.ej)?.pat ?? '';
      if (p.startsWith('empuje')) emp += +it.series; if (p.startsWith('traccion')) tir += +it.series;
      if (['sentadilla', 'zancada_unilateral', 'extension_rodilla'].includes(p)) cua += +it.series;
      if (['bisagra_cadera', 'flexion_rodilla', 'extension_cadera'].includes(p)) isq += +it.series;
    }
    return { emp, tir, cua, isq };
  });
  const avisos = $derived.by(() => {
    const out = [];
    for (const g of GRUPOS) {
      if (['antebrazos', 'cuello'].includes(g)) continue;
      if (vol[g] > banda(g, dsem).max) out.push(`${NOMBRE_GRUPO[g]}: ${fmtNum(vol[g], 1)} series a la semana. Más no es mejor, es más cansancio.`);
      else if (vol[g] < banda(g, dsem).min && ['pecho', 'espalda', 'hombros', 'piernas'].includes(g)) out.push(`${NOMBRE_GRUPO[g]}: ${fmtNum(vol[g], 1)} series a la semana. Se queda corta.`);
    }
    const { emp, tir, cua, isq } = balance;
    if (emp && tir && (emp / tir > 1.5 || tir / emp > 1.5)) out.push(`Empuje ${emp} series frente a tirón ${tir}: conviene equilibrarlos.`);
    if (cua && isq && (cua / isq > 2 || isq / cua > 2)) out.push(`Cuádriceps ${cua} series frente a isquios y glúteo ${isq}: descompensado.`);
    for (const s of r.sesiones) {
      const t = duracionSesion(s.items, app.datos.ajustes);
      if (perfil.minutos && t > perfil.minutos * 60 + 300) out.push(`${s.nombre} dura ${fmtMin(t)} y dijiste que tienes ${perfil.minutos} min.`);
      for (const it of s.items) {
        const rr = restriccion(it.ej, perfil.molestias);
        if (rr?.nivel === 'evitar') out.push(`${ej(it.ej)?.n}: a evitar por tu ${rr.zona}.`);
      }
    }
    return out;
  });

  function anadir(id) {
    const it = { ...nuevoItem(id, r.objetivo), _carga: '' };
    r.sesiones[buscar].items.push(it);
    buscar = null;
  }
  const moverS = (i, d) => { const j = i + d; if (j < 0 || j >= r.sesiones.length) return; const [x] = r.sesiones.splice(i, 1); r.sesiones.splice(j, 0, x); abierta = j; };
  const moverI = (s, k, d) => { const j = k + d; if (j < 0 || j >= s.items.length) return; const [x] = s.items.splice(k, 1); s.items.splice(j, 0, x); };
  const nuevaSesion = () => { r.sesiones.push({ id: uuid(), nombre: `Sesión ${String.fromCharCode(65 + r.sesiones.length)}`, exigente: false, items: [] }); abierta = r.sesiones.length - 1; };

  function guardarRutina() {
    const limpia = JSON.parse(JSON.stringify(r));
    for (const s of limpia.sesiones) {
      s.items = s.items.map(({ _carga, ...it }) => ({ ...it, series: +it.series, repMin: +it.repMin, repMax: Math.max(+it.repMin, +it.repMax), descanso: +it.descanso, carga: _carga === '' || _carga == null ? null : guardar(_carga) }));
      if (s.items.length) s.items.at(-1).unir = false;
    }
    limpia.version = (origen?.version ?? 0) + 1;
    if (limpia._dias) { if (modo === 'propia') app.datos.perfil.diasSemana = limpia._dias; delete limpia._dias; }
    limpia.modificada = new Date().toISOString();
    if (modo === 'entrenador') {
      dep.propuesta = { ...(dep.propuesta ?? {}), rutina: limpia };
      aviso('Cambios preparados. Envíalos desde la ficha del deportista.');
      app.vista = { nombre: 'deportista', id: depId, acento: 'yo' };
      return;
    }
    if (app.datos.rutina) app.datos.rutinasAnteriores.push(app.datos.rutina);
    const n = limpia.sesiones.length;
    if ((app.datos.secuencia.siguiente ?? 0) >= n) app.datos.secuencia.siguiente = 0;
    app.datos.secuencia.pendientes = (app.datos.secuencia.pendientes || []).filter((i) => i < n);
    app.datos.rutina = limpia;
    aviso('Rutina guardada');
    app.vista = null;
  }
  const inicial = JSON.stringify(r);
  let avisadoSalir = 0;
  function salir() {
    // con cambios sin guardar, la primera pulsación solo avisa (el gesto atrás de Android es fácil de dar sin querer)
    if (JSON.stringify(r) !== inicial && Date.now() - avisadoSalir > 2500) { avisadoSalir = Date.now(); aviso('Tienes cambios sin guardar. Pulsa otra vez para salir sin guardar.'); return; }
    app.vista = modo === 'entrenador' ? { nombre: 'deportista', id: depId, acento: 'yo' } : null;
  }
</script>

<div class="pantalla">
  <div class="fila entre">
    <button class="icono-b" data-atras onclick={salir} aria-label="Salir sin guardar"><Icono n="atras" /></button>
    <span class="etiqueta">{modo === 'entrenador' ? `Proponer cambios · ${dep?.nombre ?? ''}` : 'Editar rutina'}</span>
    <button class="boton" style="min-height:44px" onclick={guardarRutina}>Guardar</button>
  </div>

  <button class="boton sec2 ancho" onclick={() => (reparto = { dias: perfil.diasSemana || r.sesiones.length })}>Cambiar reparto (torso/pierna, empuje/tirón/pierna, Weider…)</button>
  <label class="campo">Nombre de la rutina<input type="text" bind:value={r.nombre} /></label>
  <div class="col"><span class="sec peq">Objetivo (para los descansos por defecto)</span>
    <div class="fila envolver">{#each [['hipertrofia', 'Hipertrofia'], ['fuerza', 'Fuerza'], ['salud', 'Salud']] as [v, l]}<button class="chip" class:on={r.objetivo === v} onclick={() => (r.objetivo = v)}>{l}</button>{/each}</div>
  </div>

  {#each r.sesiones as s, i (s.id)}
    {@const et = etiquetasBloque(s.items)}
    {@const ss = avisosSuperseries(s.items)}
    <div class="tarjeta">
      <div class="fila entre">
        <button class="abrir" onclick={() => (abierta = abierta === i ? -1 : i)} aria-expanded={abierta === i}>
          <h2>{i + 1}. {s.nombre}</h2>
          <span class="sec peq">{s.items.length} ejercicios · {fmtMin(duracionSesion(s.items, app.datos.ajustes))}</span>
        </button>
        <Icono n={abierta === i ? 'arriba' : 'abajo'} />
      </div>
      {#if abierta === i}
        <div class="fila"><input type="text" bind:value={s.nombre} aria-label="Nombre de la sesión" />
          <button class="icono-b" onclick={() => moverS(i, -1)} aria-label="Subir sesión"><Icono n="arriba" /></button>
          <button class="icono-b" onclick={() => moverS(i, 1)} aria-label="Bajar sesión"><Icono n="abajo" /></button>
        </div>
        <label class="fila peq"><input type="checkbox" bind:checked={s.exigente} style="width:22px;height:22px" /> Sesión exigente (días de más hidratos)</label>

        {#each bloques(s.items) as b (b[0].it.uid)}
        <div class:bloque-ss={b.length > 1} style:--ss={b.length > 1 ? `var(--ss-${(et[b[0].i].charCodeAt(0) - 65) % 2 + 1})` : null}>
        {#if b.length > 1}<div class="ss-cab"><Icono n="enlace" tam={16} /><b>Superserie {et[b[0].i][0]}</b> · {b.length} ejercicios sin descanso entre ellos</div>{/if}
        {#each b as y (y.it.uid)}
          {@const it = y.it}
          {@const k = y.i}
          {@const e = ej(it.ej)}
          {@const rr = restriccion(it.ej, perfil.molestias)}
          {@const a = ss.find((x) => x.i === k)}
          {#if a}<p class="ssa" class:etq={a.nivel === 'etiqueta'}>{a.texto}</p>{/if}
          <div class="item" class:unido={it.unir}>
            <div class="fila entre">
              <span class="fila" style="gap:8px;min-width:0">{#if et[k]}<b class="ssl">{et[k]}</b>{/if}<b class="nom">{e?.n ?? it.ej}</b></span>
              {#if rr && rr.nivel !== 'recomendado'}<span class="insignia {rr.nivel === 'evitar' ? 'mal' : 'aviso'}">{rr.nivel === 'evitar' ? 'Evitar' : 'Precaución'}</span>{/if}
            </div>
            <div class="rej">
              <label class="campo">Series<input type="number" inputmode="numeric" bind:value={it.series} /></label>
              <label class="campo">Reps<span class="fila" style="gap:4px"><input type="number" inputmode="numeric" bind:value={it.repMin} aria-label="Repeticiones mínimas" /><input type="number" inputmode="numeric" bind:value={it.repMax} aria-label="Repeticiones máximas" /></span></label>
              <label class="campo">{ud()}<input type="number" inputmode="decimal" step="0.25" bind:value={it._carga} placeholder="—" /></label>
              <label class="campo">Desc. (s)<input type="number" inputmode="numeric" step="15" bind:value={it.descanso} /></label>
            </div>
            <input type="text" bind:value={it.nota} placeholder="Nota (RPE, técnica…), opcional" aria-label="Nota del ejercicio" style="min-height:40px;font-size:14px" />
            <div class="fila acciones">
              <button class="icono-b" onclick={() => moverI(s, k, -1)} aria-label="Subir"><Icono n="arriba" /></button>
              <button class="icono-b" onclick={() => moverI(s, k, 1)} aria-label="Bajar"><Icono n="abajo" /></button>
              {#if k < s.items.length - 1}<button class="chip" class:on={it.unir} onclick={() => (it.unir = !it.unir)}>{it.unir ? 'Unido al siguiente' : 'Unir con el siguiente'}</button>{/if}
              <button class="icono-b" style="margin-left:auto" onclick={() => s.items.splice(k, 1)} aria-label="Quitar ejercicio"><Icono n="papelera" /></button>
            </div>
          </div>
        {/each}
        </div>
        {/each}
        <button class="boton sec2 ancho" onclick={() => (buscar = i)}><Icono n="mas" /> Añadir ejercicio</button>
        {#if r.sesiones.length > 1}<button class="boton peligro ancho" onclick={() => { r.sesiones.splice(i, 1); abierta = -1; }}>Quitar esta sesión</button>{/if}
      {/if}
    </div>
  {/each}
  <button class="boton sec2 ancho" onclick={nuevaSesion}><Icono n="mas" /> Añadir sesión</button>

  <div class="tarjeta">
    <span class="etiqueta">Volumen semanal previsto</span>
    {#each GRUPOS.filter((g) => vol[g] > 0) as g}
      <div class="fila entre peq"><span>{NOMBRE_GRUPO[g]}</span><span class:fuera={vol[g] > banda(g, dsem).max || vol[g] < banda(g, dsem).min}>{fmtNum(vol[g], 1)} series</span></div>
    {/each}
    <p class="sec peq">Banda recomendada: {BANDA.min}-{BANDA.max} series por grupo y semana; piernas, {banda('piernas').min}-{banda('piernas').max}, porque junta cuádriceps, isquios, glúteo y gemelo (principal 1, secundario 0,5).</p>
  </div>
  {#if avisos.length}
    <div class="tarjeta avisos">
      <span class="etiqueta" style="color:var(--aviso)">Avisos</span>
      {#each avisos as a}<p class="peq">· {a}</p>{/each}
      <p class="sec peq">Avisan, no impiden guardar: aquí mandas tú.</p>
    </div>
  {/if}
</div>

{#if buscar != null}<Buscador cerrar={() => (buscar = null)} elegir={anadir} />{/if}
{#if reparto}
  <Hoja titulo="Cambiar reparto" cerrar={() => (reparto = null)}>
    <span class="sec peq">Días por semana</span>
    <div class="fila">{#each [2, 3, 4, 5, 6] as n}<button class="chip" class:on={reparto.dias === n} onclick={() => (reparto.dias = n)}>{n}</button>{/each}</div>
    {#each repartosPara(reparto.dias) as rp}
      <button class="opcion" onclick={() => montar(rp.id)}>
        <b>{rp.nombre}{rp.id === REPARTO_POR_DEFECTO[reparto.dias] ? ' · recomendado' : ''}</b>
        <span class="sec peq">{rp.nota}</span>
      </button>
    {/each}
    <button class="opcion" onclick={() => montar('blanco')}><b>En blanco</b><span class="sec peq">{reparto.dias} sesiones vacías para montarla a tu manera.</span></button>
    <p class="sec peq">PARE elige los ejercicios según tu nivel, material y molestias, y ajusta las series para que cada grupo quede en su banda. Las cargas que ya tenías se conservan. No se guarda hasta que pulses Guardar.</p>
  </Hoja>
{/if}

<style>
  .abrir { background: none; border: 0; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 2px; padding: 0; flex: 1; }
  .item { border-top: 1px solid var(--borde); padding-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  .bloque-ss { display: flex; flex-direction: column; gap: 8px; padding: 8px 10px 10px; border-radius: 14px; background: color-mix(in srgb, var(--ss) 10%, var(--superficie)); border: 1px solid color-mix(in srgb, var(--ss) 45%, var(--borde)); }
  .bloque-ss > .item:first-of-type { border-top: 0; padding-top: 0; }
  .ss-cab { display: flex; gap: 6px; align-items: center; font-size: 13px; color: var(--texto2); }
  .ss-cab b { font-family: var(--titulos); font-size: 15px; color: var(--ss); text-transform: uppercase; letter-spacing: 0.03em; }
  .nom { overflow: hidden; text-overflow: ellipsis; }
  .ssl { color: var(--entrenar); font-family: var(--titulos); }
  .rej { display: grid; grid-template-columns: 0.8fr 1.4fr 1fr 1fr; gap: 6px; }
  .rej input { text-align: center; padding: 0 4px; font-size: 16px; }
  .rej .campo { font-size: 12px; min-width: 0; }
  .acciones .icono-b { width: 40px; height: 40px; }
  .ssa { font-size: 13px; color: var(--aviso); }
  .ssa.etq { color: var(--texto2); }
  .fuera { color: var(--aviso); font-weight: 600; }
  .avisos { border-color: #5a4316; }
  .opcion { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 12px 14px; min-height: 60px; cursor: pointer; }
  .bloque-ss .ssl { color: var(--ss); }
</style>
