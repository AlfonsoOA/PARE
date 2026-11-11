<script>
  // Ficha de una receta: ingredientes ajustados a la comida elegida, pasos y botones para anotarla o ponerla en el menú.
  import { app, hoyISO, aviso } from '../lib/estado.svelte.js';
  import { anotar, pautaComida, alimento, aporte, sumar, diaSemana, DIAS_SEMANA, NOMBRE_RACION } from '../lib/dieta.js';
  import { ajustarReceta, enCasero, momentosDe, MOMENTO_DE_COMIDA, NOMBRE_MOMENTO, recetaApta } from '../lib/recetas.js';
  import { fmtNum } from '../lib/unidades.js';
  import Hoja from './Hoja.svelte';

  let { receta: r, cerrar, comidaInicial = null } = $props();
  const d = app.datos;
  const comidas = d.dieta?.comidas ?? [];
  const porDefecto = comidaInicial ?? comidas.find((c) => momentosDe(r).includes(MOMENTO_DE_COMIDA[c.id]))?.id ?? comidas.at(-1)?.id ?? null;
  let comida = $state(r.tipo === 'plato' ? porDefecto : porDefecto);
  let base = $state(false); // ver la receta base sin ajustar
  let dia = $state(diaSemana(hoyISO()));
  const c = $derived(comidas.find((x) => x.id === comida));
  const objetivo = $derived(r.tipo === 'plato' && c && !base ? pautaComida(c, hoyISO()) : null);
  const aj = $derived(ajustarReceta(r, objetivo));
  const total = $derived(r.tipo === 'plato' ? sumar(aj.items.map((it) => ({ tipo: 'alimento', aid: it.aid, g: it.g }))) : aporte({ tipo: 'receta', rid: r.id, porciones: 1 }));
  const apta = recetaApta(r, d.perfil);
  const entrada = () => (r.tipo === 'plato' ? { tipo: 'plato', rid: r.id, items: aj.items.map(({ aid, g }) => ({ aid, g })) } : { tipo: 'receta', rid: r.id, porciones: 1 });

  const gusto = $derived(d.gustosRecetas?.[r.id] ?? 0);
  function marcarGusto(v) {
    d.gustosRecetas ||= {};
    if (d.gustosRecetas[r.id] === v) delete d.gustosRecetas[r.id];
    else d.gustosRecetas[r.id] = v;
    aviso(d.gustosRecetas[r.id] === 1 ? 'Saldrá antes en tus recetas y en el menú' : d.gustosRecetas[r.id] === -1 ? 'No te la volverá a proponer' : 'Quitado');
  }
  function anotarHoy() {
    anotar(hoyISO(), { ...entrada(), comida });
    aviso(`Anotada en ${c?.nombre.toLowerCase() ?? 'tu comida'} de hoy`);
    cerrar();
  }
  function alMenu() {
    d.dieta.menu ||= {};
    d.dieta.menu[dia] ||= {};
    // el plato sustituye a lo que hubiera en esa comida; un dulce o un lote se añade
    if (r.tipo === 'plato') d.dieta.menu[dia][comida] = [entrada()];
    else (d.dieta.menu[dia][comida] ||= []).push(entrada());
    aviso(`En tu menú: ${DIAS_SEMANA[dia].toLowerCase()}, ${c?.nombre.toLowerCase()}`);
    cerrar();
  }
</script>

