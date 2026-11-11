<script>
  import { app, aviso } from '../lib/estado.svelte.js';
  import { ZONAS, ej } from '../lib/catalogo.js';
  import { restriccion, nivelActual } from '../lib/entreno.js';
  import Icono from '../componentes/Icono.svelte';
  import { comidaTrasEntreno } from '../lib/dieta.js';
  let p = $derived(app.datos.perfil);
  const toggle = (z) => { const i = p.molestias.indexOf(z); i >= 0 ? p.molestias.splice(i, 1) : p.molestias.push(z); };
  const afectados = $derived.by(() => {
    const r = app.datos.rutina;
    if (!r) return [];
    return r.sesiones.flatMap((s) => s.items.map((it) => ({ s, it, r: restriccion(it.ej, p.molestias) })))
      .filter((x) => x.r && x.r.nivel !== 'recomendado');
  });
  function sustituir(x) {
    const alt = x.r.alternativas?.[0];
    if (!alt) return;
    x.it.ej = alt; x.it.carga = null;
    aviso(`Cambiado por ${ej(alt)?.n}`);
  }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Perfil</span></div>
  <h1>Perfil</h1>
  <label class="campo">Nombre o alias<input type="text" bind:value={p.nombre} /></label>
  <div class="tarjeta">
    <span class="etiqueta">Nivel</span>
    <div class="fila envolver">{#each [['principiante', 'Principiante'], ['intermedio', 'Intermedio'], ['avanzado', 'Avanzado']] as [v, l]}<button class="chip" class:on={p.nivel === v} onclick={() => (p.nivel = v)}>{l}</button>{/each}</div>
    <p class="sec peq">Según tu experiencia y lo que llevas entrenado con PARE: {nivelActual(p, app.datos.sesiones)}. Cambia el plazo de los avisos de estancamiento.</p>
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Fase de dieta</span>
    <div class="fila envolver">{#each [['deficit', 'Déficit'], ['mantenimiento', 'Mantenimiento'], ['superavit', 'Superávit']] as [v, l]}<button class="chip" class:on={p.faseDieta === v} onclick={() => (p.faseDieta = v)}>{l}</button>{/each}</div>
    <p class="sec peq">En déficit, mantener la fuerza no cuenta como estancamiento.</p>
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Hora a la que sueles entrenar</span>
    <div class="fila envolver">{#each [['temprano', 'Temprano (antes de las 9)'], ['manana', 'Por la mañana'], ['mediodia', 'A mediodía'], ['tarde', 'Por la tarde'], ['noche', 'Por la noche'], ['varia', 'Varía']] as [v, l]}<button class="chip" class:on={(p.horaEntreno || 'varia') === v} onclick={() => (p.horaEntreno = v)}>{l}</button>{/each}</div>
    <p class="sec peq">Los hidratos extra de los días exigentes van a la comida de después de entrenar{app.datos.dieta ? `: ahora, ${comidaTrasEntreno(app.datos.dieta.comidas, p.horaEntreno).nombre.toLowerCase()}` : ''}.</p>
  </div>

  <div class="tarjeta" id="molestias">
    <span class="etiqueta">Molestias</span>
    <div class="fila envolver">{#each ZONAS as [z, l]}<button class="chip" class:on={p.molestias.includes(z)} onclick={() => toggle(z)}>{l}</button>{/each}</div>
    {#if afectados.length}
      <span class="sec peq">Ejercicios de tu rutina afectados:</span>
      {#each afectados as x}
        <div class="col" style="gap:4px;border-top:1px solid var(--borde);padding-top:8px">
          <p class="peq"><b>{ej(x.it.ej)?.n}</b> ({x.s.nombre}) — <span class={x.r.nivel === 'evitar' ? 'mal' : 'av'}>{x.r.nivel === 'evitar' ? 'evitar' : 'precaución'}</span>. {x.r.motivo}</p>
          {#if x.r.alternativas?.length}<button class="enlace" style="align-self:flex-start;padding:2px 0" onclick={() => sustituir(x)}>Sustituir por {ej(x.r.alternativas[0])?.n}</button>{/if}
        </div>
      {/each}
    {:else if p.molestias.length}<p class="sec peq">Tu rutina no tiene ejercicios afectados.</p>{/if}
    <p class="sec peq">Son criterios generales, no un diagnóstico. Si el dolor empeora o dura más de 2-3 semanas, consúltalo con un profesional sanitario.</p>
  </div>
</div>

<style>
  .mal { color: var(--entrenar); }
  .av { color: var(--aviso); }
</style>
