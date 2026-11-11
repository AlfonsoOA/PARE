<script>
  import { app } from '../lib/estado.svelte.js';
  import { ej } from '../lib/catalogo.js';
  import { duracionSesion, etiquetasBloque, restriccion, bloques } from '../lib/entreno.js';
  import { sesionPropuesta, iniciarSesion } from '../lib/sesiones.js';
  import { fmt, fmtMin, fmtReloj } from '../lib/unidades.js';
  import { archivoRutina, compartir } from '../lib/archivo.js';
  import { aviso } from '../lib/estado.svelte.js';
  async function compartirRutina() {
    const r = await compartir(archivoRutina(app.datos.rutina), app.datos.perfil.nombre);
    if (r !== 'cancelado') aviso(r === 'compartido' ? 'Rutina enviada' : 'Archivo descargado: mándalo por WhatsApp');
  }

  let d = $derived(app.datos);
  const prop = $derived(sesionPropuesta(d));
  let abierta = $state(null);
  $effect(() => { if (abierta == null && prop) abierta = prop.idx; });
</script>

<div class="pantalla">
  <div class="cabecera"><h1>Entrenar</h1>
    {#if d.rutina}<button class="enlace" onclick={() => (app.vista = { nombre: 'editor', acento: 'entrenar' })}>Editar rutina</button>{/if}
  </div>

  {#if app.sesionActiva}
    <button class="boton ancho" onclick={() => (app.vista = { nombre: 'sesion', acento: 'entrenar' })}>Continuar la sesión en curso</button>
  {/if}

  {#if !d.rutina}
    <div class="tarjeta">
      <p>Aún no tienes rutina.</p>
      <button class="boton ancho" onclick={() => (app.vista = { nombre: 'test' })}>Hacer el test de inicio</button>
      <button class="boton sec2 ancho" onclick={() => (app.vista = { nombre: 'editor', acento: 'entrenar' })}>Crear mi rutina</button>
      <button class="boton sec2 ancho" onclick={() => iniciarSesion(null, [], 'Sesión libre')}>Sesión libre</button>
    </div>
  {:else}
    <p class="sec peq">{d.rutina.nombre} · se hace en orden; si te saltas una, queda pendiente.</p>
    {#each d.rutina.sesiones as s, i (s.id)}
      {@const et = etiquetasBloque(s.items)}
      <div class="tarjeta" class:toca={prop?.idx === i}>
        <button class="cab" onclick={() => (abierta = abierta === i ? null : i)} aria-expanded={abierta === i}>
          <div class="col" style="gap:2px;align-items:flex-start">
            <h2>{s.nombre}</h2>
            <span class="sec peq">{s.items.length} ejercicios · {fmtMin(duracionSesion(s.items, d.ajustes))}</span>
          </div>
          {#if prop?.idx === i}<span class="insignia" style="color:var(--entrenar)">Toca</span>
          {:else if d.secuencia.pendientes?.includes(i)}<span class="insignia aviso">Pendiente</span>{/if}
        </button>
        {#if abierta === i}
          {#each bloques(s.items) as b (b[0].it.uid)}
          <div class:bloque-ss={b.length > 1} style:--ss={b.length > 1 ? `var(--ss-${(et[b[0].i].charCodeAt(0) - 65) % 2 + 1})` : null}>
          {#if b.length > 1}<div class="ss-cab"><b>Superserie {et[b[0].i][0]}</b> · sin descanso entre ejercicios · {fmtReloj(Math.max(...b.map((y) => y.it.descanso || 90)))} al acabar la vuelta</div>{/if}
          {#each b as y (y.it.uid)}
            {@const it = y.it}
            {@const k = y.i}
            {@const e = ej(it.ej)}
            {@const r = restriccion(it.ej, d.perfil.molestias)}
            <button class="ej" onclick={() => (app.vista = { nombre: 'ficha', id: it.ej, acento: 'entrenar' })}>
              {#if et[k]}<span class="ss">{et[k]}</span>{/if}
              <span class="col" style="gap:1px;min-width:0;align-items:flex-start">
                <span class="nom">{e?.n ?? it.ej}</span>
                <span class="sec peq">{it.series} × {it.repMin === it.repMax ? it.repMin : `${it.repMin}-${it.repMax}`}{e?.ud === 'tiempo' ? ' s' : ''} · {it.carga != null ? fmt(it.carga) : 'carga el primer día'} · descanso {fmtReloj(it.descanso)}</span>
                {#if it.nota}<span class="sec peq nota">{it.nota}</span>{/if}
              </span>
              {#if r?.nivel === 'precaucion'}<span class="insignia aviso">!</span>{/if}
            </button>
          {/each}
          </div>
          {/each}
          <button class="boton ancho" onclick={() => iniciarSesion(i)}>Empezar {s.nombre}</button>
        {/if}
      </div>
    {/each}
    <button class="boton sec2 ancho" onclick={() => iniciarSesion(null, [], 'Sesión libre')}>Sesión libre</button>
    <button class="boton sec2 ancho" onclick={compartirRutina}>Compartir mi rutina con quien entreno</button>
    <p class="sec peq">Se envía sin cargas: cada uno pone las suyas. La otra persona la abre en Yo → Archivo PARE → Abrir un archivo.</p>
  {/if}
</div>

<style>
  .toca { border-color: color-mix(in srgb, var(--entrenar) 55%, var(--borde)); }
  .cab { display: flex; justify-content: space-between; align-items: center; background: none; border: 0; padding: 0; text-align: left; cursor: pointer; min-height: 48px; }
  .ej { display: flex; align-items: center; gap: 10px; background: none; border: 0; border-top: 1px solid var(--borde); padding: 10px 0; text-align: left; cursor: pointer; }
  .nom { font-weight: 600; }
  .nota { color: var(--progreso); }
  .bloque-ss { margin: 6px 0; padding: 4px 10px; border-radius: 12px; background: color-mix(in srgb, var(--ss) 10%, var(--superficie)); border: 1px solid color-mix(in srgb, var(--ss) 45%, var(--borde)); }
  .bloque-ss .ej { width: 100%; }
  .bloque-ss .ej:first-of-type { border-top: 0; }
  .ss-cab { font-size: 13px; color: var(--texto2); padding: 6px 0 2px; }
  .ss-cab b { font-family: var(--titulos); font-size: 15px; color: var(--ss); text-transform: uppercase; letter-spacing: 0.03em; }
  .ss { font-family: var(--titulos); font-weight: 800; color: var(--entrenar); width: 28px; flex-shrink: 0; }
  .bloque-ss .ss { color: var(--ss); }
</style>
