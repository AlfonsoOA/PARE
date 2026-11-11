<script>
  import { app, hoyISO } from '../lib/estado.svelte.js';
  import { cat } from '../lib/catalogo.js';
  import { delDia, sumar, anotar, quitar, objetivoDelDia, pautaComida, tipoDeDia, aporte, alimento, receta, GRUPOS_RACION, NOMBRE_RACION, DEF_RACION, redondear, diaSemana, DIAS_SEMANA } from '../lib/dieta.js';
  import { fmtNum, fmtFecha } from '../lib/unidades.js';
  import Icono from '../componentes/Icono.svelte';
  import Hoja from '../componentes/Hoja.svelte';
  import AnadirAlimento from '../componentes/AnadirAlimento.svelte';
  import FichaReceta from '../componentes/FichaReceta.svelte';
  import { momentosDe, NOMBRE_MOMENTO, recetaApta } from '../lib/recetas.js';
  import { proponerMenu } from '../lib/menu.js';
  import { aviso } from '../lib/estado.svelte.js';
  let confirmarMenu = $state(false);
  function generarMenu() { d.dieta.menu = proponerMenu(d.dieta, d.perfil); confirmarMenu = false; aviso('Menú propuesto. Cámbialo a tu gusto.'); }
  const hayMenu = $derived(Object.values(d.dieta?.menu ?? {}).some((dia) => Object.values(dia ?? {}).some((l) => l?.length)));

  let d = $derived(app.datos);
  let sub = $state('dia');
  let fecha = $state(hoyISO());
  let anadirEn = $state(null); // { comida } o { menu: [dia, comida] }
  let recetaAbierta = $state(null); // { r, comida }
  let filtroRecetas = $state('todas');
  const recetasFiltradas = $derived(cat.recetas.filter((r) => filtroRecetas === 'todas' || (filtroRecetas === 'postre' ? r.tipo === 'lote' : r.tipo === 'plato' && momentosDe(r).includes(filtroRecetas))).sort((a, b) => (a.tipo === b.tipo ? (a.tiempo ?? 99) - (b.tiempo ?? 99) : a.tipo === 'plato' ? -1 : 1)));
  let diaMenu = $state(diaSemana(hoyISO()));

  const reg = $derived(delDia(fecha));
  const tot = $derived(sumar(reg));
  const obj = $derived(objetivoDelDia(fecha));
  const kcalObj = $derived(d.dieta ? d.dieta.kcal + ((obj?.HC ?? 0) - d.dieta.raciones.HC) * 160 : 0);
  const cambiarDia = (n) => { const x = new Date(fecha + 'T12:00:00'); x.setDate(x.getDate() + n); fecha = x.toISOString().slice(0, 10); };
  const deComida = (c) => reg.filter((e) => e.comida === c);
  const racionesHechas = (c, g) => deComida(c).filter((e) => e.tipo === 'racion' && e.grupo === g).reduce((s, e) => s + e.n, 0);
  function ficha(c, g, k) {
    // Tocar una ficha: si ya está marcada (k < hechas), se quita una; si no, se marca.
    const hechas = racionesHechas(c, g);
    if (k < hechas) {
      const e = [...deComida(c)].reverse().find((x) => x.tipo === 'racion' && x.grupo === g);
      if (e) quitar(fecha, e.id);
    } else anotar(fecha, { comida: c, tipo: 'racion', grupo: g, n: 1 });
  }
  const etiquetaEntrada = (e) => e.tipo === 'alimento' ? `${alimento(e.aid)?.n ?? '¿?'} · ${fmtNum(e.g)} g` : e.tipo === 'receta' ? `${receta(e.rid)?.n} · ${fmtNum(e.porciones, 1)} porción` : e.tipo === 'plato' ? `${receta(e.rid)?.n ?? 'Plato'}` : null;
  const menuDe = (dia, c) => d.dieta?.menu?.[dia]?.[c] ?? [];
  function anotarMenu(c) { for (const e of menuDe(diaSemana(fecha), c)) anotar(fecha, { ...e, comida: c, id: undefined }); }
  function agregarAlMenu(dia, c, entrada) {
    d.dieta.menu ||= {};
    d.dieta.menu[dia] ||= {};
    (d.dieta.menu[dia][c] ||= []).push(entrada);
  }
  const sumaMenu = (dia, c) => sumar(menuDe(dia, c));
