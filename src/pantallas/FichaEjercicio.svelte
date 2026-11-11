<script>
  import { app } from '../lib/estado.svelte.js';
  import { ej, cat, etiqueta, NOMBRE_GRUPO } from '../lib/catalogo.js';
  import { restriccion } from '../lib/entreno.js';
  import Animacion from '../componentes/Animacion.svelte';
  import Icono from '../componentes/Icono.svelte';
  let { id, volver = null } = $props();
  const e = ej(id);
  const r = restriccion(id, app.datos.perfil.molestias);
  const musc = (l) => (l || []).map((m) => cat.etiquetas.musculo?.[m] ?? m).join(', ');
  const atras = () => (app.vista = volver ?? null);
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={atras} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Ficha técnica</span></div>
  {#if !e}<p class="vacio">Ejercicio no encontrado.</p>{:else}
    <h1>{e.n}</h1>
    <p class="sec peq">{e.en}</p>
    {#if e.img}<Animacion {id} />{:else}<div class="tarjeta"><p class="sec">Imagen pendiente: este ejercicio se grabará.</p></div>{/if}
    {#if r}
      <div class="aviso-l"><Icono n="aviso" tam={20} /><p><b>{r.nivel === 'evitar' ? 'Evitar' : r.nivel === 'precaucion' ? 'Precaución' : 'Recomendado'} por tu {r.zona}.</b> {r.motivo}</p></div>
    {/if}
    <div class="tarjeta">
      <div class="fila envolver" style="gap:6px">
        <span class="insignia">{etiqueta('patron_movimiento', e.pat)}</span>
        <span class="insignia">{etiqueta('equipamiento', e.eq)}</span>
        <span class="insignia">{etiqueta('nivel', e.niv)}</span>
        {#if e.mec}<span class="insignia">{etiqueta('mecanica', e.mec)}</span>{/if}
      </div>
      <p class="peq"><b>Principales:</b> {musc(e.mp)} <span class="sec">({(e.gp || []).map((g) => NOMBRE_GRUPO[g]).join(', ')})</span></p>
      {#if e.ms?.length}<p class="peq"><b>Secundarios:</b> {musc(e.ms)}</p>{/if}
    </div>
    {#each [['Ejecución', e.ficha.ejecucion], ['Recomendaciones', e.ficha.recomendaciones], ['Errores habituales', e.ficha.errores], ['Precauciones', e.ficha.precauciones]] as [t, txt]}
      {#if txt}<div class="col"><h3>{t}</h3><p class="texto">{txt}</p></div>{/if}
    {/each}
  {/if}
</div>

<style>
  .texto { color: #D5D8DE; line-height: 1.55; }
</style>
