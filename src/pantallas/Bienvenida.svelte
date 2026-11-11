<script>
  import { app } from '../lib/estado.svelte.js';
  import { abrirArchivo } from '../lib/archivo.js';
  import Logo from '../componentes/Logo.svelte';
  let entrada;
  async function elegido(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) await abrirArchivo(f);
  }
</script>

<div class="pantalla bienvenida">
  <div class="marca">
    <Logo tam={150} />
    <p class="lema">EARN YOUR REWARD</p>
  </div>
  <div class="col">
    <h1>Entrena, come y progresa con cabeza.</h1>
    <p class="sec">Un test de 7 bloques y PARE te monta la rutina y la dieta. Después mandas tú.</p>
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Unidades</span>
    <div class="fila">
      <button class="chip" class:on={app.datos.ajustes.unidades === 'kg'} onclick={() => (app.datos.ajustes.unidades = 'kg')}>Kilos (kg)</button>
      <button class="chip" class:on={app.datos.ajustes.unidades === 'lb'} onclick={() => (app.datos.ajustes.unidades = 'lb')}>Libras (lb)</button>
    </div>
    <p class="sec peq">Idioma: español. La versión en inglés llegará más adelante.</p>
  </div>

  <p class="sec peq privado">Todo se guarda en tu móvil. Solo sale si tú lo envías.</p>

  <button class="boton ancho" onclick={() => (app.vista = { nombre: 'test' })}>Empezar</button>
  <button class="boton sec2 ancho" onclick={() => entrada.click()}>Tengo un archivo PARE</button>
  <input bind:this={entrada} type="file" accept=".json,.pare,application/json" class="oculto" onchange={elegido} />
</div>

<style>
  .bienvenida { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); justify-content: center; min-height: 100dvh; gap: 18px; }
  .marca { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 0 6px; }
  .lema { font-family: var(--titulos); font-weight: 600; letter-spacing: 0.32em; color: var(--progreso); font-size: 16px; }
  .privado { text-align: center; }
</style>
