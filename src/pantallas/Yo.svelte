<script>
  import { app } from '../lib/estado.svelte.js';
  import Icono from '../componentes/Icono.svelte';
  import Logo from '../componentes/Logo.svelte';
  import { URL_OPINION } from '../lib/instalar.js';
  let d = $derived(app.datos);
  const ir = (nombre, extra = {}) => (app.vista = { nombre, acento: 'yo', ...extra });
  const filas = $derived([
    ['perfil', 'Perfil', `${d.perfil.nombre || 'Sin nombre'} · nivel ${d.perfil.nivel}`],
    ['perfil-molestias', 'Molestias', d.perfil.molestias?.length ? d.perfil.molestias.join(', ') : 'Ninguna declarada'],
    ['editor', 'Mi rutina', d.rutina ? `${d.rutina.nombre} · versión ${d.rutina.version}` : 'Sin rutina'],
    ['midieta', 'Mi dieta', d.dieta ? `${d.dieta.kcal.toLocaleString('es-ES')} kcal · ${d.dieta.comidas.length} comidas` : 'Sin pauta'],
    ['test', 'Repetir el test', d.perfil.testFecha ? `Último: ${d.perfil.testFecha}` : 'Aún no lo has hecho'],
    ['archivo', 'Archivo PARE', 'Enviar a mi entrenador · abrir · copia de seguridad'],
    ...(d.cambiosPropuestos ? [['cambios', 'Cambios propuestos', 'Tu entrenador te ha mandado cambios']] : []),
    ...(d.entrenador.activo ? [['deportistas', 'Mis deportistas', `${d.entrenador.deportistas.length} deportistas`]] : []),
    ['ajustes', 'Ajustes', `Unidades ${d.ajustes.unidades}, incrementos, pantalla`],
    ['instalar', 'Instalar y compartir PARE', 'Tenerla como app · pasársela a la gente del gimnasio'],
    ...(URL_OPINION ? [['opinion', 'Danos tu opinión', 'Un minuto, anónimo: fallos, ideas, lo que echas en falta']] : []),
  ]);
  function abrir(k) {
    if (k === 'perfil-molestias') return ir('perfil', { seccion: 'molestias' });
    if (k === 'editor') return (app.vista = { nombre: 'editor', acento: 'entrenar' });
    if (k === 'midieta') return (app.vista = { nombre: 'midieta', acento: 'comer' });
    if (k === 'test') return (app.vista = { nombre: 'test' });
    if (k === 'opinion') return window.open(URL_OPINION, '_blank', 'noopener');
    ir(k);
  }
</script>

<div class="pantalla">
  <div class="cabecera"><h1>Yo</h1></div>
  {#each filas as [k, t, s]}
    <button class="fila-yo" onclick={() => abrir(k)}>
      <span class="col" style="gap:0;align-items:flex-start;min-width:0"><b>{t}</b><span class="sec peq">{s}</span></span>
      <span style="transform:scaleX(-1);color:var(--texto2)"><Icono n="atras" tam={20} /></span>
    </button>
  {/each}
  <div class="tarjeta">
    <span class="etiqueta">Modos</span>
    <label class="fila entre"><span>Modo entrenador <span class="sec peq">— ver a tus deportistas y proponerles cambios</span></span>
      <input type="checkbox" bind:checked={d.entrenador.activo} style="width:26px;height:26px" /></label>
    <p class="sec peq">Modo centro: próximamente (v1.2).</p>
  </div>
  <div class="acerca">
    <Logo tam={48} />
    <p class="sec peq">PARE · Pain and Reward · v0.1 (pruebas). Ejercicios: free-exercise-db (dominio público). Alimentos: USDA FoodData Central. Actividad: 2024 Adult Compendium of Physical Activities.</p>
    <p class="sec peq">PARE da criterios generales de entrenamiento y alimentación; no hace diagnósticos médicos. Ante dolor que empeora o dura más de 2-3 semanas, consulta con un profesional sanitario.</p>
  </div>
</div>

<style>
  .fila-yo { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: var(--superficie); border: 1px solid var(--borde); border-radius: 14px; padding: 14px 16px; min-height: 64px; text-align: left; cursor: pointer; }
  .acerca { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 16px 8px; }
</style>
