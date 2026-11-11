<script>
  import { app } from '../lib/estado.svelte.js';
  import { abrirArchivo } from '../lib/archivo.js';
  import { estadosEjercicios } from '../lib/avisos.js';
  import { sesionEsquivada } from '../lib/sesiones.js';
  import { ej } from '../lib/catalogo.js';
  import { fmtFecha } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  let entrada;
  async function elegido(e) { const f = e.target.files?.[0]; e.target.value = ''; if (f) await abrirArchivo(f); }
  function resumen(dep) {
    const d = { ...dep.datos, sesiones: dep.datos.sesiones ?? [], medidas: dep.datos.medidas ?? [], secuencia: dep.datos.secuencia ?? {}, perfil: dep.datos.perfil ?? {} };
    const out = [];
    const esq = sesionEsquivada(d);
    if (esq) out.push(esq.texto);
    const est = estadosEjercicios(d);
    const est2 = Object.entries(est).filter(([, e]) => e.estado === 'estancado' || e.estado === 'bajando');
    if (est2.length) out.push(`${est2.length} ejercicio(s) estancados o bajando: ${est2.slice(0, 2).map(([id]) => ej(id)?.n).join(', ')}`);
    return out;
  }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" onclick={() => (app.vista = null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Modo entrenador</span></div>
  <h1>Mis deportistas</h1>
  {#each app.datos.entrenador.deportistas as dep (dep.id)}
    {@const av = resumen(dep)}
    <button class="tarjeta pulsable" onclick={() => (app.vista = { nombre: 'deportista', id: dep.id, acento: 'yo' })}>
      <div class="fila entre"><b>{dep.nombre}</b><span class="sec peq">archivo del {fmtFecha(dep.creado?.slice(0, 10))}</span></div>
      {#each av as a}<span class="peq aviso">· {a}</span>{:else}<span class="sec peq">Sin avisos</span>{/each}
      {#if dep.propuesta}<span class="insignia">Cambios preparados sin enviar</span>{/if}
    </button>
  {:else}
    <p class="vacio">Aún no tienes deportistas. Pídeles que te manden su archivo desde Yo → Archivo PARE → Enviar a mi entrenador, y ábrelo aquí.</p>
  {/each}
  <button class="boton ancho" onclick={() => entrada.click()}>Abrir archivo de un deportista</button>
  <input bind:this={entrada} type="file" accept=".json,application/json" class="oculto" onchange={elegido} />
</div>

<style>
  .pulsable { text-align: left; cursor: pointer; width: 100%; }
  .aviso { color: var(--aviso); }
</style>
