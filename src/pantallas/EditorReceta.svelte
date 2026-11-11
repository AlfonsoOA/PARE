<script>
  // Crear o editar una receta propia: ingredientes del catálogo (o productos propios), pasos, tiempo y momentos.
  import { app, uuid, aviso } from '../lib/estado.svelte.js';
  import { alimento } from '../lib/dieta.js';
  import { calcularReceta, NOMBRE_MOMENTO } from '../lib/recetas.js';
  import { fmtNum } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  import AnadirAlimento from '../componentes/AnadirAlimento.svelte';

  let { id = null } = $props();
  const d = app.datos;
  d.recetasPropias ||= [];
  const original = id ? d.recetasPropias.find((r) => r.id === id) : null;
  let r = $state(original ? JSON.parse(JSON.stringify(original)) : { id: 'MR-' + uuid(), propia: true, n: '', tipo: 'plato', porciones: 1, momentos: ['comida'], tiempo: 20, coste: null, ingredientes: [], pasos: [], notas: '' });
  let pasosTxt = $state((r.pasos || []).join('\n'));
  let buscar = $state(false);
  const inicial = JSON.stringify(r);
  let avisado = 0;

  const vista = $derived(calcularReceta(JSON.parse(JSON.stringify({ ...r, ingredientes: r.ingredientes }))));
  const valida = $derived(r.n.trim() && r.ingredientes.length && r.momentos.length);
  const toggle = (m) => { const i = r.momentos.indexOf(m); if (i >= 0) r.momentos.splice(i, 1); else r.momentos.push(m); };

  function guardarReceta() {
    if (!valida) { aviso('Falta el nombre, algún ingrediente o cuándo se come.'); return; }
    r.pasos = pasosTxt.split('\n').map((x) => x.trim()).filter(Boolean);
    r.momento = r.momentos.join(';');
    r.n = r.n.trim();
    calcularReceta(r);
    const i = d.recetasPropias.findIndex((x) => x.id === r.id);
    const copia = JSON.parse(JSON.stringify(r));
    if (i >= 0) d.recetasPropias[i] = copia; else d.recetasPropias.unshift(copia);
    aviso('Receta guardada');
    app.subComer = 'recetas'; app.filtroRecetas = 'mias';
    app.vista = null;
  }
  function salir() {
    if (JSON.stringify(r) !== inicial && Date.now() - avisado > 2500) { avisado = Date.now(); aviso('Tienes cambios sin guardar. Pulsa otra vez para salir.'); return; }
    app.vista = null;
  }
</script>

<div class="pantalla">
  <div class="fila entre">
    <button class="icono-b" data-atras onclick={salir} aria-label="Salir sin guardar"><Icono n="atras" /></button>
    <span class="etiqueta">{original ? 'Editar receta' : 'Nueva receta'}</span>
    <button class="boton" style="min-height:44px" onclick={guardarReceta} disabled={!valida}>Guardar</button>
  </div>

  <label class="campo">Nombre<input type="text" bind:value={r.n} placeholder="Pollo al curry con arroz" /></label>

  <div class="tarjeta">
    <span class="etiqueta">Tipo</span>
    <div class="fila envolver">
      <button class="chip" class:on={r.tipo === 'plato'} onclick={() => { r.tipo = 'plato'; r.porciones = 1; }}>Plato para 1</button>
      <button class="chip" class:on={r.tipo === 'lote'} onclick={() => { r.tipo = 'lote'; if (r.porciones < 2) r.porciones = 6; }}>Se hace entera y se reparte</button>
    </div>
    <p class="sec peq">{r.tipo === 'plato' ? 'Pon las cantidades para una persona: PARE las ajusta a las raciones de cada comida.' : 'Una tarta, un pan, un guiso para varios días: pon la receta entera y en cuántas porciones sale.'}</p>
    {#if r.tipo === 'lote'}<label class="campo">Porciones<input type="number" inputmode="numeric" min="2" bind:value={r.porciones} /></label>{/if}
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Cuándo se come</span>
    <div class="fila envolver">{#each ['desayuno', 'comida', 'cena', 'merienda', 'postre'] as m}<button class="chip" class:on={r.momentos.includes(m)} onclick={() => toggle(m)}>{NOMBRE_MOMENTO[m]}</button>{/each}</div>
    <label class="campo">Tiempo (minutos)<input type="number" inputmode="numeric" bind:value={r.tiempo} /></label>
  </div>

  <div class="tarjeta">
    <span class="etiqueta">Ingredientes</span>
    {#each r.ingredientes as it, k}
      <div class="fila entre" style="gap:8px">
        <span class="peq" style="flex:1;min-width:0">{alimento(it.id)?.n ?? it.id}</span>
        <input type="number" inputmode="decimal" bind:value={it.g} aria-label="Gramos de {alimento(it.id)?.n}" style="max-width:80px;text-align:center" /><span class="sec peq">g</span>
        <button class="icono-b" style="width:36px;height:36px" onclick={() => r.ingredientes.splice(k, 1)} aria-label="Quitar"><Icono n="cerrar" tam={18} /></button>
      </div>
    {/each}
    <button class="enlace" style="align-self:flex-start" onclick={() => (buscar = true)}>+ Añadir ingrediente</button>
    {#if r.ingredientes.length}
      <p class="sec peq">{r.tipo === 'lote' ? 'Por porción' : 'Total'}: {fmtNum(vista.kcal)} kcal · {fmtNum(vista.p)} g proteína · {fmtNum(vista.hc)} g hidratos · {fmtNum(vista.g)} g grasa</p>
    {/if}
    <p class="sec peq">¿No está un ingrediente? Búscalo y pulsa «Añadir producto de etiqueta» con los datos del envase.</p>
  </div>

  <label class="campo">Cómo se hace (un paso por línea)<textarea rows="6" bind:value={pasosTxt} placeholder={'Cuece el arroz.\nDora el pollo con el curry.\n…'}></textarea></label>
  <label class="campo">Nota (opcional)<input type="text" bind:value={r.notas} /></label>
</div>

{#if buscar}
  <AnadirAlimento titulo="Añadir ingrediente" soloAlimentos cerrar={() => (buscar = false)} anotar={(e) => { if (e?.tipo === 'alimento') r.ingredientes.push({ id: e.aid, g: Math.round(e.g) }); }} />
{/if}

<style>
  textarea { width: 100%; background: var(--elevada); color: var(--texto); border: 1px solid var(--borde); border-radius: 12px; padding: 10px 12px; font: inherit; resize: vertical; }
</style>
