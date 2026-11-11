<script>
  import { app, aviso } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { archivoCambios, compartir } from '../lib/archivo.js';
  import { duracionSesion } from '../lib/entreno.js';
  import { fmt, fmtFecha, fmtMin } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  import Progreso from './Progreso.svelte';
  import Hoja from '../componentes/Hoja.svelte';

  let { id } = $props();
  const dep = app.datos.entrenador.deportistas.find((x) => x.id === id);
  const datos = dep ? { sesiones: [], medidas: [], comidas: {}, secuencia: {}, ...dep.datos, perfil: { nivel: 'principiante', ...(dep.datos.perfil ?? {}) } } : null;
  let ver = $state('progreso');
  let editarDieta = $state(null);
  let borrar = $state(false);

  async function enviar() {
    const r = await compartir(archivoCambios(dep), dep.nombre);
    if (r !== 'cancelado') { dep.enviado = new Date().toISOString(); aviso('Cambios enviados'); }
  }
  function abrirDieta() {
    const base = dep.propuesta?.dieta ?? datos.dieta;
    editarDieta = base ? JSON.parse(JSON.stringify(base)) : null;
  }
  function guardarDieta() {
    dep.propuesta = { ...(dep.propuesta ?? {}), dieta: editarDieta };
    editarDieta = null; aviso('Dieta preparada para enviar');
  }
  function quitarDep() {
    const l = app.datos.entrenador.deportistas;
    l.splice(l.findIndex((x) => x.id === id), 1);
    app.vista = { nombre: 'deportistas', acento: 'yo' };
  }
</script>

{#if !dep}
  <div class="pantalla"><p class="vacio">Deportista no encontrado.</p></div>
{:else}
<div class="pantalla">
  <div class="fila"><button class="icono-b" onclick={() => (app.vista = { nombre: 'deportistas', acento: 'yo' })} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Deportista</span></div>
  <h1>{dep.nombre}</h1>
  <p class="sec peq">Foto del {fmtFecha(dep.creado?.slice(0, 10))}, no está en directo. Incluye: {dep.incluye?.join(', ')}.{dep.autoriza?.centro ? ' Autoriza también a tu centro.' : ''}</p>

  <div class="pestanas">
    {#each [['progreso', 'Progreso'], ['rutina', 'Rutina'], ['dieta', 'Dieta']] as [v, l]}<button class:on={ver === v} onclick={() => (ver = v)}>{l}</button>{/each}
  </div>

  {#if ver === 'progreso'}
    {#if datos.sesiones?.length || datos.medidas?.length}<Progreso {datos} depId={id} />{:else}<p class="vacio">No ha incluido su progreso.</p>{/if}
  {:else if ver === 'rutina'}
    {@const r = dep.propuesta?.rutina ?? datos.rutina}
    {#if r}
      {#if dep.propuesta?.rutina}<span class="insignia aviso">Mostrando tu propuesta (sin enviar)</span>{/if}
      {#each r.sesiones as s}
        <div class="tarjeta"><div class="fila entre"><b>{s.nombre}</b><span class="sec peq">{fmtMin(duracionSesion(s.items, app.datos.ajustes))}</span></div>
          {#each s.items as it}<p class="peq">{ej(it.ej)?.n} · {it.series}×{it.repMin}-{it.repMax} · {it.carga != null ? fmt(it.carga) : '—'}</p>{/each}
        </div>
      {/each}
      <button class="boton ancho" onclick={() => (app.vista = { nombre: 'editor', modo: 'entrenador', depId: id, acento: 'entrenar' })}>Proponer cambios en la rutina</button>
    {:else}<p class="vacio">No ha incluido su rutina.</p>{/if}
  {:else}
    {@const dd = dep.propuesta?.dieta ?? datos.dieta}
    {#if dd}
      <div class="tarjeta">
        <p><b>{dd.kcal.toLocaleString('es-ES')} kcal</b> · {dd.p} g proteína · {dd.hc} g hidratos · {dd.g} g grasa</p>
        {#each dd.comidas as c}<p class="peq">{c.nombre}: {Object.entries(c.raciones).filter(([, n]) => n > 0).map(([g, n]) => `${n} ${g}`).join(', ')}</p>{/each}
      </div>
      <button class="boton ancho" onclick={abrirDieta}>Proponer cambios en la dieta</button>
    {:else}<p class="vacio">No ha incluido su dieta.</p>{/if}
  {/if}

  {#if dep.propuesta}
    <div class="tarjeta">
      <span class="etiqueta">Cambios preparados</span>
      <p class="peq">{[dep.propuesta.rutina && 'rutina', dep.propuesta.dieta && 'dieta'].filter(Boolean).join(' y ')}</p>
      <textarea placeholder="Nota para {dep.nombre} (opcional)" bind:value={dep.propuesta.nota}></textarea>
      <button class="boton ancho" onclick={enviar}><Icono n="compartir" /> Enviar cambios</button>
      <button class="enlace" onclick={() => (dep.propuesta = null)}>Descartar los cambios preparados</button>
    </div>
  {/if}
  <button class="boton peligro ancho" onclick={() => (borrar = true)}>Quitar de mis deportistas</button>
</div>

{#if editarDieta}
  <Hoja titulo="Dieta de {dep.nombre}" cerrar={() => (editarDieta = null)}>
    <label class="campo">kcal al día<input type="number" inputmode="numeric" bind:value={editarDieta.kcal} /></label>
    <div class="fila"><label class="campo">Proteína (g)<input type="number" bind:value={editarDieta.p} /></label><label class="campo">Hidratos (g)<input type="number" bind:value={editarDieta.hc} /></label><label class="campo">Grasa (g)<input type="number" bind:value={editarDieta.g} /></label></div>
    {#each editarDieta.comidas as c}
      <div class="col"><b>{c.nombre}</b>
        <div class="fila">{#each ['P', 'HC', 'G', 'fruta'] as g}<label class="campo">{g}<input type="number" step="0.5" bind:value={c.raciones[g]} /></label>{/each}</div>
      </div>
    {/each}
    <button class="boton ancho" onclick={() => { for (const g of ['P', 'HC', 'G', 'fruta', 'lacteo']) editarDieta.raciones[g] = editarDieta.comidas.reduce((s, c) => s + (+c.raciones[g] || 0), 0); guardarDieta(); }}>Preparar cambios</button>
  </Hoja>
{/if}
{#if borrar}
  <Hoja titulo="¿Quitar a {dep.nombre}?" cerrar={() => (borrar = false)}>
    <p class="sec">Se borran de este móvil sus datos. Si te vuelve a mandar su archivo, aparecerá de nuevo.</p>
    <button class="boton peligro ancho" onclick={quitarDep}>Quitar</button>
  </Hoja>
{/if}
{/if}

<style>
  .pestanas { display: flex; gap: 4px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 4px; }
  .pestanas button { flex: 1; background: none; border: 0; border-radius: 9px; min-height: 40px; color: var(--texto2); cursor: pointer; }
  .pestanas button.on { background: var(--elevada); color: var(--acento); font-weight: 600; }
  :global(.pantalla .pantalla) { padding: 0; }
</style>
