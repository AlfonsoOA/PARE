<script>
  import { app, cargarDatos } from './lib/estado.svelte.js';
  import { cargarCatalogo, cat } from './lib/catalogo.js';
  import BarraPestanas from './componentes/BarraPestanas.svelte';
  import Logo from './componentes/Logo.svelte';
  import Bienvenida from './pantallas/Bienvenida.svelte';
  import Test from './pantallas/Test.svelte';
  import TuPlan from './pantallas/TuPlan.svelte';
  import Hoy from './pantallas/Hoy.svelte';
  import Entrenar from './pantallas/Entrenar.svelte';
  import Sesion from './pantallas/Sesion.svelte';
  import FinSesion from './pantallas/FinSesion.svelte';
  import EditorRutina from './pantallas/EditorRutina.svelte';
  import FichaEjercicio from './pantallas/FichaEjercicio.svelte';
  import Comer from './pantallas/Comer.svelte';
  import Progreso from './pantallas/Progreso.svelte';
  import ProgresoEjercicio from './pantallas/ProgresoEjercicio.svelte';
  import Yo from './pantallas/Yo.svelte';
  import MiDieta from './pantallas/MiDieta.svelte';
  import Archivo from './pantallas/Archivo.svelte';
  import Deportistas from './pantallas/Deportistas.svelte';
  import Deportista from './pantallas/Deportista.svelte';
  import Cambios from './pantallas/Cambios.svelte';
  import Ajustes from './pantallas/Ajustes.svelte';
  import Perfil from './pantallas/Perfil.svelte';

  let error = $state(null);
  Promise.all([cargarCatalogo(), cargarDatos()])
    .then(() => { app.listo = true; })
    .catch((e) => { error = String(e); });

  const VISTAS = {
    test: Test, plan: TuPlan, sesion: Sesion, fin: FinSesion, editor: EditorRutina, ficha: FichaEjercicio,
    progresoEj: ProgresoEjercicio, midieta: MiDieta, archivo: Archivo, deportistas: Deportistas,
    deportista: Deportista, cambios: Cambios, ajustes: Ajustes, perfil: Perfil,
  };
  const TABS = { hoy: Hoy, entrenar: Entrenar, comer: Comer, progreso: Progreso, yo: Yo };
  const SIN_BARRA = new Set(['test', 'plan', 'sesion', 'fin', 'bienvenida']);

  const nuevo = $derived(app.listo && !app.datos.rutina && !app.datos.perfil.test);
  const Vista = $derived(app.vista && VISTAS[app.vista.nombre]);
  const Tab = $derived(TABS[app.tab] ?? Hoy);
  const conBarra = $derived(!nuevo && !(app.vista && SIN_BARRA.has(app.vista.nombre)));
</script>

<div class="raiz" style="--acento: var(--{app.vista?.acento ?? app.tab})">
  {#if error}
    <div class="pantalla"><h1>No se pudo cargar PARE</h1><p class="sec">{error}</p></div>
  {:else if !app.listo}
    <div class="carga"><Logo tam={96} /></div>
  {:else if nuevo && !Vista}
    <Bienvenida />
  {:else if Vista}
    {#key app.vista}
      <Vista {...app.vista} />
    {/key}
  {:else}
    <Tab />
  {/if}

  {#if conBarra && app.listo}<BarraPestanas />{/if}

  {#if app.toast}
    <div class="toast" role="status">{app.toast}</div>
  {/if}
</div>

<style>
  .raiz { min-height: 100vh; min-height: 100dvh; }
  .carga { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .toast {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--barra) + env(safe-area-inset-bottom, 0px) + 18px);
    background: var(--texto); color: var(--fondo); padding: 12px 18px; border-radius: 12px; font-weight: 600; z-index: 60;
    max-width: calc(100vw - 32px); font-size: 15px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }
</style>
