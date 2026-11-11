<script>
  import { app, reemplazarDatos, aviso, ir } from '../lib/estado.svelte.js';
  import { INCLUYE, archivoDeportista, compartir, abrirArchivo, hacerCopia } from '../lib/archivo.js';
  import { fmtFecha } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';

  let incluye = $state(INCLUYE.map(([k]) => k));
  let centro = $state(false);
  let entrada;
  const toggle = (k) => { const i = incluye.indexOf(k); i >= 0 ? incluye.splice(i, 1) : incluye.push(k); };
  async function enviar() {
    const r = await compartir(archivoDeportista([...incluye], centro), app.datos.perfil.nombre);
    if (r !== 'cancelado') aviso(r === 'compartido' ? 'Enviado' : 'Archivo descargado: mándalo por WhatsApp o correo');
  }
  async function elegido(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) await abrirArchivo(f); }
  const pendiente = $derived(app.archivoPendiente);
  function restaurar() { reemplazarDatos(pendiente.datos); app.archivoPendiente = null; aviso('Copia restaurada'); ir('hoy'); }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Archivo PARE</span></div>
  <h1>Archivo PARE</h1>

  {#if pendiente}
    <div class="tarjeta aviso-t">
      <h2>¿Restaurar esta copia?</h2>
      <p class="sec">Copia de {pendiente.de?.nombre} del {fmtFecha(pendiente.creado.slice(0, 10))}. Sustituye todo lo que hay ahora en este móvil.</p>
      <button class="boton ancho" onclick={restaurar}>Sí, restaurar</button>
      <button class="boton sec2 ancho" onclick={() => (app.archivoPendiente = null)}>Cancelar</button>
    </div>
  {/if}

  <div class="tarjeta">
    <h2>Enviar a mi entrenador</h2>
    <span class="sec peq">Qué incluir</span>
    {#each INCLUYE as [k, l]}
      <label class="fila"><input type="checkbox" checked={incluye.includes(k)} onchange={() => toggle(k)} style="width:24px;height:24px" /> {l}</label>
    {/each}
    <label class="fila"><input type="checkbox" bind:checked={centro} style="width:24px;height:24px" /> Autorizo también al centro de mi entrenador</label>
    <p class="peq aviso-txt">Lo que envíes ya no se puede recuperar. Para dejar de compartir, deja de enviar.</p>
    <button class="boton ancho" disabled={!incluye.length} onclick={enviar}><Icono n="compartir" /> Enviar</button>
  </div>

  <div class="tarjeta">
    <h2>Abrir un archivo</h2>
    <p class="sec peq">Los cambios que te manda tu entrenador, el archivo de un deportista (modo entrenador) o una copia de seguridad.</p>
    <button class="boton sec2 ancho" onclick={() => entrada.click()}>Elegir archivo</button>
    <input bind:this={entrada} type="file" accept=".json,application/json" class="oculto" onchange={elegido} />
  </div>

  <div class="tarjeta">
    <h2>Copia de seguridad</h2>
    <p class="sec peq">Todo lo de este móvil en un archivo. Guárdalo fuera del móvil (correo, nube). Última: {app.datos.ajustes.ultimaCopia ? fmtFecha(app.datos.ajustes.ultimaCopia.slice(0, 10)) : 'nunca'}.</p>
    <button class="boton sec2 ancho" onclick={hacerCopia}>Hacer copia ahora</button>
    <p class="sec peq">Para restaurarla en otro móvil: Bienvenida → Tengo un archivo PARE, o aquí → Elegir archivo.</p>
  </div>
</div>

<style>
  .aviso-txt { color: var(--aviso); }
  .aviso-t { border-color: var(--aviso); }
</style>
