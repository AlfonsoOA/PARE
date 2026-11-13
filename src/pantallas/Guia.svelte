<script>
  // «Cómo se usa»: guía dentro de la app, por tareas. Se abre desde Yo, desde Hoy (primera semana) o con el enlace …/PARE/#guia.
  import { app } from '../lib/estado.svelte.js';
  import { URL_PARE, URL_OPINION } from '../lib/instalar.js';
  import Icono from '../componentes/Icono.svelte';
  let { volver = null } = $props();
  if (app.datos) app.datos.guiaVista = true;
  const atras = () => (app.vista = volver);

  const SECCIONES = [
    ['empezar', 'Empezar en 5 minutos', [
      'Instálala como app: en Android, abre el enlace en Chrome → menú ⋮ → «Instalar aplicación». En iPhone, en Safari → Compartir → «Añadir a pantalla de inicio». Si la abres desde WhatsApp o el lector de QR, pásala antes a Chrome o Safari.',
      'Haz el test de inicio (unos 5 minutos): tus datos, molestias, objetivo, días de entreno y comidas. Con eso PARE te monta la rutina y la dieta.',
      'En «Tu plan» ves la rutina, las calorías y el porqué de cada cosa. Pulsa Empezar y llegas a Hoy, tu pantalla de cada día.',
    ]],
    ['sesion', 'Entrenar: apuntar una sesión', [
      'En Hoy pulsa Empezar: es la sesión que te toca. Con «Cambiar sesión» eliges otra.',
      'Toca el nombre de un ejercicio para abrirlo: ves sus series, la imagen y la ficha técnica.',
      'Toca una serie para poner el peso y las repeticiones, y pulsa Hecha (o el ✓ de la derecha). Arranca la barra de descanso.',
      'Cada serie ya trae el peso que hiciste en esa misma serie la última vez, también si haces pirámide. Si cambias el peso de una serie, las siguientes se ajustan solas.',
      'Debajo de cada serie ves «antes 60 kg × 10»: lo que hiciste la vez anterior. La idea es igualarlo o mejorarlo.',
      'El primer día de un ejercicio, elige un peso con el que te sobren 2-3 repeticiones.',
      'Al acabar, Terminar → «Terminar y guardar». En «Para la próxima» PARE te propone los pesos: si completaste todas las series en el tope de repeticiones, sube cada serie un escalón.',
      'El botón atrás del móvil no borra nada: la sesión sigue abierta y la retomas desde Hoy.',
    ]],
    ['peso-corporal', 'Dominadas, fondos y otros con tu peso', [
      'Al tocar la serie elige «Solo peso corporal», «Con lastre» o «Con asistencia» y pon los kilos en positivo.',
      'En la lista sale «PC + 10» (con 10 kg de lastre) o «PC − 20» (con 20 kg de ayuda de la máquina).',
    ]],
    ['superseries', 'Superseries', [
      'Van en un recuadro azul o verde con la cabecera «Superserie A». Haz un ejercicio detrás de otro sin descanso; el descanso va al acabar la vuelta.',
      'Para unir dos ejercicios: menú ··· del ejercicio → «Unir con el siguiente», o en Editar rutina.',
    ]],
    ['rutina', 'Cambiar tu rutina', [
      'Para un día: en la sesión, menú ··· del ejercicio → «Sustituir por otro». PARE te propone alternativas que respetan tus molestias.',
      'Para siempre: Entrenar → Editar rutina. Cambias ejercicios, series, repeticiones, pesos, descansos o el reparto entero. Nada se guarda hasta que pulsas Guardar.',
      'Si te molesta una articulación, apúntalo en Yo → Molestias: los ejercicios a evitar salen marcados.',
    ]],
    ['wod', 'CrossFit (WOD)', [
      'Desde Entrenar → WOD suelto, o en el día de WOD de tu rutina.',
      'Escribe el de la pizarra o elige uno de la biblioteca (Fran, Grace, Murph…). Elige la escala: RX, escalado o personalizado.',
      'Empieza el reloj: 10 segundos de preparación y pitidos. En un AMRAP pulsa «+1 ronda» al cerrar cada una. Tu mejor marca queda en Progreso → WOD.',
    ]],
    ['comer', 'Comer: raciones, menú y recetas', [
      'La dieta va por raciones, sin tener que pesar. Una ración de proteína (P) son 25 g de proteína, unos 120 g de pollo. Una de hidratos (HC) son 40 g, unos 55 g de arroz en crudo o 80 g de pan. Una de grasa (G) son 10 g, una cucharada de aceite.',
      'Comer → El día: cada comida tiene sus fichas de raciones. Toca una cuando la tomes. Si prefieres pesar, «+ Añadir alimento o receta».',
      'Comer → Mi menú: qué comer cada día de la semana, con las kcal y la proteína de cada comida. Cámbialo a tu gusto. Si comes lo del menú, en El día pulsa «Tomado tal cual».',
      'Comer → Recetas: al abrir una, las cantidades se ajustan a tu comida y trae su protocolo con los trucos. Me gusta / No me gusta enseña a PARE qué proponerte.',
      'Comer → Equivalencias: cuánto es una ración de cada alimento.',
      'Tu pauta, la hora a la que entrenas y si quieres más hidratos los días fuertes: Yo → Mi dieta.',
    ]],
    ['progreso', 'Ver tu progreso', [
      'Pésate 1-2 veces por semana, en ayunas: toca la tarjeta del peso en Hoy.',
      'Progreso → Ejercicios: si cada ejercicio progresa, está estable o estancado, con su gráfica y tus récords. También desde el propio ejercicio, con «Mi progreso».',
      'Progreso → Volumen: las series por grupo muscular de la semana, frente a la banda recomendada.',
      'Progreso → Cuerpo: peso, cintura y «La báscula frente a lo que comes», que compara lo que deberías estar cambiando de peso con lo que marca la báscula.',
    ]],
    ['revision', 'La revisión de cada dos semanas', [
      'Cada 14 días aparece en Hoy. Es menos de un minuto, todo de tocar.',
      'Te da tu adherencia (dieta, entreno y hábito) y dos ideas concretas para lo que más te haya costado.',
      'La evolución está en Progreso → Adherencia. Desde ahí también puedes hacerla cuando quieras.',
    ]],
    ['copia', 'Tus datos, la copia y el entrenador', [
      'Todo se guarda en tu móvil: nadie más lo ve, y no hay cuentas.',
      'Por eso conviene hacer copia: Yo → Archivo PARE → Copia de seguridad. Mándate el archivo por correo o guárdalo en la nube. Con él te llevas todo a otro móvil.',
      'Si tienes entrenador: Yo → Archivo PARE → Enviar. Lo más cómodo es al acabar cada revisión quincenal. Él te devuelve cambios y tú decides si los aceptas.',
    ]],
    ['problemas', 'Si algo no va', [
      'No ves los cambios nuevos o se queda en blanco: cierra la app del todo y vuelve a abrirla. Si a los 12 segundos sigue sin cargar, pulsa «Reparar y recargar»: no borra tus datos.',
      'Funciona sin cobertura, salvo la primera vez que la abres.',
      'PARE da criterios generales; no es consejo médico. Si un dolor empeora o dura más de 2-3 semanas, consulta con un profesional.',
    ]],
  ];
  let abierta = $state('empezar');
