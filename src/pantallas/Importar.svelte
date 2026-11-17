<script>
  // Importar una rutina o una dieta desde la plantilla de Excel (o un .csv): emparejar nombres, revisar y aceptar.
  import { app, aviso } from '../lib/estado.svelte.js';
  import { cat } from '../lib/catalogo.js';
  import { alimento } from '../lib/dieta.js';
  import { leerHojaDeCalculo } from '../lib/xlsx.js';
  import { detectar, leerRutina, leerDieta, construirRutina, construirDieta, URL_PLANTILLA_RUTINA, URL_PLANTILLA_DIETA } from '../lib/plantillas.js';
  import { esRecetario, leerRecetario, estadoDe, TEXTO_ESTADO, guardarRecetario, recetarioXlsx, nombreRecetario } from '../lib/recetario.js';
  import { guardarXlsx } from '../lib/xlsxEscribir.js';
  import Icono from '../componentes/Icono.svelte';
  import Buscador from '../componentes/Buscador.svelte';
  import AnadirAlimento from '../componentes/AnadirAlimento.svelte';

  let { volver = null } = $props();
  let entrada = $state();
  let lectura = $state(null);
  let error = $state('');
  let nombre = $state('Mi rutina');
  let cambiando = $state(null); // fila que se está eligiendo
  const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  async function elegido(ev) {
    const f = ev.currentTarget.files?.[0];
    ev.currentTarget.value = '';
    if (!f) return;
    error = ''; lectura = null;
    try {
      const { hojas } = await leerHojaDeCalculo(f);
      const tipo = esRecetario(hojas) ? 'recetas' : detectar(hojas);
      lectura = tipo === 'recetas' ? leerRecetario(hojas) : tipo === 'rutina' ? leerRutina(hojas) : tipo === 'dieta' ? leerDieta(hojas) : null;
      if (!lectura) error = 'No encuentro la tabla. Usa la plantilla de PARE: la rutina necesita la columna «Ejercicio»; la dieta, «Alimento» y «Gramos»; el recetario, las hojas «Recetas» e «Ingredientes».';
      if (lectura?.tipo === 'rutina') nombre = f.name.replace(/\.(xlsx|csv)$/i, '').replace(/^PARE_plantilla_/, '').replace(/[_-]+/g, ' ') || 'Mi rutina';
    } catch (e) {
      error = 'No he podido leer el archivo. Guárdalo como .xlsx (Excel o Google Sheets → Descargar → Microsoft Excel) o como .csv.';
    }
  }
  const filasTodas = $derived(lectura ? (lectura.tipo === 'rutina' ? lectura.dias.flatMap((d) => d.filas) : lectura.tipo === 'recetas' ? lectura.recetas.filter((r) => !['igual', 'borrar', 'ocultar', 'nada'].includes(estadoDe(r).tipo)).flatMap((r) => r.ingredientes) : lectura.filas) : []);
  const conCambios = $derived(lectura?.tipo === 'recetas' ? lectura.recetas.filter((r) => estadoDe(r).tipo !== 'igual') : []);
  async function descargarRecetario() {
    const r = await guardarXlsx(recetarioXlsx(), nombreRecetario());
    if (r === 'descargado') aviso('Recetario guardado en Descargas');
  }
  function guardarRecetas() {
    const r = guardarRecetario(lectura);
    const partes = [[r.nuevas, 'nuevas'], [r.actualizadas, 'actualizadas'], [r.versiones, 'versiones tuyas'], [r.borradas, 'borradas'], [r.ocultas, 'ocultadas']].filter(([n]) => n).map(([n, t]) => `${n} ${t}`);
    aviso(partes.length ? `Recetas: ${partes.join(', ')}` : 'No había nada que cambiar');
    app.subComer = 'recetas'; app.filtroRecetas = 'mias'; app.tab = 'comer'; app.vista = null;
  }
  const sinEmparejar = $derived(filasTodas.filter((x) => !x.id).length);
  const dudosas = $derived(filasTodas.filter((x) => x.id && !x.ok).length);
  const nombreDe = (x) => (lectura?.tipo === 'rutina' ? cat.porId.get(x.id)?.n : alimento(x.id)?.n) ?? '';
  const diasTxt = (ds) => (ds.length === 7 ? 'todos los días' : ds.map((d) => DIAS[d]).join(' '));

  function aceptar() {
    const c = { de: { id: 'plantilla', nombre: 'Tu plantilla de Excel' }, creado: new Date().toISOString(), nota: '', rutina: null, dieta: null };
    if (lectura.tipo === 'rutina') c.rutina = construirRutina(lectura, nombre.trim() || 'Mi rutina');
    else c.dieta = construirDieta(lectura);
    app.datos.cambiosPropuestos = c;
    app.vista = { nombre: 'cambios', acento: 'yo' };
  }
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={() => (app.vista = volver)} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Importar desde Excel</span></div>
  <h1>Rutina, dieta o recetas, desde una hoja de cálculo</h1>

  {#if !lectura}
    <div class="tarjeta" style="gap:8px">
      <span class="etiqueta">1 · Descarga la plantilla</span>
      <p class="sec peq">Tiene una hoja de instrucciones, un ejemplo y la lista de ejercicios o alimentos de PARE para copiar los nombres. Se abre con Excel, Google Sheets o la app de hojas de cálculo del móvil.</p>
      <div class="fila" style="gap:8px">
        <a class="boton sec2" style="flex:1" href={URL_PLANTILLA_RUTINA} download>Plantilla de rutina</a>
        <a class="boton sec2" style="flex:1" href={URL_PLANTILLA_DIETA} download>Plantilla de dieta</a>
      </div>
      <button class="boton sec2 ancho" onclick={descargarRecetario}>Recetario completo (todas las recetas)</button>
      <p class="sec peq">El recetario trae todas las recetas de PARE y las tuyas, con su ID: sirve de plantilla y de base de datos. Cambia o añade filas y vuelve a subirlo; nada se borra salvo que lo marques.</p>
    </div>
    <div class="tarjeta" style="gap:8px">
      <span class="etiqueta">2 · Rellénala y súbela</span>
      <p class="sec peq">Guárdala como .xlsx (o .csv). PARE reconoce los nombres; los que no, te los deja elegir antes de aceptar.</p>
      <button class="boton ancho" onclick={() => entrada.click()}>Elegir archivo</button>
      <input bind:this={entrada} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" class="oculto" onchange={elegido} />
      {#if error}<p class="peq aviso-t">{error}</p>{/if}
    </div>
  {:else}
    <div class="tarjeta" style="gap:6px">
      <span class="etiqueta">{lectura.tipo === 'rutina' ? `Rutina · ${lectura.dias.length} días` : lectura.tipo === 'recetas' ? `Recetario · ${lectura.recetas.length} recetas` : `Dieta · ${lectura.filas.length} alimentos`}</span>
      <p class="peq">{filasTodas.length - sinEmparejar} de {filasTodas.length} reconocidos.{#if dudosas}{' '}Revisa los marcados con «¿?».{/if}{#if sinEmparejar}{' '}{sinEmparejar} sin reconocer: tócalos para elegir; si no, se quedan fuera.{/if}</p>
      <p class="sec peq">Toca cualquier fila para cambiar lo que ha elegido PARE.</p>
    </div>

    {#if lectura.tipo === 'recetas'}
      <p class="sec peq">{lectura.recetas.length - conCambios.length} recetas sin cambios.{#if !conCambios.length}{' '}No hay nada que guardar.{/if}</p>
      {#each conCambios as r}
        {@const e = estadoDe(r)}
        <div class="tarjeta" style="gap:4px">
          <div class="fila entre" style="gap:8px"><b>{r.n}</b><span class="insignia" class:aviso={e.tipo === 'borrar' || e.tipo === 'ocultar'}>{TEXTO_ESTADO[e.tipo]}</span></div>
          {#if !['borrar', 'ocultar', 'nada'].includes(e.tipo)}
            <span class="sec peq">{r.tipo === 'lote' ? `Lote de ${r.porciones} porciones` : 'Plato'} · {r.momentos.join(', ')}{r.pesoFinal ? ` · ${r.pesoFinal} g cocinado` : ''} · {r.pasos.length} pasos</span>
            {#each r.ingredientes as x}
              <button class="fila-imp" class:mal={!x.id} onclick={() => (cambiando = x)}>
                <span class="col" style="gap:0;min-width:0;align-items:flex-start">
                  <b>{x.id ? nombreDe(x) : 'Sin reconocer: toca para elegir'}{#if x.id && !x.ok}{' '}<span class="aviso-t">¿?</span>{/if}</b>
                  <span class="sec peq">«{x.texto}» · {x.g} g{x.nota ? ` · ${x.nota}` : ''}</span>
                </span>
              </button>
            {/each}
            {#if r.ingredientes.some((i) => !i.id)}<p class="peq aviso-t">Mientras falte algún ingrediente, esta receta no se guarda.</p>{/if}
          {/if}
        </div>
      {/each}
    {:else if lectura.tipo === 'rutina'}
      <label class="campo">Nombre de la rutina<input type="text" bind:value={nombre} /></label>
      {#each lectura.dias as d}
        <div class="tarjeta" style="gap:4px">
          <span class="etiqueta">{d.nombre}</span>
          {#each d.filas as x}
            <button class="fila-imp" class:mal={!x.id} onclick={() => (cambiando = x)}>
              <span class="col" style="gap:0;min-width:0;align-items:flex-start">
                <b>{#if x.biserie}<span class="sec">{`${x.biserie} · `}</span>{/if}{x.id ? nombreDe(x) : 'Sin reconocer: toca para elegir'}{#if x.id && !x.ok} <span class="aviso-t">¿?</span>{/if}</b>
                <span class="sec peq">«{x.texto}» · {x.series} × {x.repMin === x.repMax ? x.repMin : `${x.repMin}-${x.repMax}`}{x.rpe ? ` · RPE ${x.rpe}` : ''}{x.rir ? ` · RIR ${x.rir}` : ''}{x.topSet ? ' · top set' : ''}</span>
              </span>
            </button>
          {/each}
        </div>
      {/each}
    {:else}
      {#each [...new Set(lectura.filas.map((x) => x.comida))] as com}
        <div class="tarjeta" style="gap:4px">
          <span class="etiqueta">{com}</span>
          {#each lectura.filas.filter((x) => x.comida === com) as x}
            <button class="fila-imp" class:mal={!x.id} onclick={() => (cambiando = x)}>
              <span class="col" style="gap:0;min-width:0;align-items:flex-start">
                <b>{x.id ? nombreDe(x) : 'Sin reconocer: toca para elegir'}{#if x.id && !x.ok} <span class="aviso-t">¿?</span>{/if}</b>
                <span class="sec peq">«{x.texto}» · {x.g} g · {diasTxt(x.dias)}</span>
              </span>
            </button>
          {/each}
        </div>
      {/each}
    {/if}

    {#if lectura.tipo === 'recetas'}
      <button class="boton ancho" disabled={!conCambios.length} onclick={guardarRecetas}>Guardar recetas</button>
    {:else}
      <button class="boton ancho" disabled={filasTodas.length === sinEmparejar} onclick={aceptar}>Revisar y aceptar</button>
    {/if}
    <button class="boton sec2 ancho" onclick={() => (lectura = null)}>Elegir otro archivo</button>
  {/if}
</div>

{#if cambiando && lectura?.tipo === 'rutina'}
  <Buscador titulo="¿Qué ejercicio es?" inicial={cambiando.texto} cerrar={() => (cambiando = null)} elegir={(id) => { cambiando.id = id; cambiando.ok = true; cambiando = null; }} />
{:else if cambiando}
  <AnadirAlimento titulo="¿Qué alimento es?" soloAlimentos cerrar={() => (cambiando = null)} anotar={(e) => { cambiando.id = e.aid; cambiando.ok = true; }} />
{/if}

<style>
  .fila-imp { all: unset; box-sizing: border-box; width: 100%; display: flex; gap: 8px; padding: 8px 0; border-top: 1px solid var(--borde); cursor: pointer; }
  .fila-imp:first-of-type { border-top: 0; }
  .fila-imp.mal b { color: var(--peligro, #e5484d); }
  .fila-imp:focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; border-radius: 6px; }
  a.boton { display: flex; align-items: center; justify-content: center; text-decoration: none; }
</style>
