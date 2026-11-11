<script>
  // Historial y mejores marcas de un WOD (misma clave), por escala.
  import { app } from '../lib/estado.svelte.js';
  import { ESCALAS, historialWod, mejoresWod, resumenWod, textoResultado, puntos, FORMATOS } from '../lib/wods.js';
  import { fmtFecha } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';

  let { clave, datos = null } = $props();
  const d = $derived(datos ?? app.datos);
  const hist = $derived(historialWod(clave, d.sesiones));
  const w = $derived(hist[0]?.wod);
  const mejores = $derived(mejoresWod(clave, d.sesiones));
  const escalas = $derived([...new Set(hist.map((s) => s.escala))]);
  let escala = $state(null);
  const esc = $derived(escala ?? escalas[0] ?? 'rx');
  const deEscala = $derived(hist.filter((s) => s.escala === esc));
  // evolución: mejor resultado = 100 %, el resto en proporción (para ver la tendencia de un vistazo)
  const barras = $derived.by(() => {
    const l = [...deEscala].reverse();
    if (!l.length) return [];
    const ps = l.map((s) => puntos(s.wod, s.resultado));
    const min = Math.min(...ps), max = Math.max(...ps);
    return l.map((s, k) => ({ s, f: max === min ? 1 : 0.25 + (0.75 * (ps[k] - min)) / (max - min) }));
  });
  function repetir() {
    const idx = app.datos.rutina?.sesiones.findIndex((s) => s.tipo === 'wod');
    app.vista = { nombre: 'wod', wodId: w.id?.startsWith('BM-') ? w.id : null, wodCopia: w, sesionIdx: idx >= 0 ? idx : null, acento: 'entrenar' };
  }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = datos ? { nombre: 'deportista', acento: 'yo' } : null)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">WOD · {FORMATOS[w?.formato]?.n}</span></div>
  {#if w}
    <h1>{w.nombre || 'WOD'}</h1>
    <p class="sec">{resumenWod(w)}</p>
    <div class="tarjeta">
      <span class="etiqueta">Mejores marcas</span>
      {#each Object.entries(mejores) as [e, m]}<div class="fila entre"><span>{ESCALAS[e]}</span><span><b>{textoResultado(m.s.wod, m.s.resultado)}</b> <span class="sec peq">· {fmtFecha(m.s.fecha)}</span></span></div>{/each}
    </div>
    {#if escalas.length > 1}<div class="fila envolver">{#each escalas as e}<button class="chip" class:on={esc === e} onclick={() => (escala = e)}>{ESCALAS[e]}</button>{/each}</div>{/if}
    {#if barras.length > 1}
      <div class="tarjeta">
        <span class="etiqueta">Evolución ({ESCALAS[esc]})</span>
        <div class="barras">{#each barras as b (b.s.id)}<div class="b"><span class="v">{textoResultado(b.s.wod, b.s.resultado)}</span><i style="height:{Math.round(b.f * 100)}%"></i><span class="f">{fmtFecha(b.s.fecha)}</span></div>{/each}</div>
        <p class="sec peq">Más alto = mejor resultado{w.formato === 'fortime' ? ' (menos tiempo)' : ''}.</p>
      </div>
    {/if}
    <div class="tarjeta">
      <span class="etiqueta">Todas las veces</span>
      {#each hist as s (s.id)}
        <div class="fila entre peq"><span>{fmtFecha(s.fecha)} · {ESCALAS[s.escala]}{s.notaEscala ? ` (${s.notaEscala})` : ''}</span><b>{textoResultado(s.wod, s.resultado)}</b></div>
        {#if s.nota}<p class="sec peq" style="margin-top:-6px">{s.nota}</p>{/if}
      {/each}
    </div>
    {#if !datos}<button class="boton ancho" onclick={repetir}>Repetir este WOD</button>{/if}
  {:else}
    <p class="vacio">Sin resultados de este WOD.</p>
  {/if}
</div>

<style>
  .barras { display: flex; gap: 6px; align-items: flex-end; height: 160px; overflow-x: auto; }
  .b { flex: 1 0 44px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 4px; }
  .b i { display: block; width: 70%; background: var(--progreso); border-radius: 6px 6px 2px 2px; min-height: 6px; }
  .v { font-size: 11px; color: var(--texto); white-space: nowrap; }
  .f { font-size: 10px; color: var(--texto2); }
</style>
