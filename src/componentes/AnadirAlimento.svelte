<script>
  // Hoja para anotar un alimento o una receta (por pesada o por medida casera), o crear un producto de etiqueta.
  import { app, uuid, aviso } from '../lib/estado.svelte.js';
  import { cat, normalizar, palabras, coincide } from '../lib/catalogo.js';
  import { alimento, receta, aporte, NOMBRE_RACION } from '../lib/dieta.js';
  import { todasRecetas } from '../lib/recetas.js';
  import { fmtNum } from '../lib/unidades.js';
  import Hoja from './Hoja.svelte';
  let { cerrar, anotar, titulo = 'Añadir alimento', soloAlimentos = false } = $props();
  let q = $state('');
  let sel = $state(null); // { tipo: 'alimento'|'receta', id }
  let gramos = $state(100);
  let porciones = $state(1);
  let nuevo = $state(null);

  const alerg = app.datos.perfil.alergenos || [];
  const recientes = $derived.by(() => {
    const vistos = new Map();
    for (const f of Object.keys(app.datos.comidas).sort().reverse()) {
      for (const e of app.datos.comidas[f]) {
        if (e.tipo === 'alimento' && !vistos.has('a' + e.aid)) vistos.set('a' + e.aid, { tipo: 'alimento', id: e.aid });
        if (e.tipo === 'receta' && !vistos.has('r' + e.rid)) vistos.set('r' + e.rid, { tipo: 'receta', id: e.rid });
      }
      if (vistos.size > 12) break;
    }
    return [...vistos.values()];
  });
  const resultados = $derived.by(() => {
    const n = normalizar(q.trim());
    if (!n) return soloAlimentos ? recientes.filter((x) => x.tipo === 'alimento') : recientes;
    const ws = palabras(q);
    const al = [...app.datos.productosPropios, ...cat.alimentos].filter((a) => coincide(ws, a.n)).slice(0, 40).map((a) => ({ tipo: 'alimento', id: a.id }));
    const re = soloAlimentos ? [] : todasRecetas().filter((r) => coincide(ws, r.n)).map((r) => ({ tipo: 'receta', id: r.id }));
    return [...re, ...al];
  });
  const nombre = (x) => (x.tipo === 'receta' ? receta(x.id)?.n : alimento(x.id)?.n);
  const conAlergeno = (x) => (x.tipo === 'receta' ? receta(x.id)?.alerg : alimento(x.id)?.alerg)?.some((a) => alerg.includes(a));
  function elegir(x) {
    sel = x;
    if (x.tipo === 'alimento') { const a = alimento(x.id); gramos = a.gm || a.rac || 100; }
    else porciones = 1;
  }
  // un plato del recetario se guarda con sus ingredientes (receta base × porciones); un lote, por porciones
  const entrada = $derived(sel ? (sel.tipo === 'alimento' ? { tipo: 'alimento', aid: sel.id, g: +gramos }
    : receta(sel.id)?.tipo === 'plato' ? { tipo: 'plato', rid: sel.id, items: receta(sel.id).ingredientes.map((i) => ({ aid: i.id, g: Math.round(i.g * (+porciones || 1)) })) }
    : { tipo: 'receta', rid: sel.id, porciones: +porciones }) : null);
  const ap = $derived(entrada ? aporte(entrada) : null);
  function guardarNuevo() {
    const a = { id: 'US-' + uuid(), n: nuevo.n.trim(), grupo: nuevo.cc === 'P' ? 'producto_proteico' : 'otro', cc: nuevo.cc,
      kcal: +nuevo.kcal || 0, p: +nuevo.p || 0, hc: +nuevo.hc || 0, g: +nuevo.g || 0, fib: 0, gm: +nuevo.gm || null,
      medida: nuevo.gm ? '1 envase' : null, alerg: [], etq: [], notas: nuevo.marca };
    const base = { P: a.p, HC: a.hc, G: a.g, fruta: a.hc };
    const gr = { P: 25, HC: 40, G: 10, fruta: 15 }[a.cc];
    a.rac = gr && base[a.cc] ? Math.round((gr / base[a.cc]) * 100) : null;
    if (!a.n) return;
    app.datos.productosPropios.push(a);
    aviso('Producto guardado');
    nuevo = null;
    elegir({ tipo: 'alimento', id: a.id });
  }
</script>

