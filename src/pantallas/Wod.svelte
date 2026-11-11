<script>
  // WOD: preparar (formato, movimientos, escala) → reloj (con pitidos) → resultado.
  import { onMount, onDestroy } from 'svelte';
  import { app, uuid, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { marcarHecha } from '../lib/sesiones.js';
  import { FORMATOS, UNIDADES, ESCALAS, BENCHMARKS, wodNuevo, wodGuardado, wodsPropios, claveWod, resumenWod, reloj, textoResultado,
    totalIntervalos, mejoresWod, puntos, guardarWod } from '../lib/wods.js';
  import { archivoWod, compartir } from '../lib/archivo.js';
  import Icono from '../componentes/Icono.svelte';
  import Buscador from '../componentes/Buscador.svelte';
  import Hoja from '../componentes/Hoja.svelte';

  let { sesionIdx = null, wodId = null, wodCopia = null } = $props();
  const d = app.datos;
  const ses = sesionIdx != null ? d.rutina?.sesiones[sesionIdx] : null;
  const mujer = d.perfil.sexo === 'mujer';
  const base = wodId ? wodGuardado(wodId) : wodCopia ?? ses?.wod ?? null;
  let w = $state(base ? JSON.parse(JSON.stringify(base)) : wodNuevo());
  let fase = $state('editar'); // editar | reloj | resultado
  let escala = $state('rx');
  let notaEscala = $state('');
  let buscar = $state(false);
  let biblioteca = $state(!base);
  let esquemaTxt = $state((w.esquema || []).join('-'));

  // ---------- editar ----------
  const minutos = (k) => Math.round((w[k] || 0) / 60);
  const ponMin = (k, v) => (w[k] = Math.max(0, +v || 0) * 60);
  function cambiarFormato(f) {
    const n = wodNuevo(f);
    w.formato = f; w.cap = n.cap; w.duracion = n.duracion; w.rondas = n.rondas; w.intervalo = n.intervalo; w.trabajo = n.trabajo; w.descanso = n.descanso;
  }
  function anadir(id) {
    const e = ej(id?.id ?? id);
    w.movimientos.push({ ej: e.id, reps: w.esquema?.length ? null : 10, unidad: e.mod === 'M' || /carrera|remo erg|bike|skierg/i.test(e.n) ? 'm' : 'reps', carga: null, cargaM: null, nota: '' });
    buscar = false;
  }
  function cargar(x) { w = JSON.parse(JSON.stringify(x)); esquemaTxt = (w.esquema || []).join('-'); biblioteca = false; }
  $effect(() => { const e = esquemaTxt.split(/[^0-9]+/).map(Number).filter((n) => n > 0); w.esquema = e.length > 1 ? e : null; });
  const valido = $derived(w.movimientos.length > 0);

  // ---------- reloj y pitidos ----------
  let audio = null;
  let sonido = $state(true);
  function pitido(f = 880, dur = 0.15, vol = 0.35) {
    if (!sonido || !audio) return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'square'; o.frequency.value = f; g.gain.value = vol;
    o.connect(g); g.connect(audio.destination);
    const t = audio.currentTime; o.start(t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.stop(t + dur + 0.02);
  }
  const corto = () => pitido(880, 0.15), largo = () => pitido(1320, 0.6, 0.45);

  const PREVIA = 10;
  let t0 = $state(0); // inicio (ms) del trabajo, tras la cuenta atrás
  let ahora = $state(Date.now());
  let tic = null, bloqueo = null;
  let rondasMarcadas = $state(0);
  let pausaDesde = $state(null), pausado = $state(0);
  let terminado = $state(false);
  let ultimoSeg = -1;
  const transcurrido = $derived(Math.max(0, (pausaDesde ?? ahora) - t0 - pausado) / 1000);
  const enPrevia = $derived(fase === 'reloj' && transcurrido <= 0 && (pausaDesde ?? ahora) < t0);
  const previaRestante = $derived(Math.ceil((t0 - ahora) / 1000));
  const limite = $derived(w.formato === 'fortime' ? w.cap : w.formato === 'amrap' || w.formato === 'emom' ? w.duracion : w.formato === 'tabata' ? w.rondas * (w.trabajo + w.descanso) - w.descanso : w.cap || null);
  // Tabata: en qué ronda y si es trabajo o descanso
  const tab = $derived.by(() => {
    const ciclo = w.trabajo + w.descanso, t = transcurrido;
    const k = Math.min(w.rondas - 1, Math.floor(t / ciclo)), dentro = t - k * ciclo;
    const trabajo = dentro < w.trabajo;
    return { ronda: k + 1, trabajo, resto: trabajo ? w.trabajo - dentro : ciclo - dentro };
  });
  const emom = $derived.by(() => { const k = Math.floor(transcurrido / w.intervalo); return { intervalo: Math.min(totalIntervalos(w), k + 1), resto: w.intervalo - (transcurrido - k * w.intervalo) }; });

  async function pedirPantalla() { try { bloqueo = await navigator.wakeLock?.request('screen'); } catch { /* sin permiso */ } }
  function empezar() {
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch { audio = null; }
    if (w.esquema?.length) w.rondas = 1;
    t0 = Date.now() + PREVIA * 1000; pausado = 0; pausaDesde = null; rondasMarcadas = 0; terminado = false; ultimoSeg = -1;
    fase = 'reloj';
    pedirPantalla();
    clearInterval(tic);
    tic = setInterval(paso, 200);
  }
  function paso() {
    ahora = Date.now();
    if (pausaDesde) return;
    // cuenta atrás: pitidos en 3, 2, 1 y largo al empezar
    const seg = Math.floor((ahora - t0 - pausado) / 1000);
    if (seg === ultimoSeg) return;
    ultimoSeg = seg;
    if (seg < 0) { if (seg >= -3) corto(); return; }
    if (seg === 0) { largo(); return; }
    const t = seg;
    if (w.formato === 'emom' && t % w.intervalo === 0 && t < w.duracion) largo();
    else if (w.formato === 'emom' && w.intervalo - (t % w.intervalo) <= 3 && t < w.duracion) corto();
    if (w.formato === 'tabata') {
      const ciclo = w.trabajo + w.descanso, dentro = t % ciclo;
      if (t < limite && (dentro === 0 || dentro === w.trabajo)) largo();
      else if (t < limite && ((dentro > w.trabajo - 4 && dentro < w.trabajo) || dentro > ciclo - 4)) corto();
    }
    if (limite) {
      if (limite - t <= 3 && limite - t > 0 && w.formato !== 'emom' && w.formato !== 'tabata') corto();
      if (t >= limite) { largo(); setTimeout(largo, 350); terminar(true); }
    }
  }
  function pausar() {
    if (pausaDesde) { pausado += Date.now() - pausaDesde; pausaDesde = null; } else pausaDesde = Date.now();
  }
  function terminar(porLimite = false) {
    clearInterval(tic); tic = null; terminado = true;
    const t = Math.round(Math.min(transcurrido, limite || Infinity));
    res = {
      tiempo: t, cap: w.formato === 'fortime' && porLimite, reps: 0,
      rondas: rondasMarcadas, intervalos: w.formato === 'emom' ? (porLimite ? totalIntervalos(w) : Math.min(totalIntervalos(w), Math.floor(t / w.intervalo))) : null, carga: null,
      porRonda: w.formato === 'tabata' ? Array.from({ length: w.rondas }, () => '') : null,
    };
    fase = 'resultado';
    bloqueo?.release?.().catch(() => {});
  }
  onDestroy(() => { clearInterval(tic); bloqueo?.release?.().catch(() => {}); audio?.close?.().catch(() => {}); });

  // ---------- resultado ----------
  let res = $state(null);
  let nota = $state('');
  const clave = $derived(claveWod(w));
  const previos = $derived(mejoresWod(clave));
  function guardar() {
    const r = { ...res };
    if (w.formato === 'tabata') r.porRonda = (r.porRonda || []).map((x) => +x || 0);
    if (w.formato === 'fortime' && r.cap) r.reps = +r.reps || 0;
    const anterior = previos[escala];
    const hecha = {
      id: uuid(), tipo: 'wod', fecha: hoyISO(), inicio: new Date(t0 || Date.now()).toISOString(), duracion: Math.round(transcurrido),
      sesionId: ses?.id ?? null, nombre: w.nombre || ses?.nombre || 'WOD', wod: JSON.parse(JSON.stringify(w)), clave, escala,
      notaEscala: escala === 'personal' ? notaEscala : '', resultado: r, nota, ejercicios: [],
    };
    d.sesiones.push(hecha);
    d.sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (ses && sesionIdx != null) marcarHecha(sesionIdx);
    if (!w.id?.startsWith('BM-')) guardarWod(w); // queda en tu biblioteca para repetirlo
    const mejora = !anterior || puntos(w, r) > anterior.p;
    aviso(mejora && anterior ? '¡Nueva mejor marca en este WOD!' : 'WOD guardado');
    app.vista = { nombre: 'progresoWod', clave, acento: 'progreso' };
  }
  async function compartirWod() {
    const r = await compartir(archivoWod(w), w.nombre || 'WOD');
    if (r !== 'cancelado') aviso(r === 'compartido' ? 'WOD enviado' : 'Archivo descargado: mándalo por WhatsApp');
  }
  function salir() {
    if (fase === 'reloj' && !terminado) { pausar(); if (!confirmarSalir) { confirmarSalir = true; return; } }
    app.vista = null;
  }
  let confirmarSalir = $state(false);
</script>

<div class="pantalla">
  <div class="fila entre">
    <button class="icono-b" data-atras onclick={salir} aria-label="Salir"><Icono n="atras" /></button>
    <span class="etiqueta">{ses ? ses.nombre : 'WOD'}{w.nombre ? ` · ${w.nombre}` : ''}</span>
    {#if fase === 'editar'}<button class="icono-b" onclick={compartirWod} aria-label="Compartir WOD" disabled={!valido}><Icono n="compartir" /></button>{:else}<span style="width:44px"></span>{/if}
  </div>

  {#if fase === 'editar'}
    <h1>{w.nombre || 'El WOD de hoy'}</h1>
    <div class="fila" style="gap:8px">
      <button class="boton sec2" style="flex:1" onclick={() => (biblioteca = true)}>Biblioteca</button>
      <button class="boton sec2" style="flex:1" onclick={() => { w = wodNuevo(); esquemaTxt = ''; }}>Empezar en blanco</button>
    </div>

    <label class="campo">Nombre (opcional)<input type="text" bind:value={w.nombre} placeholder="Fran, WOD del lunes…" /></label>

    <div class="tarjeta">
      <span class="etiqueta">Formato</span>
      <div class="fila envolver">{#each Object.entries(FORMATOS) as [k, f]}<button class="chip" class:on={w.formato === k} onclick={() => cambiarFormato(k)}>{f.n}</button>{/each}</div>
      <p class="sec peq">{FORMATOS[w.formato].d}</p>
      {#if w.formato === 'fortime'}
        <div class="fila" style="gap:10px">
          <label class="campo" style="flex:1">Rondas<input type="number" inputmode="numeric" min="1" bind:value={w.rondas} disabled={!!w.esquema?.length} /></label>
          <label class="campo" style="flex:1">Tiempo límite (min)<input type="number" inputmode="numeric" value={minutos('cap')} oninput={(e) => ponMin('cap', e.target.value)} /></label>
        </div>
        <label class="campo">Esquema de repeticiones (opcional)<input type="text" bind:value={esquemaTxt} placeholder="21-15-9" /></label>
      {:else if w.formato === 'amrap'}
        <label class="campo">Duración (min)<input type="number" inputmode="numeric" value={minutos('duracion')} oninput={(e) => ponMin('duracion', e.target.value)} /></label>
      {:else if w.formato === 'emom'}
        <div class="fila" style="gap:10px">
          <label class="campo" style="flex:1">Cada (s)<input type="number" inputmode="numeric" step="30" bind:value={w.intervalo} /></label>
          <label class="campo" style="flex:1">Total (min)<input type="number" inputmode="numeric" value={minutos('duracion')} oninput={(e) => ponMin('duracion', e.target.value)} /></label>
        </div>
      {:else if w.formato === 'tabata'}
        <div class="fila" style="gap:10px">
          <label class="campo" style="flex:1">Rondas<input type="number" inputmode="numeric" bind:value={w.rondas} /></label>
          <label class="campo" style="flex:1">Trabajo (s)<input type="number" inputmode="numeric" bind:value={w.trabajo} /></label>
          <label class="campo" style="flex:1">Descanso (s)<input type="number" inputmode="numeric" bind:value={w.descanso} /></label>
        </div>
      {:else}
        <label class="campo">Tiempo límite (min, opcional)<input type="number" inputmode="numeric" value={minutos('cap')} oninput={(e) => ponMin('cap', e.target.value)} /></label>
      {/if}
    </div>

    <div class="tarjeta">
      <span class="etiqueta">Movimientos</span>
      {#each w.movimientos as m, k}
        {@const e = ej(m.ej)}
        <div class="mov">
          <div class="fila entre"><b>{e?.n ?? m.ej}</b><button class="icono-b" style="width:36px;height:36px" onclick={() => w.movimientos.splice(k, 1)} aria-label="Quitar"><Icono n="cerrar" tam={18} /></button></div>
          <div class="fila" style="gap:8px">
            {#if !w.esquema?.length && w.formato !== 'carga'}<input type="number" inputmode="numeric" bind:value={m.reps} aria-label="Cantidad" placeholder="Reps" style="max-width:84px" />{/if}
            {#if w.formato !== 'carga'}<select bind:value={m.unidad} aria-label="Unidad">{#each Object.entries(UNIDADES) as [u, l]}<option value={u}>{l}</option>{/each}</select>{/if}
            {#if e?.carga === 'externa' || m.carga}<input type="number" inputmode="decimal" bind:value={m.carga} placeholder="kg" aria-label="Carga RX" style="max-width:74px" /><span class="sec peq">kg</span>{/if}
          </div>
          {#if m.cargaM}<span class="sec peq">RX: {m.carga}/{m.cargaM} kg (hombre/mujer){mujer ? ` · la tuya: ${m.cargaM} kg` : ''}</span>{/if}
        </div>
      {/each}
      <button class="enlace" style="align-self:flex-start" onclick={() => (buscar = true)}>+ Añadir movimiento</button>
    </div>

    <div class="tarjeta">
      <span class="etiqueta">Escala</span>
      <div class="fila envolver">{#each Object.entries(ESCALAS) as [k, l]}<button class="chip" class:on={escala === k} onclick={() => (escala = k)}>{l}</button>{/each}</div>
      {#if escala === 'personal'}<label class="campo">¿Qué cambias?<input type="text" bind:value={notaEscala} placeholder="Dominadas con banda, 35 kg en vez de 43" /></label>{/if}
      <p class="sec peq">Solo se comparan resultados con la misma escala.</p>
    </div>
    {#if w.notas}<p class="sec peq">{w.notas}</p>{/if}
    {#if previos[escala]}<p class="peq">Tu mejor marca ({ESCALAS[escala]}): <b>{textoResultado(w, previos[escala].s.resultado)}</b> · {previos[escala].s.fecha}</p>{/if}

    <button class="boton ancho grande" onclick={empezar} disabled={!valido}>Empezar el reloj</button>
    <button class="enlace" onclick={() => { fase = 'resultado'; res = { tiempo: 0, cap: false, reps: 0, rondas: 0, intervalos: w.formato === 'emom' ? totalIntervalos(w) : null, carga: null, porRonda: w.formato === 'tabata' ? Array.from({ length: w.rondas }, () => '') : null }; }} disabled={!valido}>Ya lo he hecho: apuntar solo el resultado</button>

  {:else if fase === 'reloj'}
    <p class="sec centro">{resumenWod(w)}</p>
    <div class="reloj" class:previa={enPrevia} class:descanso={w.formato === 'tabata' && !tab.trabajo && !enPrevia}>
      {#if enPrevia}
        <span class="estado">Prepárate</span><span class="cifra-g">{previaRestante}</span>
      {:else if w.formato === 'emom'}
        <span class="estado">Intervalo {emom.intervalo} de {totalIntervalos(w)}</span><span class="cifra-g">{reloj(emom.resto)}</span><span class="sec">Total {reloj(transcurrido)} / {reloj(w.duracion)}</span>
      {:else if w.formato === 'tabata'}
        <span class="estado">{tab.trabajo ? '¡Trabajo!' : 'Descanso'} · ronda {tab.ronda} de {w.rondas}</span><span class="cifra-g">{Math.ceil(tab.resto)}</span>
      {:else if w.formato === 'amrap'}
        <span class="estado">Quedan</span><span class="cifra-g">{reloj((w.duracion || 0) - transcurrido)}</span>
      {:else}
        <span class="estado">{limite ? `Límite ${reloj(limite)}` : 'Tiempo'}</span><span class="cifra-g">{reloj(transcurrido)}</span>
      {/if}
      {#if pausaDesde}<span class="estado">En pausa</span>{/if}
    </div>
    {#if (w.formato === 'amrap' || (w.formato === 'fortime' && w.rondas > 1)) && !enPrevia}
      <button class="boton ancho ronda" onclick={() => rondasMarcadas++}>+1 ronda · llevas {rondasMarcadas}{w.formato === 'fortime' ? ` de ${w.rondas}` : ''}</button>
    {/if}
    <div class="fila" style="gap:8px">
      <button class="boton sec2" style="flex:1" onclick={pausar}>{pausaDesde ? 'Seguir' : 'Pausa'}</button>
      <button class="boton sec2" style="flex:1" onclick={() => (sonido = !sonido)} aria-pressed={sonido}>{sonido ? 'Sonido: sí' : 'Sonido: no'}</button>
    </div>
    <button class="boton ancho" onclick={() => terminar(false)}>{w.formato === 'fortime' ? 'He terminado' : 'Terminar'}</button>
    {#if confirmarSalir}<div class="aviso-l peq"><p>El reloj está en pausa. Si sales, el WOD no se guarda. Pulsa atrás otra vez para salir.</p></div>{/if}

  {:else if fase === 'resultado' && res}
    <h1>Resultado</h1>
    <p class="sec">{resumenWod(w)} · {ESCALAS[escala]}</p>
    <div class="tarjeta">
      {#if w.formato === 'fortime'}
        <div class="fila envolver"><button class="chip" class:on={!res.cap} onclick={() => (res.cap = false)}>Terminado</button><button class="chip" class:on={res.cap} onclick={() => (res.cap = true)}>Llegué al límite (CAP)</button></div>
        {#if !res.cap}
          <div class="fila" style="gap:8px;align-items:flex-end">
            <label class="campo" style="flex:1">Minutos<input type="number" inputmode="numeric" value={Math.floor(res.tiempo / 60)} oninput={(e) => (res.tiempo = (+e.target.value || 0) * 60 + (res.tiempo % 60))} /></label>
            <label class="campo" style="flex:1">Segundos<input type="number" inputmode="numeric" value={res.tiempo % 60} oninput={(e) => (res.tiempo = Math.floor(res.tiempo / 60) * 60 + (+e.target.value || 0))} /></label>
          </div>
        {:else}
          <label class="campo">Repeticiones hechas en total<input type="number" inputmode="numeric" bind:value={res.reps} /></label>
        {/if}
      {:else if w.formato === 'amrap'}
        <div class="fila" style="gap:8px">
          <label class="campo" style="flex:1">Rondas completas<input type="number" inputmode="numeric" bind:value={res.rondas} /></label>
          <label class="campo" style="flex:1">+ repeticiones<input type="number" inputmode="numeric" bind:value={res.reps} /></label>
        </div>
      {:else if w.formato === 'emom'}
        <label class="campo">Intervalos completados (de {totalIntervalos(w)})<input type="number" inputmode="numeric" bind:value={res.intervalos} /></label>
        <label class="campo">Carga (kg, si era de fuerza)<input type="number" inputmode="decimal" bind:value={res.carga} /></label>
      {:else if w.formato === 'tabata'}
        <span class="peq">Repeticiones de cada ronda (puntúa la más baja)</span>
        <div class="rondas">{#each res.porRonda as _, k}<input type="number" inputmode="numeric" bind:value={res.porRonda[k]} aria-label="Ronda {k + 1}" placeholder={String(k + 1)} />{/each}</div>
      {:else if w.formato === 'carga'}
        <label class="campo">Carga máxima válida (kg)<input type="number" inputmode="decimal" bind:value={res.carga} /></label>
      {:else}
        <label class="campo">Repeticiones<input type="number" inputmode="numeric" bind:value={res.reps} /></label>
      {/if}
    </div>
    <p class="peq">Resultado: <b>{textoResultado(w, res)}</b>{#if previos[escala]} · tu mejor ({ESCALAS[escala]}): {textoResultado(w, previos[escala].s.resultado)}{/if}</p>
    <label class="campo">Nota (opcional)<input type="text" bind:value={nota} placeholder="Me reventaron los thrusters" /></label>
    <button class="boton ancho grande" onclick={guardar}>Guardar</button>
  {/if}
</div>

{#if buscar}<Buscador titulo="Añadir movimiento" cerrar={() => (buscar = false)} elegir={anadir} />{/if}
{#if biblioteca && fase === 'editar'}
  <Hoja titulo="Biblioteca de WOD" cerrar={() => (biblioteca = false)}>
    {#if wodsPropios().length}
      <span class="etiqueta">Tuyos y recibidos</span>
      {#each wodsPropios() as x (x.id)}<button class="tarjeta pulsable item-b" onclick={() => cargar(x)}><b>{x.nombre || 'WOD sin nombre'}</b><span class="sec peq">{resumenWod(x)}</span></button>{/each}
    {/if}
    <span class="etiqueta">De referencia</span>
    {#each BENCHMARKS as x (x.id)}<button class="tarjeta pulsable item-b" onclick={() => cargar(x)}><b>{x.nombre}</b><span class="sec peq">{resumenWod(x)}</span></button>{/each}
    <button class="boton sec2 ancho" onclick={() => (biblioteca = false)}>Escribir el WOD de la pizarra</button>
  </Hoja>
{/if}

<style>
  .mov { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; border-top: 1px solid var(--borde); }
  .mov:first-of-type { border-top: 0; }
  .mov input, .mov select { min-height: 42px; background: var(--elevada); color: var(--texto); border: 1px solid var(--borde); border-radius: 10px; padding: 0 10px; font: inherit; }
  .centro { text-align: center; }
  .reloj { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 12px; border-radius: 20px; background: var(--superficie); border: 2px solid var(--entrenar); }
  .reloj.previa { border-color: var(--aviso); }
  .reloj.descanso { border-color: var(--hoy); }
  .estado { font-family: var(--titulos); text-transform: uppercase; letter-spacing: 0.04em; font-size: 18px; color: var(--texto2); }
  .cifra-g { font-family: var(--titulos); font-weight: 800; font-size: clamp(72px, 26vw, 120px); line-height: 1; font-variant-numeric: tabular-nums; }
  .ronda { min-height: 72px; font-size: 20px; }
  .grande { min-height: 56px; }
  .rondas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .rondas input { min-height: 46px; text-align: center; background: var(--elevada); color: var(--texto); border: 1px solid var(--borde); border-radius: 10px; font: inherit; }
  .item-b { gap: 2px; text-align: left; }
</style>
