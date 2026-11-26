<script>
  import { app, aviso, uuid } from '../lib/estado.svelte.js';
  import { archivoDieta, compartir } from '../lib/archivo.js';
  async function compartirDieta() {
    const r = await compartir(archivoDieta(app.datos.dieta), app.datos.perfil.nombre);
    if (r !== 'cancelado') aviso(r === 'compartido' ? 'Dieta enviada' : 'Archivo descargado: mándalo por WhatsApp');
  }
  import { GRUPOS_RACION, NOMBRE_RACION, comidaTrasEntreno, propuestaKcal, DIAS_SEMANA } from '../lib/dieta.js';
  // Fijar las kcal a mano: se ve la propuesta antes de aplicarla, y se puede deshacer
  let objetivo = $state(null);
  let prop = $state(null);
  function calcularPropuesta() { if (+objetivo > 800) prop = propuestaKcal(app.datos.dieta, +objetivo); }
  // Viene de «Ajustar mi dieta a X kcal» (Progreso → la báscula frente a lo que comes): la propuesta ya preparada
  const desdeBascula = app.vista?.kcal;
  if (desdeBascula && app.datos.dieta) { objetivo = desdeBascula; calcularPropuesta(); }
  function aplicarPropuesta() {
    app.datos.dietaAnterior = JSON.parse(JSON.stringify(app.datos.dieta));
    app.datos.dieta = prop.dieta; prop = null; objetivo = null;
    aviso('Dieta y menú ajustados');
  }
  function deshacer() { app.datos.dieta = app.datos.dietaAnterior; app.datos.dietaAnterior = null; aviso('Vuelves a la dieta de antes'); }
  const nombreComida = (id) => app.datos.dieta?.comidas.find((c) => c.id === id)?.nombre ?? id;
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
      <div class="fijar">
        <span class="etiqueta">Fijar mis kcal diarias</span>
        <p class="sec peq" style="margin:0">Si ya sabes cuánto quieres comer (te lo ha dado un profesional, o lo has comprobado con la báscula), escríbelo: la proteína se queda igual y se ajustan los hidratos y la grasa, en la pauta y en los gramos de tu menú (arroz, pan, patata, aceite…).</p>
        <div class="fila" style="gap:8px">
          <input type="number" inputmode="numeric" placeholder="p. ej. 2400" bind:value={objetivo} style="flex:1" aria-label="kcal diarias" />
          <button class="boton" disabled={!(+objetivo > 800)} onclick={calcularPropuesta}>Ver cambios</button>
        </div>
        {#if prop}
          <div class="propuesta">
            <p class="peq" style="margin:0"><b>Tu menú pasa de ~{prop.antes.toLocaleString('es-ES')} a ~{prop.despues.toLocaleString('es-ES')} kcal al día.</b> Hidratos y grasa ×{prop.f.toLocaleString('es-ES', { maximumFractionDigits: 2 })}; la proteína no cambia.</p>
            {#if prop.limitado}<p class="peq aviso" style="margin:0">Es un cambio muy grande: se ha limitado. Revisa la pauta a mano o cambia el menú.</p>{/if}
            {#if prop.cambios.length}
              <details><summary class="peq">Ver los {prop.cambios.length} cambios de gramos del menú</summary>
                <ul class="peq lista">{#each prop.cambios.slice(0, 60) as c}<li>{DIAS_SEMANA[c.dia]} · {nombreComida(c.comida)}: {c.n} {c.de} → <b>{c.a} g</b></li>{/each}</ul>
              </details>
            {/if}
            <div class="fila" style="gap:8px"><button class="boton" style="flex:1" onclick={aplicarPropuesta}>Aplicar</button><button class="boton sec2" style="flex:1" onclick={() => (prop = null)}>Cancelar</button></div>
          </div>
        {/if}
        {#if app.datos.dietaAnterior && !prop}<button class="enlace" style="align-self:flex-start;padding:0" onclick={deshacer}>Deshacer el último ajuste ({app.datos.dietaAnterior.kcal} kcal)</button>{/if}
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
      <span class="peq">Tipo de alimentación</span>
      <div class="fila envolver">{#each [['omnivora', 'Como de todo'], ['vegetariana', 'Vegetariana'], ['vegana', 'Vegana']] as [v, l]}<button class="chip" class:on={(perfil.cocina?.dieta ?? 'omnivora') === v} onclick={() => (perfil.cocina = { ...(perfil.cocina ?? {}), dieta: v })}>{l}</button>{/each}</div>
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
    <button class="boton sec2 ancho" onclick={compartirDieta}>Compartir mi dieta</button>
  {/if}
</div>

<style>
  .fijar { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid var(--borde); margin-top: 4px; }
  .propuesta { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 12px; background: var(--elevada); }
  .lista { margin: 6px 0 0; padding-left: 18px; max-height: 220px; overflow: auto; }
  .aviso { color: var(--entrenar); }
  .rej { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .rej input { text-align: center; padding: 0 4px; }
  .rej .campo { font-size: 11px; }
</style>
