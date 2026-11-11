<script>
  import { app, datosVacios, reemplazarDatos, ir } from '../lib/estado.svelte.js';
  import Icono from '../componentes/Icono.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  let a = $derived(app.datos.ajustes);
  let borrar = $state(false);
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Ajustes</span></div>
  <h1>Ajustes</h1>
  <div class="tarjeta">
    <span class="etiqueta">Unidades</span>
    <div class="fila"><button class="chip" class:on={a.unidades === 'kg'} onclick={() => (a.unidades = 'kg')}>kg</button><button class="chip" class:on={a.unidades === 'lb'} onclick={() => (a.unidades = 'lb')}>lb</button></div>
    <p class="sec peq">Todo se guarda en kg; cambiar de unidad no altera los datos.</p>
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Incremento de carga (kg)</span>
    {#each [['barra', 'Barra'], ['mancuerna', 'Mancuernas y kettlebell'], ['maquina', 'Máquina'], ['polea', 'Polea'], ['otro', 'Otros']] as [k, l]}
      <label class="fila entre"><span>{l}</span><input type="number" inputmode="decimal" step="0.25" bind:value={a.incrementos[k]} style="max-width:110px;text-align:center" /></label>
    {/each}
    <p class="sec peq">En polea y máquina, pon el salto de la pila de tu gimnasio.</p>
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Sesión</span>
    <label class="fila entre"><span>Segundos por serie (para estimar la duración)</span><input type="number" inputmode="numeric" bind:value={a.segPorSerie} style="max-width:90px;text-align:center" /></label>
    <label class="fila entre"><span>Mantener la pantalla encendida</span><input type="checkbox" bind:checked={a.pantallaEncendida} style="width:26px;height:26px" /></label>
    <p class="sec peq">El descanso se ve en pantalla: sin sonidos ni vibraciones.</p>
  </div>
  <div class="tarjeta">
    <span class="etiqueta">Copia de seguridad</span>
    <label class="fila entre"><span>Recordármela cada (días)</span><input type="number" inputmode="numeric" bind:value={a.recordatorioCopiaDias} style="max-width:90px;text-align:center" /></label>
  </div>
  <button class="boton peligro ancho" onclick={() => (borrar = true)}>Borrar todos mis datos</button>
</div>

{#if borrar}
  <Hoja titulo="¿Borrar todo?" cerrar={() => (borrar = false)}>
    <p class="sec">Se borra todo lo de este móvil: rutina, sesiones, dieta y medidas. Haz antes una copia de seguridad si quieres conservarlo.</p>
    <button class="boton peligro ancho" onclick={() => { reemplazarDatos(datosVacios()); app.sesionActiva = null; borrar = false; ir('hoy'); }}>Sí, borrar todo</button>
  </Hoja>
{/if}
