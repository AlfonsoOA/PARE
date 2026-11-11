<script>
  import { app, ir } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { duracionSesion } from '../lib/entreno.js';
  import { porQue } from '../lib/plan.js';
  import { fmtMin } from '../lib/unidades.js';

  const prop = app.datos.planPropuesto;
  const yaTenia = !!app.datos.rutina;
  const nombreObj = { perder_grasa: 'Perder grasa', recomposicion: 'Recomposición', ganar_musculo: 'Ganar músculo', fuerza: 'Fuerza', salud: 'Salud' };

  function aceptar(editar = false) {
    if (app.datos.rutina) app.datos.rutinasAnteriores.push(app.datos.rutina);
    app.datos.rutina = prop.rutina;
    app.datos.dieta = prop.dieta;
    app.datos.perfil.faseDieta = prop.fase;
    app.datos.secuencia = { siguiente: 0, pendientes: [] };
    delete app.datos.planPropuesto;
    if (editar) app.vista = { nombre: 'editor', acento: 'entrenar' };
    else ir('hoy');
  }
  function descartar() { delete app.datos.planPropuesto; ir('yo'); }
</script>

{#if !prop}
  <div class="pantalla"><p class="vacio">No hay ningún plan pendiente.</p><button class="boton" onclick={() => ir('hoy')}>Ir a Hoy</button></div>
{:else}
<div class="pantalla">
  <span class="etiqueta acento">Tu plan</span>
  <h1>{prop.rutina.nombre}</h1>

  <div class="tarjeta">
    <span class="etiqueta">Rutina · se hace en este orden</span>
    {#each prop.rutina.sesiones as s, i}
      <div class="ses">
        <div class="fila entre"><b>{i + 1}. {s.nombre}</b><span class="sec peq">{s.items.length} ejercicios · {fmtMin(duracionSesion(s.items, app.datos.ajustes))}</span></div>
        <p class="sec peq">{s.items.map((x) => ej(x.ej)?.n).join(' · ')}</p>
      </div>
    {/each}
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Dieta · {nombreObj[prop.dieta.objetivo] ?? ''}</span>
    <div class="fila entre envolver">
      <div><p class="cifra">{prop.dieta.kcal.toLocaleString('es-ES')}</p><p class="sec peq">kcal al día</p></div>
      <div><p class="cifra">{prop.dieta.p}</p><p class="sec peq">g proteína</p></div>
      <div><p class="cifra">{prop.dieta.hc}</p><p class="sec peq">g hidratos</p></div>
      <div><p class="cifra">{prop.dieta.g}</p><p class="sec peq">g grasa</p></div>
    </div>
    <p class="sec peq">Raciones al día: {prop.dieta.raciones.P} de proteína, {prop.dieta.raciones.HC} de hidratos, {prop.dieta.raciones.G} de grasa y {prop.dieta.raciones.fruta} de fruta; verdura libre.
      Gasto estimado {prop.dieta.tdee.toLocaleString('es-ES')} kcal{#if prop.dieta.grasa != null}; grasa corporal estimada {prop.dieta.grasa.toLocaleString('es-ES')} %{/if}.</p>
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Por qué</span>
    {#each porQue(app.datos.perfil, prop.rutina) as r}<p class="peq">· {r}</p>{/each}
    {#if app.datos.perfil.parqSi}<p class="peq aviso">· Marcaste alguna respuesta del PAR-Q+: consulta con tu médico antes de subir la intensidad.</p>{/if}
  </div>

  <p class="sec peq">A las 3 semanas, PARE recalcula tu gasto con lo que comes y lo que pesas, y ajusta la dieta si hace falta.</p>
  <button class="boton ancho" onclick={() => aceptar(false)}>{yaTenia ? 'Sustituir mi plan por este' : 'Empezar'}</button>
  <button class="boton sec2 ancho" onclick={() => aceptar(true)}>Ajustar la rutina antes</button>
  {#if yaTenia}<button class="enlace" onclick={descartar}>Mantener mi plan actual</button>{/if}
</div>
{/if}

<style>
  .ses { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; border-top: 1px solid var(--borde); }
  .ses:first-of-type { border-top: 0; }
  .aviso { color: var(--aviso); }
  .pantalla { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); }
</style>