</script>

<div class="pantalla">
  <div class="cabecera"><h1>Comer</h1>{#if d.dieta}<button class="enlace" onclick={() => (app.vista = { nombre: 'midieta', acento: 'comer' })}>Mi dieta</button>{/if}</div>

  {#if !d.dieta}
    <div class="tarjeta"><p>Aún no tienes pauta. Haz el test de inicio y PARE te la calcula.</p>
      <button class="boton ancho" onclick={() => (app.vista = { nombre: 'test' })}>Hacer el test</button></div>
  {:else}
  <div class="pestanas" role="tablist">
    {#each [['dia', 'El día'], ['menu', 'Mi menú'], ['recetas', 'Recetas'], ['equiv', 'Equivalencias']] as [v, l]}
      <button role="tab" aria-selected={sub === v} class:on={sub === v} onclick={() => (sub = v)}>{l}</button>
    {/each}
  </div>

  {#if sub === 'dia'}
    <div class="fila entre">
      <button class="icono-b" onclick={() => cambiarDia(-1)} aria-label="Día anterior"><Icono n="atras" /></button>
      <b>{fecha === hoyISO() ? 'Hoy' : fmtFecha(fecha, true)}</b>
      <button class="icono-b" onclick={() => cambiarDia(1)} aria-label="Día siguiente" disabled={fecha >= hoyISO()} style="transform:scaleX(-1)"><Icono n="atras" /></button>
    </div>
    {#if !hayMenu}
      <div class="tarjeta"><p>¿Quieres que PARE te proponga qué comer en cada comida, con tus raciones?</p>
        <button class="boton ancho" onclick={generarMenu}>Proponer menú de la semana</button>
        <p class="sec peq">Es una propuesta general: luego lo cambias en Mi menú.</p></div>
    {/if}
    <div class="tarjeta">
      <div class="fila entre"><span class="etiqueta">Total del día</span>{#if d.dieta.hidratosExtra && tipoDeDia(fecha) === true}<span class="insignia bien">Día de más hidratos</span>{/if}</div>
      <div class="fila entre envolver">
        <div><p class="cifra">{fmtNum(tot.kcal)}</p><p class="sec peq">de {fmtNum(kcalObj)} kcal</p></div>
        <div><p class="cifra">{fmtNum(tot.p)}</p><p class="sec peq">de {d.dieta.p} g prot.</p></div>
        <div><p class="cifra">{fmtNum(tot.hc)}</p><p class="sec peq">g hidratos</p></div>
        <div><p class="cifra">{fmtNum(tot.g)}</p><p class="sec peq">g grasa</p></div>
      </div>
      <div class="fila envolver" style="gap:12px">
        {#each GRUPOS_RACION.filter((g) => (obj?.[g] ?? 0) > 0) as g}
          <span class="peq"><b>{NOMBRE_RACION[g]}</b> {fmtNum(redondear(tot[g]), 1)}/{fmtNum(obj[g], 1)}</span>
        {/each}
      </div>
    </div>

    {#each d.dieta.comidas as c (c.id)}
      {@const pauta = pautaComida(c, fecha)}
      {@const menu = menuDe(diaSemana(fecha), c.id)}
      <div class="tarjeta">
        <div class="fila entre"><h2>{c.nombre}</h2><span class="sec peq">{c.hora}</span></div>
        {#if menu.length}
          <div class="menu"><span class="sec peq">Tu menú: {menu.map(etiquetaEntrada).join(' · ')}</span>
            <button class="enlace" style="align-self:flex-start;padding:2px 0" onclick={() => anotarMenu(c.id)}>Tomado tal cual</button></div>
        {/if}
        {#each GRUPOS_RACION.filter((g) => pauta[g] > 0) as g}
          {@const hechas = racionesHechas(c.id, g)}
          <div class="fila">
            <span class="grupo">{NOMBRE_RACION[g]}</span>
            <div class="fila envolver" style="gap:6px">
              {#each Array(Math.max(Math.ceil(pauta[g]), hechas)) as _, k}
                <button class="fichita" class:on={k < hechas} onclick={() => ficha(c.id, g, k)} aria-label="{NOMBRE_RACION[g]}, ración {k + 1} {k < hechas ? 'tomada' : 'sin tomar'}" aria-pressed={k < hechas}></button>
              {/each}
            </div>
          </div>
        {/each}
        {#if c.verdura}<p class="sec peq">+ verdura libre</p>{/if}
        {#each deComida(c.id).filter((e) => e.tipo !== 'racion') as e (e.id)}
          <div class="fila entre peq">{#if e.tipo === 'plato' && receta(e.rid)}<button class="enlace-l" onclick={() => (recetaAbierta = { r: receta(e.rid), comida: c.id })}>{etiquetaEntrada(e)} <span class="sec">({fmtNum(aporte(e).kcal)} kcal) · ver receta</span></button>{:else}<span>{etiquetaEntrada(e)} <span class="sec">({fmtNum(aporte(e).kcal)} kcal)</span></span>{/if}<button class="icono-b" style="width:36px;height:36px" onclick={() => quitar(fecha, e.id)} aria-label="Quitar"><Icono n="cerrar" tam={18} /></button></div>
        {/each}
        <button class="enlace" style="align-self:flex-start" onclick={() => (anadirEn = { comida: c.id })}>+ Añadir alimento o receta</button>
      </div>
    {/each}
    <p class="sec peq">Toca una ficha para marcar una ración tomada; pesa solo si quieres. La dieta va por fecha: si un día se tuerce, al siguiente toca la del siguiente.</p>

  {:else if sub === 'menu'}
    <p class="sec peq">Concreta qué comes en cada comida de cada día, a partir de tus raciones. Es opcional: quien no quiera, va por raciones.</p>
    {#if confirmarMenu}
      <div class="tarjeta"><p>Se sustituye el menú de toda la semana.</p><div class="fila"><button class="boton" style="flex:1" onclick={generarMenu}>Sí, proponer</button><button class="boton sec2" style="flex:1" onclick={() => (confirmarMenu = false)}>Cancelar</button></div></div>
    {:else}
      <button class="boton sec2 ancho" onclick={() => (hayMenu ? (confirmarMenu = true) : generarMenu())}>{hayMenu ? 'Volver a proponer el menú automático' : 'Proponer menú automático'}</button>
    {/if}
    <div class="desliza">{#each DIAS_SEMANA as nombre, i}<button class="chip" class:on={diaMenu === i} onclick={() => (diaMenu = i)}>{nombre.slice(0, 3)}</button>{/each}</div>
    {#each d.dieta.comidas as c (c.id)}
      {@const s = sumaMenu(diaMenu, c.id)}
      <div class="tarjeta">
        <div class="fila entre"><h3>{c.nombre}</h3><span class="sec peq">pauta: {GRUPOS_RACION.filter((g) => c.raciones[g] > 0).map((g) => `${c.raciones[g]} ${g}`).join(', ')}</span></div>
        {#each menuDe(diaMenu, c.id) as e, k}
          <div class="fila entre peq">{#if e.tipo === 'plato' && receta(e.rid)}<button class="enlace-l" onclick={() => (recetaAbierta = { r: receta(e.rid), comida: c.id })}>{etiquetaEntrada(e)} <span class="sec">· ver receta</span></button>{:else}<span>{etiquetaEntrada(e)}</span>{/if}<button class="icono-b" style="width:36px;height:36px" onclick={() => d.dieta.menu[diaMenu][c.id].splice(k, 1)} aria-label="Quitar"><Icono n="cerrar" tam={18} /></button></div>
        {/each}
        {#if menuDe(diaMenu, c.id).length}
          {@const dif = GRUPOS_RACION.filter((g) => Math.abs((s[g] || 0) - (c.raciones[g] || 0)) >= 0.5)}
          <p class="peq" class:aviso={dif.length}>{dif.length ? `No cuadra: ${dif.map((g) => `${g} ${fmtNum(redondear(s[g]), 1)} de ${c.raciones[g]}`).join(', ')}` : 'Cuadra con tus raciones.'}</p>
        {/if}
        <button class="enlace" style="align-self:flex-start" onclick={() => (anadirEn = { menu: [diaMenu, c.id] })}>+ Añadir</button>
      </div>
    {/each}
    {#if diaMenu > 0}<button class="boton sec2 ancho" onclick={() => { d.dieta.menu[diaMenu] = JSON.parse(JSON.stringify(d.dieta.menu?.[diaMenu - 1] ?? {})); }}>Copiar el menú de {DIAS_SEMANA[diaMenu - 1].toLowerCase()}</button>{/if}

  {:else if sub === 'recetas'}
    <p class="sec peq">Platos sencillos y baratos. Al abrir uno, las cantidades se ajustan a las raciones de tu comida.</p>
    <div class="desliza">{#each [['todas', 'Todas'], ['desayuno', 'Desayuno'], ['comida', 'Comida'], ['cena', 'Cena'], ['merienda', 'Merienda'], ['postre', 'Postres']] as [v, l]}<button class="chip" class:on={filtroRecetas === v} onclick={() => (filtroRecetas = v)}>{l}</button>{/each}</div>
    {#each recetasFiltradas as r (r.id)}
      {@const apta = recetaApta(r, d.perfil)}
      <button class="tarjeta pulsable receta" class:noapta={!apta} onclick={() => (recetaAbierta = { r })}>
        <span class="fila entre" style="gap:8px"><b>{r.n}</b>{#if !apta}<span class="insignia aviso">No para ti</span>{/if}</span>
        {#if r.tipo === 'plato'}
          <span class="sec peq">{r.tiempo} min · ≈ {fmtNum(r.coste, 2)} € · {momentosDe(r).map((m) => NOMBRE_MOMENTO[m] ?? m).join(', ')}</span>
        {:else}
          <span class="sec peq">{r.kcal} kcal · {r.p} g prot por porción ({r.porciones} porciones) · {r.cuenta}</span>
        {/if}
      </button>
    {/each}

  {:else}
    {#each GRUPOS_RACION as g}
      {@const l = cat.alimentos.filter((a) => a.cc === g && a.rac && a.gm !== 0).slice(0, 60)}
      {#if l.length}
        <div class="tarjeta">
          <h3>1 {NOMBRE_RACION[g].toLowerCase()} = {DEF_RACION[g]}</h3>
          {#each l as a}<div class="fila entre peq"><span>{a.n}</span><span class="sec">{a.rac} g{a.gm && a.medida ? ` (${a.medida} = ${fmtNum(a.gm)} g)` : ''}</span></div>{/each}
        </div>
      {/if}
    {/each}
    <p class="sec peq">Verdura: libre. Fuente: USDA FoodData Central y valores típicos de etiqueta.</p>
  {/if}
  {/if}
</div>

{#if anadirEn}
  <AnadirAlimento cerrar={() => (anadirEn = null)} anotar={(e) => (anadirEn.menu ? agregarAlMenu(anadirEn.menu[0], anadirEn.menu[1], e) : anotar(fecha, { ...e, comida: anadirEn.comida }))} />
{/if}
{#if recetaAbierta}
  <FichaReceta receta={recetaAbierta.r} comidaInicial={recetaAbierta.comida ?? null} cerrar={() => (recetaAbierta = null)} />
{/if}

<style>
  .pestanas { display: flex; gap: 4px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 12px; padding: 4px; }
  .pestanas button { flex: 1; background: none; border: 0; border-radius: 9px; min-height: 40px; color: var(--texto2); font-size: 13px; cursor: pointer; }
  .pestanas button.on { background: var(--elevada); color: var(--acento); font-weight: 600; }
  .grupo { width: 76px; flex-shrink: 0; font-size: 14px; color: var(--texto2); }
  .fichita { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--borde); background: transparent; cursor: pointer; }
  .fichita.on { background: var(--comer); border-color: var(--comer); }
  .menu { display: flex; flex-direction: column; gap: 2px; background: var(--elevada); border-radius: 10px; padding: 8px 10px; }
  .pulsable { text-align: left; cursor: pointer; width: 100%; }
  .desliza { display: flex; gap: 6px; overflow-x: auto; }
  .desliza .chip { flex-shrink: 0; }
  .aviso { color: var(--aviso); }
  .enlace-l { background: none; border: 0; padding: 4px 0; text-align: left; color: inherit; cursor: pointer; font: inherit; min-height: 36px; }
  .receta { gap: 4px; }
  .noapta { opacity: 0.55; }
</style>