<Hoja titulo={r.n} {cerrar}>
  <p class="sec peq">
    {#if r.tiempo}{r.tiempo} min{/if}{#if r.coste} · ≈ {fmtNum(r.coste, 2)} € por ración{/if} · {momentosDe(r).map((m) => NOMBRE_MOMENTO[m] ?? m).join(', ')}
  </p>
  <div class="fila" style="gap:6px">
    <button class="chip" class:on={gusto === 1} onclick={() => marcarGusto(1)} aria-pressed={gusto === 1}>Me gusta</button>
    <button class="chip" class:on={gusto === -1} onclick={() => marcarGusto(-1)} aria-pressed={gusto === -1}>No me gusta</button>
  </div>
  {#if !apta}<div class="aviso-l peq"><p>Lleva algo que dijiste que no tomas o no te gusta: {(r.alerg || []).filter((x) => (d.perfil.alergenos || []).includes(x)).join(', ') || 'revisa los ingredientes'}.</p></div>{/if}

  {#if comidas.length}
    <div class="col" style="gap:6px">
      <span class="etiqueta">{r.tipo === 'plato' ? 'Cantidades para' : 'Para'}</span>
      <div class="fila envolver" style="gap:6px">
        {#each comidas as x}<button class="chip" class:on={comida === x.id && !base} onclick={() => { comida = x.id; base = false; }}>{x.nombre}</button>{/each}
        {#if r.tipo === 'plato'}<button class="chip" class:on={base} onclick={() => (base = true)}>Receta base</button>{/if}
      </div>
    </div>
  {/if}

  <div class="tarjeta" style="gap:6px">
    <span class="etiqueta">Ingredientes{r.tipo === 'lote' ? ` (para ${r.porciones} porciones)` : ''}</span>
    {#each aj.items as it}
      {@const a = alimento(it.aid)}
      <div class="fila entre peq" style="gap:10px"><span>{a?.n ?? it.aid}{#if it.nota}<span class="sec ml">· {it.nota}</span>{/if}</span><span class="cant"><b>{fmtNum(it.g)} g</b>{#if enCasero(it)}<span class="sec ml">{enCasero(it)}</span>{/if}</span></div>
    {/each}
    <p class="sec peq">{fmtNum(total.kcal)} kcal · {fmtNum(total.p)} g proteína · {fmtNum(total.hc)} g hidratos · {fmtNum(total.g)} g grasa{r.tipo === 'lote' ? ' por porción' : ''}</p>
    {#if r.tipo === 'plato' && objetivo}
      <p class="sec peq">Ajustada a tu {c.nombre.toLowerCase()}: {['P', 'HC', 'G'].filter((g) => objetivo[g] > 0).map((g) => `${fmtNum(objetivo[g], 1)} ${NOMBRE_RACION[g].toLowerCase()}`).join(' · ')}. Verdura y especias, igual.</p>
      {#each Object.entries(aj.faltan) as [g, n]}
        <p class="peq aviso-t">Tu {c.nombre.toLowerCase()} lleva además {fmtNum(n, 1)} {n === 1 ? 'ración' : 'raciones'} de {NOMBRE_RACION[g].toLowerCase()} que este plato no tiene: {g === 'HC' ? 'pan, arroz, patata o fruta' : 'huevo, atún, pollo o un lácteo proteico'} aparte.</p>
      {/each}
    {:else if r.tipo === 'lote'}
      <p class="sec peq">{r.cuenta}</p>
    {/if}
  </div>

  {#if r.pasos?.length}
    <div class="col" style="gap:6px">
      <span class="etiqueta">Cómo se hace</span>
      <ol class="pasos">{#each r.pasos as p}<li>{p}</li>{/each}</ol>
    </div>
  {/if}
  {#if r.notas}<p class="sec peq">{r.notas}</p>{/if}
  {#if r.alerg?.length}<p class="peq">Alérgenos: {r.alerg.join(', ')}</p>{/if}

  {#if comida}
    <button class="boton ancho" onclick={anotarHoy}>Anotar hoy en {c?.nombre.toLowerCase()}</button>
    <div class="col" style="gap:6px">
      <div class="fila envolver" style="gap:4px">{#each DIAS_SEMANA as nombre, i}<button class="chip mini" class:on={dia === i} onclick={() => (dia = i)}>{nombre.slice(0, 3)}</button>{/each}</div>
      <button class="boton sec2 ancho" onclick={alMenu}>Poner en mi menú: {DIAS_SEMANA[dia].toLowerCase()}, {c?.nombre.toLowerCase()}</button>
    </div>
  {/if}
</Hoja>

<style>
  .cant { white-space: nowrap; text-align: right; }
  .ml { margin-left: 5px; }
  .pasos { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 6px; line-height: 1.45; font-size: 15px; }
  .aviso-t { color: var(--aviso); }
  .chip.mini { min-height: 34px; padding: 0 10px; font-size: 13px; }
</style>