<Hoja {titulo} {cerrar}>
  {#if nuevo}
    <label class="campo">Nombre<input type="text" bind:value={nuevo.n} /></label>
    <label class="campo">Marca (opcional)<input type="text" bind:value={nuevo.marca} /></label>
    <p class="sec peq">Copia la etiqueta, por 100 g:</p>
    <div class="rej">
      <label class="campo">kcal<input type="number" inputmode="decimal" bind:value={nuevo.kcal} /></label>
      <label class="campo">Proteína<input type="number" inputmode="decimal" bind:value={nuevo.p} /></label>
      <label class="campo">Hidratos<input type="number" inputmode="decimal" bind:value={nuevo.hc} /></label>
      <label class="campo">Grasa<input type="number" inputmode="decimal" bind:value={nuevo.g} /></label>
      <label class="campo">g por envase<input type="number" inputmode="decimal" bind:value={nuevo.gm} /></label>
    </div>
    <div class="col"><span class="sec peq">Cuenta como</span>
      <div class="fila envolver">{#each [['P', 'Proteína'], ['HC', 'Hidratos'], ['G', 'Grasa'], ['fruta', 'Fruta'], ['libre', 'No cuenta']] as [v, l]}<button class="chip" class:on={nuevo.cc === v} onclick={() => (nuevo.cc = v)}>{l}</button>{/each}</div>
    </div>
    <button class="boton ancho" onclick={guardarNuevo}>Guardar producto</button>
    <button class="boton sec2 ancho" onclick={() => (nuevo = null)}>Cancelar</button>
  {:else if sel}
    <h3>{nombre(sel)}</h3>
    {#if conAlergeno(sel)}<p class="insignia mal">Contiene un alérgeno que marcaste</p>{/if}
    {#if sel.tipo === 'alimento'}
      {@const a = alimento(sel.id)}
      <label class="campo">Gramos<input type="number" inputmode="decimal" bind:value={gramos} /></label>
      <div class="fila envolver">
        {#if a.gm}<button class="chip" onclick={() => (gramos = a.gm)}>{a.medida} ({a.gm} g)</button>{/if}
        {#if a.rac}<button class="chip" onclick={() => (gramos = a.rac)}>1 ración ({a.rac} g)</button>{/if}
        <button class="chip" onclick={() => (gramos = 100)}>100 g</button>
      </div>
      {#if a.notas}<p class="sec peq">{a.notas}</p>{/if}
    {:else}
      {@const r = receta(sel.id)}
      <label class="campo">Porciones<input type="number" inputmode="decimal" step="0.5" bind:value={porciones} /></label>
      <p class="sec peq">{r.cuenta}</p>
    {/if}
    {#if ap}
      <p class="peq">{fmtNum(ap.kcal)} kcal · {fmtNum(ap.p, 1)} g prot · {fmtNum(ap.hc, 1)} g hidr · {fmtNum(ap.g, 1)} g grasa</p>
      <p class="sec peq">Equivale a {['P', 'HC', 'G', 'fruta', 'lacteo'].filter((k) => ap[k] >= 0.05).map((k) => `${fmtNum(ap[k], 1)} ${NOMBRE_RACION[k].toLowerCase()}`).join(' + ') || 'nada en raciones (libre)'}.</p>
    {/if}
    <button class="boton ancho" onclick={() => { anotar(entrada); cerrar(); }}>Añadir</button>
    <button class="boton sec2 ancho" onclick={() => (sel = null)}>Elegir otro</button>
  {:else}
    <input type="search" placeholder="Buscar alimento o receta" bind:value={q} aria-label="Buscar alimento" />
    {#if !q && recientes.length}<span class="etiqueta">Recientes</span>{/if}
    <div class="lista">
      {#each resultados as x (x.tipo + x.id)}
        <button class="item" onclick={() => elegir(x)}>
          <span class="col" style="gap:0;align-items:flex-start;min-width:0"><b>{nombre(x)}</b>
            <span class="sec peq">{x.tipo === 'receta' ? `Receta · ${receta(x.id)?.kcal} kcal/porción` : `${alimento(x.id)?.kcal} kcal/100 g${alimento(x.id)?.rac ? ` · ración ${alimento(x.id).rac} g` : ''}`}</span></span>
          {#if conAlergeno(x)}<span class="insignia mal">!</span>{/if}
        </button>
      {:else}
        {#if q}<p class="vacio">Nada con ese nombre.</p>{/if}
      {/each}
    </div>
    <button class="boton sec2 ancho" onclick={() => (nuevo = { n: q, marca: '', kcal: '', p: '', hc: '', g: '', gm: '', cc: 'P' })}>Añadir producto de etiqueta</button>
  {/if}
</Hoja>

<style>
  .lista { display: flex; flex-direction: column; gap: 6px; }
  .item { display: flex; justify-content: space-between; align-items: center; gap: 10px; text-align: left; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 10px 12px; min-height: 56px; cursor: pointer; }
  .rej { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
</style>
