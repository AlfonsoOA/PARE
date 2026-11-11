<script>
  import { app, aviso, uuid } from '../lib/estado.svelte.js';
  import { GRUPOS_RACION, NOMBRE_RACION, comidaTrasEntreno } from '../lib/dieta.js';
  import { HORA_ENTRENO } from '../lib/dieta.js';
  import Icono from '../componentes/Icono.svelte';
  let dd = $derived(app.datos.dieta);
  let perfil = $derived(app.datos.perfil);
  const total = (g) => dd.comidas.reduce((s, c) => s + (+c.raciones[g] || 0), 0);
  function recalcular() { for (const g of GRUPOS_RACION) dd.raciones[g] = total(g); aviso('Pauta actualizada'); }
  function nuevaComida() { dd.comidas.push({ id: uuid().slice(0, 8), nombre: 'Nueva comida', hora: '12:00', raciones: { P: 0, HC: 0, G: 0, fruta: 0, lacteo: 0 }, verdura: false }); }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => { recalcular(); app.vista = null; }} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Mi dieta</span></div>
  <h1>Mi dieta</h1>
  {#if !dd}<p class="vacio">Sin pauta. Haz el test de inicio.</p>{:else}
    <div class="tarjeta">
      <div class="fila entre envolver">
        <label class="campo" style="flex:1">kcal<input type="number" inputmode="numeric" bind:value={dd.kcal} /></label>
        <label class="campo" style="flex:1">Prot. (g)<input type="number" inputmode="numeric" bind:value={dd.p} /></label>
        <label class="campo" style="flex:1">Hidr. (g)<input type="number" inputmode="numeric" bind:value={dd.hc} /></label>
        <label class="campo" style="flex:1">Grasa (g)<input type="number" inputmode="numeric" bind:value={dd.g} /></label>
      </div>
      <p class="sec peq">Gasto estimado al empezar: {dd.tdee?.toLocaleString('es-ES')} kcal. A las 3 semanas, mira el gasto real en Progreso → Cuerpo.</p>
    </div>
    <div class="tarjeta">
      <label class="fila entre"><span><b>Días de más hidratos</b><br /><span class="sec peq">+1 ración de hidratos en las sesiones exigentes (como la de pierna), descontada de los días sin entreno. El total semanal no cambia. Va a la comida que elijas abajo.</span></span>
        <input type="checkbox" bind:checked={dd.hidratosExtra} style="width:26px;height:26px;flex-shrink:0" /></label>
      {#if dd.hidratosExtra}
        {@const auto = comidaTrasEntreno(dd.comidas, perfil.horaEntreno)}
        <span class="peq">El extra va a:</span>
        <div class="fila envolver" style="gap:6px">
          <button class="chip" class:on={!dd.hidratosExtraEn} onclick={() => (dd.hidratosExtraEn = null)}>Automático: {auto.nombre.toLowerCase()}</button>
          {#each dd.comidas as c (c.id)}<button class="chip" class:on={dd.hidratosExtraEn === c.id} onclick={() => (dd.hidratosExtraEn = c.id)}>{c.nombre}</button>{/each}
        </div>
        <p class="sec peq">{HORA_ENTRENO[perfil.horaEntreno] != null ? 'Automático = la primera comida de verdad después de tu hora de entreno (un batido no cuenta).' : 'Automático = la comida; di a qué hora entrenas en Yo → Perfil.'} Si desayunas antes de entrenar y después solo tomas un batido, lo normal es la comida.</p>
      {/if}
    </div>
    <div class="tarjeta">
      <span class="etiqueta">Para proponerte recetas</span>
      <span class="peq">Tiempo para cocinar</span>
      <div class="fila envolver">{#each [['poco', 'Poco (15 min)'], ['normal', 'Normal'], ['mucho', 'Me gusta cocinar']] as [v, l]}<button class="chip" class:on={(perfil.cocina?.tiempo ?? 'normal') === v} onclick={() => (perfil.cocina = { ...(perfil.cocina ?? {}), tiempo: v })}>{l}</button>{/each}</div>
      <span class="peq">Presupuesto</span>
      <div class="fila envolver">{#each [['ajustado', 'Ajustado'], ['normal', 'Normal']] as [v, l]}<button class="chip" class:on={(perfil.cocina?.presupuesto ?? 'normal') === v} onclick={() => (perfil.cocina = { ...(perfil.cocina ?? {}), presupuesto: v })}>{l}</button>{/each}</div>
      <p class="sec peq">Junto con tu objetivo y lo que marques como «me gusta», decide qué platos salen primero en Recetas y en el menú automático.</p>
    </div>
    <h2>Comidas</h2>
    {#each dd.comidas as c, i (c.id)}
      <div class="tarjeta">
        <div class="fila"><input type="text" bind:value={c.nombre} aria-label="Nombre de la comida" /><input type="text" bind:value={c.hora} aria-label="Hora" style="max-width:90px;text-align:center" /></div>
        <div class="rej">
          {#each GRUPOS_RACION as g}<label class="campo">{NOMBRE_RACION[g]}<input type="number" inputmode="decimal" step="0.5" bind:value={c.raciones[g]} /></label>{/each}
        </div>
        <label class="fila peq"><input type="checkbox" bind:checked={c.verdura} style="width:22px;height:22px" /> Verdura libre</label>
        {#if dd.comidas.length > 2}<button class="enlace" style="align-self:flex-start;color:var(--entrenar)" onclick={() => dd.comidas.splice(i, 1)}>Quitar comida</button>{/if}
      </div>
    {/each}
    <button class="boton sec2 ancho" onclick={nuevaComida}>Añadir comida</button>
    <p class="sec peq">Total: {GRUPOS_RACION.map((g) => `${total(g)} ${NOMBRE_RACION[g].toLowerCase()}`).join(' · ')}</p>
    <button class="boton ancho" onclick={() => { recalcular(); app.vista = null; }}>Guardar</button>
  {/if}
</div>

<style>
  .rej { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .rej input { text-align: center; padding: 0 4px; }
  .rej .campo { font-size: 11px; }
</style>
