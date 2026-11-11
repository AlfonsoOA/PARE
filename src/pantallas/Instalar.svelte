<script>
  import { onDestroy } from 'svelte';
  import { app, aviso } from '../lib/estado.svelte.js';
  import { URL_PARE, puedeInstalar, alCambiar, instalar, instalada, plataforma, navegadorInterno, compartirPare } from '../lib/instalar.js';
  import Icono from '../componentes/Icono.svelte';
  import QR from '../componentes/QR.svelte';

  let ofrecer = $state(puedeInstalar());
  onDestroy(alCambiar(() => (ofrecer = puedeInstalar())));
  const ya = instalada();
  const pl = plataforma();
  const interno = navegadorInterno();
  let sistema = $state(pl === 'ios' ? 'ios' : 'android');

  async function pulsarInstalar() {
    if (await instalar()) aviso('PARE instalada: ya la tienes en la pantalla de inicio');
  }
  async function compartir() {
    const r = await compartirPare();
    if (r === 'copiado') aviso('Enlace copiado: pégalo en WhatsApp');
    else if (r === 'nada') aviso('Comparte este enlace: ' + URL_PARE);
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(URL_PARE); aviso('Enlace copiado'); } catch { aviso(URL_PARE); }
  }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Instalar y compartir</span></div>
  <h1>Instalar PARE</h1>

  {#if ya}
    <div class="tarjeta ok"><p><b>Ya la tienes instalada.</b> Se abre desde su icono, a pantalla completa y funciona sin conexión.</p></div>
  {:else}
    {#if interno}
      <div class="aviso-l"><Icono n="aviso" tam={20} /><p>Estás en el navegador de otra app (WhatsApp, Instagram, el lector de QR…), y desde ahí no se puede instalar. Ábrela en {pl === 'ios' ? 'Safari' : 'Chrome'}: menú <b>⋮</b> o <b>···</b> → «Abrir en el navegador».</p></div>
    {/if}
    {#if ofrecer}
      <button class="boton ancho" onclick={pulsarInstalar}><Icono n="mas" /> Instalar PARE en este móvil</button>
    {/if}
    <p class="sec">Instalada, PARE tiene su icono, se abre a pantalla completa y funciona sin conexión, como una app de la tienda. No ocupa casi nada y no pide permisos.</p>

    <div class="pestanas" role="tablist">
      <button role="tab" aria-selected={sistema === 'android'} class:on={sistema === 'android'} onclick={() => (sistema = 'android')}>Android</button>
      <button role="tab" aria-selected={sistema === 'ios'} class:on={sistema === 'ios'} onclick={() => (sistema = 'ios')}>iPhone</button>
    </div>
    {#if sistema === 'android'}
      <ol class="pasos">
        <li>Abre este enlace en <b>Chrome</b>.</li>
        <li>Toca el menú <b>⋮</b> (arriba a la derecha).</li>
        <li>Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</li>
        <li>Confirma. El icono de PARE aparece con tus apps.</li>
      </ol>
      <p class="sec peq">En Samsung Internet: menú <b>≡</b> → «Añadir página a» → «Pantalla de inicio».</p>
    {:else}
      <ol class="pasos">
        <li>Abre este enlace en <b>Safari</b> (en otros navegadores del iPhone puede no salir la opción).</li>
        <li>Toca el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li>
        <li>Baja y elige <b>«Añadir a pantalla de inicio»</b>.</li>
        <li>Toca <b>Añadir</b>. El icono de PARE aparece con tus apps.</li>
      </ol>
    {/if}
  {/if}

  <h2>Compartir PARE</h2>
  <div class="tarjeta centro">
    <QR texto={URL_PARE} tam={190} />
    <p class="sec peq">Que lo escaneen con la cámara.</p>
    <button class="enlace" onclick={copiar}>{URL_PARE.replace('https://', '')}</button>
  </div>
  <button class="boton ancho" onclick={compartir}><Icono n="compartir" /> Compartir el enlace</button>
  <p class="sec peq">Cada persona tiene sus datos en su propio móvil: no hay cuentas ni se comparte nada al pasar el enlace. Para llevarte tus datos a otro móvil, usa Yo → Archivo PARE → Copia de seguridad.</p>
</div>

<style>
  .ok { border-color: color-mix(in srgb, var(--comer) 50%, var(--borde)); }
  .pasos { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; line-height: 1.45; }
  .centro { align-items: center; text-align: center; }
  h2 { margin-top: 10px; }
  .pestanas { display: flex; gap: 4px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 4px; }
  .pestanas button { flex: 1; background: none; border: 0; border-radius: 9px; min-height: 40px; color: var(--texto2); font-size: 14px; cursor: pointer; }
  .pestanas button.on { background: var(--elevada); color: var(--acento); font-weight: 600; }
</style>
