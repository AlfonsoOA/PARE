<script>
  import { resumenWod } from '../lib/wods.js';
  import { app, ir, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { GRUPOS, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { duracionSesion, volumenSemana, volumenPlanificado, lunes, BANDA } from '../lib/entreno.js';
  import { sesionPropuesta, iniciarSesion, retomarDesdeElPrincipio } from '../lib/sesiones.js';
  import { avisosDeHoy, descartar } from '../lib/avisos.js';
  import { delDia, sumar, objetivoDelDia, tipoDeDia, GRUPOS_RACION, redondear } from '../lib/dieta.js';
  import { fmt, fmtMin, fmtFecha, fmtNum } from '../lib/unidades.js';
  import Hoja from '../componentes/Hoja.svelte';
  import Icono from '../componentes/Icono.svelte';
  import AnotarMedida from '../componentes/AnotarMedida.svelte';
  import { encuestaPendiente, posponerEncuesta } from '../lib/adherencia.js';

  let d = $derived(app.datos);
  const hoy = hoyISO();
  let hoja = $state(null);
  let elegida = $state(null); // índice elegido en "Cambiar sesión" (solo para hoy)

  const prop = $derived(sesionPropuesta(d));
  const idx = $derived(elegida ?? prop?.idx ?? null);
  const ses = $derived(idx != null ? d.rutina?.sesiones[idx] : null);
  const hechaHoy = $derived(d.sesiones.filter((s) => s.fecha === hoy));
  const descansoHoy = $derived(!!d.descansos?.[hoy]);
  const avisos = $derived(avisosDeHoy());
  const vol = $derived(volumenSemana(d.sesiones, lunes(hoy)));
  const plan = $derived(volumenPlanificado(d.rutina, d.perfil.diasSemana));
  const comida = $derived(sumar(delDia(hoy)));
  const objComida = $derived(objetivoDelDia(hoy));
  const dif = (kg) => { const v = fmt(Math.abs(kg), false); return Math.abs(kg) < 0.05 ? `±0` : `${kg > 0 ? '+' : '−'}${v}`; };
  // verde si va hacia el objetivo; neutro si no hay objetivo de peso claro
  function colorDif(kg) {
    const o = d.perfil.objetivo;
    if (Math.abs(kg) < 0.05) return 'var(--texto2)';
    const bajar = o === 'perder_grasa' || o === 'recomposicion';
    const subir = o === 'ganar_musculo';
    if ((bajar && kg < 0) || (subir && kg > 0)) return 'var(--comer)';
    return 'var(--texto)';
  }
  const medias = $derived.by(() => {
    const ps = d.medidas.filter((m) => m.peso);
    const ult = ps.at(-1);
    if (!ult) return null;
    const ini = ps[0];
    const ant = ps.length > 1 ? ps.at(-2) : null;
    return { ult, ini, ant, total: ult.peso - ini.peso, semana: ant ? ult.peso - ant.peso : null };
  });

  function empezar() { iniciarSesion(idx); }
  function marcarDescanso() { d.descansos[hoy] = true; hoja = null; aviso('Hoy, descanso. Lo que tocaba sigue esperando.'); }
  function accionAviso(a) {
    if (a.tipo === 'retomar') { retomarDesdeElPrincipio(); descartar(a.id); aviso('Secuencia reiniciada'); return; }
    if (a.accion) app.vista = { ...a.accion };
  }
</script>

<div class="pantalla">
  <div class="cabecera">
    <h1>Hoy</h1>
    <span class="sec peq">{fmtFecha(hoy, true)}</span>
  </div>

  {#each avisos as a (a.id)}
    <div class="aviso-l" class:pique={a.tipo === 'pique'}>
      <Icono n={a.tipo === 'pique' ? 'aviso' : a.tipo === 'retomar' ? 'reloj' : 'info'} tam={20} />
      <div class="col" style="gap:4px">
        <p>{a.texto}</p>
        {#if a.tipo === 'retomar'}<button class="enlace" style="align-self:flex-start;padding:4px 0" onclick={() => accionAviso(a)}>Retomar desde el principio</button>
        {:else if a.accion}<button class="enlace" style="align-self:flex-start;padding:4px 0" onclick={() => accionAviso(a)}>Ver</button>{/if}
      </div>
      <button class="x" onclick={() => descartar(a.id)} aria-label="Descartar aviso">×</button>
    </div>
  {/each}

  {#if !d.guiaVista && (Date.now() - Date.parse(d.creado || 0)) < 8 * 864e5}
    <div class="aviso-l">
      <Icono n="info" tam={20} />
      <div class="col" style="gap:4px">
        <p><b>¿Primera vez con PARE?</b> Mira cómo se usa en 2 minutos: apuntar una sesión, la dieta por raciones, tu progreso.</p>
        <button class="enlace" style="align-self:flex-start;padding:4px 0" onclick={() => (app.vista = { nombre: 'guia', acento: 'yo' })}>Ver cómo se usa</button>
      </div>
      <button class="x" onclick={() => (d.guiaVista = true)} aria-label="Ya me apaño, quitar">×</button>
    </div>
  {/if}

  {#if !app.sesionActiva && encuestaPendiente(d)}
    <div class="tarjeta">
      <span class="etiqueta acento">Revisión quincenal</span>
      <p class="peq">¿Cómo van estas dos semanas? Menos de un minuto, todo de tocar.</p>
      <div class="fila" style="gap:8px"><button class="boton" style="flex:1" onclick={() => (app.vista = { nombre: 'encuesta', acento: 'hoy' })}>Responder</button><button class="boton sec2" style="flex:1" onclick={() => posponerEncuesta(d)}>Mañana</button></div>
    </div>
  {/if}

  {#if app.sesionActiva}
    <div class="tarjeta">
      <span class="etiqueta acento">Sesión en curso</span>
      <h2>{app.sesionActiva.nombre}</h2>
      <button class="boton ancho" style="--acento: var(--entrenar)" onclick={() => (app.vista = { nombre: 'sesion', acento: 'entrenar' })}>Continuar</button>
    </div>
  {:else if !d.rutina}
    <div class="tarjeta">
      <span class="etiqueta acento">Sin rutina</span>
      <p>Haz el test de inicio para que PARE te monte una, o créala tú.</p>
      <button class="boton ancho" onclick={() => (app.vista = { nombre: 'test' })}>Hacer el test</button>
      <button class="boton sec2 ancho" onclick={() => (app.vista = { nombre: 'editor', acento: 'entrenar' })}>Crear mi rutina</button>
    </div>
  {:else if hechaHoy.length && elegida == null}
    <div class="tarjeta">
      <span class="etiqueta acento">Hecho hoy</span>
      <h2>{hechaHoy.map((s) => s.nombre).join(' + ')}</h2>
      <p class="sec peq">{fmtMin(hechaHoy.reduce((s, x) => s + x.duracion, 0))} · earn your reward.</p>
      <button class="enlace" style="align-self:flex-start" onclick={() => (hoja = 'cambiar')}>Hacer otra sesión</button>
    </div>
  {:else if descansoHoy}
    <div class="tarjeta">
      <span class="etiqueta acento">Hoy, descanso</span>
      <p class="sec">Mañana te espera {ses?.nombre}.</p>
      <button class="enlace" style="align-self:flex-start" onclick={() => { delete d.descansos[hoy]; }}>Al final sí entreno</button>
    </div>
  {:else if ses}
    <div class="tarjeta">
      <span class="etiqueta acento">{elegida != null && elegida !== prop?.idx ? 'Has elegido' : prop?.pendiente ? 'Pendiente' : 'Toca hoy'}</span>
      <p class="cifra">{ses.nombre}</p>
      <p class="sec peq">{#if ses.tipo === 'wod'}CrossFit · {ses.wod ? resumenWod(ses.wod) : 'apunta el WOD de hoy o elígelo de la biblioteca'}{:else}{ses.items.length} ejercicios · {fmtMin(duracionSesion(ses.items, d.ajustes))} estimados{/if}{#if ses.exigente && d.dieta?.hidratosExtra} · día de más hidratos{/if}</p>
      <button class="boton ancho" onclick={empezar}>{ses.tipo === 'wod' ? 'Ir al WOD' : 'Empezar'}</button>
      <button class="enlace" onclick={() => (hoja = 'cambiar')}>Cambiar sesión</button>
    </div>
  {/if}

  {#if d.rutina}
    <div class="tarjeta">
      <div class="fila entre"><span class="etiqueta">Series esta semana</span><span class="sec peq">hechas / previstas</span></div>
      {#each GRUPOS.filter((g) => plan[g] > 0 || vol[g] > 0) as g}
        <button class="grupo" onclick={() => (app.tab = 'progreso', app.vista = null, (app.subProgreso = 'volumen'))}>
          <div class="fila entre peq"><span>{NOMBRE_GRUPO[g]}</span><span class="sec">{fmtNum(vol[g], 1)} / {fmtNum(plan[g], 1)}</span></div>
          <div class="barra-p"><i style="width: {Math.min(100, (vol[g] / Math.max(plan[g], 1)) * 100)}%"></i></div>
        </button>
      {/each}
      <p class="sec peq">Banda recomendada: {BANDA.min}-{BANDA.max} series a la semana por grupo (piernas, 16-40).</p>
    </div>
  {/if}

  {#if d.dieta && objComida}
    <button class="tarjeta pulsable" onclick={() => (app.tab = 'comer')}>
      <div class="fila entre"><span class="etiqueta">Comida de hoy</span><span class="sec peq">{fmtNum(comida.kcal)} / {fmtNum(d.dieta.kcal + (objComida.HC - d.dieta.raciones.HC) * 160)} kcal</span></div>
      <div class="fila envolver" style="gap:14px">
        {#each GRUPOS_RACION.filter((g) => objComida[g] > 0) as g}
          <span class="peq"><b>{g === 'fruta' ? 'Fruta' : g === 'lacteo' ? 'Lácteo' : g}</b> {fmtNum(redondear(comida[g]), 1)}/{fmtNum(objComida[g], 1)}</span>
        {/each}
      </div>
    </button>
  {/if}

  <button class="tarjeta pulsable" onclick={() => (hoja = 'peso')}>
    <div class="fila entre"><span class="etiqueta">Peso</span><span class="enlace" style="padding:0;min-height:0">Anotar</span></div>
    {#if medias}
      <div class="fila" style="gap:18px">
        <div><p class="cifra">{fmt(medias.ult.peso, false)}</p><p class="sec peq">{fmtFecha(medias.ult.fecha)}</p></div>
        {#if medias.ult !== medias.ini}
          <div><p class="cifra" style="color:{colorDif(medias.total)}">{dif(medias.total)}</p><p class="sec peq">desde el inicio ({fmtFecha(medias.ini.fecha)})</p></div>
          {#if medias.semana != null && medias.ant !== medias.ini}<div><p class="cifra" style="color:var(--texto2)">{dif(medias.semana)}</p><p class="sec peq">desde la pesada anterior</p></div>{/if}
        {:else}<p class="sec peq" style="align-self:center">Pésate una vez a la semana, mismo día y en ayunas.</p>{/if}
      </div>
    {:else}<p class="sec">Sin registros todavía.</p>{/if}
  </button>
</div>

{#if hoja === 'cambiar' && d.rutina}
  <Hoja titulo="Cambiar sesión" cerrar={() => (hoja = null)}>
    {#each d.rutina.sesiones as s, i}
      <button class="opcion" class:on={i === idx} onclick={() => { elegida = i; hoja = null; }}>
        <div class="col" style="gap:2px;align-items:flex-start">
          <b>{s.nombre}</b>
          <span class="sec peq">{s.tipo === 'wod' ? 'CrossFit' : `${s.items.length} ejercicios · ${fmtMin(duracionSesion(s.items, d.ajustes))}`}</span>
        </div>
        {#if i === prop?.idx}<span class="insignia">Toca</span>{:else if d.secuencia.pendientes?.includes(i)}<span class="insignia aviso">Pendiente</span>{/if}
      </button>
    {/each}
    <button class="boton sec2 ancho" onclick={() => { elegida = null; iniciarSesion(null, [], 'Sesión libre'); }}>Sesión libre (sin rutina)</button>
    <button class="boton sec2 ancho" onclick={marcarDescanso}>Hoy descanso</button>
    <p class="sec peq">Elegir otra no borra la que tocaba: queda pendiente.</p>
  </Hoja>
{/if}
{#if hoja === 'peso'}<AnotarMedida cerrar={() => (hoja = null)} />{/if}

<style>
  .grupo { background: none; border: 0; padding: 4px 0; display: flex; flex-direction: column; gap: 4px; text-align: left; cursor: pointer; }
  .pulsable { text-align: left; cursor: pointer; width: 100%; }
  .aviso-l.pique { border-color: var(--entrenar); }
  .opcion { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 12px 14px; min-height: 60px; text-align: left; cursor: pointer; }
  .opcion.on { border-color: var(--acento); }
</style>
