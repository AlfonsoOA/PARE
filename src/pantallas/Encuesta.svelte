<script>
  // Encuesta quincenal de adherencia: todo de tocar. Al final, resultado, pautas según las barreras y envío al entrenador.
  import { app, aviso, ir } from '../lib/estado.svelte.js';
  import { P_DIETA, P_ENTRENO, P_HABITO, P_ESTADO, ACUERDO, BARRERAS, NOMBRE_BARRERA, pautasDe, metricasAuto, guardarEncuesta, nivel, posponerEncuesta } from '../lib/adherencia.js';
  import { archivoDeportista, compartir } from '../lib/archivo.js';
  import Icono from '../componentes/Icono.svelte';

  const d = app.datos;
  const auto = metricasAuto(d);
  const conDieta = !!d.dieta, conRutina = !!d.rutina;
  let r = $state({});
  let barreras = $state([]);
  let hecha = $state(null);

  const preguntas = [...(conDieta ? P_DIETA : []), ...(conRutina ? P_ENTRENO : []), ...P_HABITO.filter((p) => (p.id === 'h3' ? conDieta : conRutina)), ...P_ESTADO];
  const faltan = $derived(preguntas.filter((p) => r[p.id] == null).length + (barreras.length ? 0 : 1));

  function marcarBarrera(id) {
    if (id === 'nada') { barreras = barreras.includes('nada') ? [] : ['nada']; return; }
    const sin = barreras.filter((b) => b !== 'nada');
    barreras = sin.includes(id) ? sin.filter((b) => b !== id) : [...sin, id];
  }
  function terminar() { hecha = guardarEncuesta(r, barreras); window.scrollTo(0, 0); }
  function luego() { posponerEncuesta(); aviso('Te la recuerdo mañana'); ir('hoy'); }
  async function enviar() {
    const res = await compartir(archivoDeportista(['rutina', 'dieta', 'progreso']), d.perfil.nombre);
    if (res !== 'cancelado') aviso('Enviado: lleva tu progreso y esta encuesta');
  }
  const pautas = $derived(hecha ? hecha.barreras.filter((b) => b !== 'nada').slice(0, 3).map((b) => ({ b, ps: pautasDe(b) })) : []);
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => ir('hoy')} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Cómo van estas dos semanas</span></div>

  {#if !hecha}
    <h1>Tu revisión quincenal</h1>
    <p class="sec peq">Menos de un minuto y sin escribir nada. Sirve para ver cómo vas y proponerte ajustes.{#if auto.previstas}{" "}En {auto.dias === 14 ? 'estos 14 días' : `estos ${auto.dias} días con la app`} llevas <b>{auto.hechas} de {auto.previstas}</b> sesiones previstas: eso ya lo cuenta la app.{/if}</p>

    {#if conDieta}
      <div class="tarjeta">
        <span class="etiqueta">Dieta</span>
        {#each P_DIETA as p}
          <p class="peq">{p.t}</p>
          <div class="fila envolver" style="gap:6px">{#each p.escala as [v, l]}<button class="chip" class:on={r[p.id] === v} onclick={() => (r[p.id] = v)}>{l}</button>{/each}</div>
        {/each}
      </div>
    {/if}

    {#if conRutina || conDieta}
      <div class="tarjeta">
        <span class="etiqueta">{conRutina ? 'Entreno y hábito' : 'Hábito'}</span>
        {#each [...(conRutina ? P_ENTRENO : []), ...P_HABITO.filter((p) => (p.id === 'h3' ? conDieta : conRutina))] as p}
          <p class="peq">{p.t}</p>
          <div class="fila envolver" style="gap:6px">{#each ACUERDO as [v, l]}<button class="chip" class:on={r[p.id] === v} onclick={() => (r[p.id] = v)}>{l}</button>{/each}</div>
        {/each}
      </div>
    {/if}

    <div class="tarjeta">
      <span class="etiqueta">Cómo te has encontrado</span>
      {#each P_ESTADO as p}
        <p class="peq">{p.t}</p>
        <div class="fila envolver" style="gap:6px">{#each p.escala as [v, l]}<button class="chip" class:on={r[p.id] === v} onclick={() => (r[p.id] = v)}>{l}</button>{/each}</div>
      {/each}
    </div>

    <div class="tarjeta">
      <span class="etiqueta">¿Qué te ha costado más? (marca las que quieras)</span>
      <div class="fila envolver" style="gap:6px">{#each BARRERAS as [id, l]}<button class="chip" class:on={barreras.includes(id)} onclick={() => marcarBarrera(id)}>{l}</button>{/each}</div>
    </div>

    <button class="boton ancho" disabled={faltan > 0} onclick={terminar}>{faltan > 0 ? `Faltan ${faltan}` : 'Terminar'}</button>
    <button class="boton sec2 ancho" onclick={luego}>Ahora no, mañana</button>
  {:else}
    {@const pt = hecha.puntos}
    <h1>Adherencia: {nivel(pt.global)}{pt.global != null ? ` (${pt.global} %)` : ''}</h1>
    <div class="tarjeta">
      <div class="fila entre envolver" style="gap:12px">
        {#if pt.dieta != null}<div><p class="cifra">{pt.dieta} %</p><p class="sec peq">dieta</p></div>{/if}
        {#if pt.entreno != null}<div><p class="cifra">{pt.entreno} %</p><p class="sec peq">entreno</p></div>{/if}
        {#if pt.habito != null}<div><p class="cifra">{pt.habito} %</p><p class="sec peq">hábito</p></div>{/if}
      </div>
      <p class="sec peq">La evolución, en Progreso → Adherencia. «Hábito» mide cuánto te sale ya solo: es lo que más ayuda a mantenerlo a largo plazo.</p>
    </div>
    {#if pautas.length}
      <h2>Para las próximas dos semanas</h2>
      {#each pautas as x}
        <div class="tarjeta" style="gap:6px">
          <span class="etiqueta">{NOMBRE_BARRERA[x.b]}</span>
          {#each x.ps as t}<p class="peq">· {t}</p>{/each}
        </div>
      {/each}
    {/if}
    <div class="tarjeta" style="gap:8px">
      <span class="etiqueta">¿Tienes entrenador?</span>
      <p class="sec peq">Mándale tu rutina, dieta, progreso y esta encuesta. Así lo tiene al día cada dos semanas.</p>
      <button class="boton sec2 ancho" onclick={enviar}><Icono n="compartir" /> Enviar a mi entrenador</button>
    </div>
    <button class="boton ancho" onclick={() => ir('hoy')}>Listo</button>
  {/if}
</div>

<style>
  .chip.n { min-width: 36px; padding: 8px 0; text-align: center; }
</style>