</script>

<div class="pantalla">
  <div class="fila"><button class="icono-b" data-atras onclick={atras} aria-label="Atrás"><Icono n="atras" /></button><span class="etiqueta">Cómo se usa</span></div>
  <h1>Cómo se usa PARE</h1>
  <p class="sec peq">Toca cada apartado para abrirlo. Esta guía está siempre en Yo → Cómo se usa.</p>

  {#each SECCIONES as [id, titulo, pasos]}
    <section class="tarjeta sec-guia">
      <button class="cab" onclick={() => (abierta = abierta === id ? null : id)} aria-expanded={abierta === id}>
        <b>{titulo}</b><span class="flecha" class:abierta={abierta === id}><Icono n="atras" tam={18} /></span>
      </button>
      {#if abierta === id}
        <ol class="pasos">{#each pasos as p}<li>{p}</li>{/each}</ol>
      {/if}
    </section>
  {/each}

  <div class="tarjeta" style="gap:8px">
    <span class="etiqueta">¿Te has perdido en algo?</span>
    <p class="sec peq">Cuéntanoslo: lo que no se entiende es lo primero que arreglamos.</p>
    {#if URL_OPINION}<button class="boton sec2 ancho" onclick={() => window.open(URL_OPINION, '_blank', 'noopener')}>Danos tu opinión</button>{/if}
    <p class="sec peq">Para pasar esta guía a alguien: {URL_PARE}#guia</p>
  </div>
</div>

<style>
  .sec-guia { padding: 0; gap: 0; }
  .cab { all: unset; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; font-size: 16px; min-height: 52px; }
  .cab:focus-visible { outline: 2px solid var(--acento); outline-offset: -2px; border-radius: 12px; }
  .flecha { transform: rotate(-90deg); color: var(--texto2); transition: transform 0.15s; display: flex; }
  .flecha.abierta { transform: rotate(90deg); }
  .pasos { margin: 0; padding: 0 16px 16px 36px; display: flex; flex-direction: column; gap: 8px; line-height: 1.45; font-size: 15px; }
</style>
