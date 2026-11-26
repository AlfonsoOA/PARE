<script>
  import PorQue from '../componentes/PorQue.svelte';
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
      'Si empezaste un ejercicio demasiado ligero (te sobraban muchas repeticiones), al terminar la sesión pulsa «Me sobraba mucho: subir todas» en ese ejercicio: sube un escalón todas las series de la próxima vez. La doble progresión normal solo sube cuando llegas al tope de repeticiones.',
      'Si durante la sesión añades o quitas una serie (+ Serie / − Serie), ese número se queda en tu rutina para la próxima vez; al terminar te lo recuerda y puedes volver a lo que tenías. Una serie que solo dejas sin marcar no cuenta como quitada.',
      'Lo mismo con los ejercicios: si durante la sesión sustituyes uno o añades otro, se queda en tu rutina. Si quitas uno de la sesión, sigue en la rutina (puede ser solo por hoy), pero al terminar puedes quitarlo también de ahí. En «Cambios en tu rutina», al terminar, puedes deshacer cualquiera.',
      'Estiramientos: en Editar rutina, «Añadir ejercicio» → «Estiramientos» (o busca «caballero», «espalda», «rodillo»…). Se anotan por segundos, no cuentan en tus series semanales y no tienen progresión. Ponlos al final de la sesión.',
      'Al acabar, Terminar → «Terminar y guardar». En «Para la próxima» PARE te propone los pesos: si completaste todas las series en el tope de repeticiones, sube cada serie un escalón.',
      'Si un ejercicio llega al máximo de la máquina (no hay más placas), márcalo al terminar: «Es el máximo de la máquina». PARE deja de subir el peso y te sube las repeticiones; cuando llegues a 20 (15 en los multiarticulares, como una hack o un remo), te propone cambiarlo por una variante más dura. Si llevas 3 sesiones con el mismo peso aunque te tocaba subir, PARE te lo pregunta.',
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
      'Para siempre: Entrenar → Editar rutina. Cambias ejercicios (con «Sustituir» se cambia uno por otro en su sitio, sin descolocar las superseries), series, repeticiones, pesos, descansos o el reparto entero. También puedes sustituirlo desde su ficha técnica, con «Sustituir en mi rutina». Nada se guarda hasta que pulsas Guardar.',
      'Si te molesta una articulación, apúntalo en Yo → Molestias: los ejercicios a evitar salen marcados.',
    ]],
    ['intensidad', 'RPE, RIR y top set', [
      'RPE es el esfuerzo de una serie, de 1 a 10. RPE 10 = fallo, no sale ni una más. RPE 9 = te quedaba 1 repetición. RPE 8 = te quedaban 2.',
      'RIR son las repeticiones que te quedaban en reserva. Es lo mismo contado al revés: RIR 1 = RPE 9; RIR 2 = RPE 8.',
      'Top set: la serie más pesada del ejercicio, la primera tras calentar, a RPE alto. En la sesión sale marcada con TOP. Las demás son back-off: algo menos de peso (un 10-15 %) y alguna repetición más.',
      'Si tu rutina los lleva, los ves en negrita encima de las series de cada ejercicio. Se cambian en Editar rutina, en cada ejercicio.',
    ]],
    ['importar', 'Pasar tu rutina, tu dieta o tus recetas desde Excel', [
      'Yo → Archivo PARE → Importar rutina o dieta. Ahí descargas la plantilla de rutina o la de dieta.',
      'Para mandar una receta a alguien que no usa PARE: ábrela y, abajo, «Enviar la receta» → Como texto (un mensaje con ingredientes y pasos) o Como imagen (una ficha). Van con las cantidades que tengas en pantalla.',
      'Archivos PARE que te mandan por WhatsApp o correo (rutina, dieta, deportista, copia, o una plantilla de Excel de rutina o dieta): mantén pulsado el archivo → Compartir → PARE. Se abre solo donde toca. (Hace falta tener PARE instalada como app.) Para mandar la tuya: Entrenar → «Compartir mi rutina» o Comer → Mi dieta → «Compartir mi dieta».',
      'Rellénala en Excel, Google Sheets o la app de hojas de cálculo del móvil. Tiene una hoja de instrucciones, un ejemplo y la lista de ejercicios o alimentos de PARE para copiar los nombres.',
      'Guárdala como .xlsx (en Google Sheets: Archivo → Descargar → Microsoft Excel) y súbela en la misma pantalla.',
      'PARE reconoce los nombres. Los dudosos salen con «¿?» y los que no reconoce, en rojo: tócalos para elegir el bueno. Después revisas y aceptas.',
      'Recetas: en la misma pantalla (o en Comer → Recetas → Recetario en Excel) descargas el recetario completo, con todas las recetas de PARE y las tuyas. Una fila por receta: en «Ingredientes», uno por línea con sus gramos («300 g Plátano»), y en «Protocolo», los pasos. Cambia o añade filas y vuelve a subirlo: las filas con ID actualizan esa receta, las filas sin ID son recetas nuevas y nada se borra salvo que pongas «sí» en Borrar.',
      'Si cambias una receta de PARE, se guarda como tuya («mi versión»). PARE calcula solo las kcal, los macros por porción y por 100 g (de lo cocinado si pones el peso final) y los alérgenos.',
    ]],
    ['wod', 'CrossFit (WOD)', [
      'Desde Entrenar → WOD suelto, o en el día de WOD de tu rutina.',
      'Escribe el de la pizarra o elige uno de la biblioteca (Fran, Grace, Murph…). Elige la escala: RX, escalado o personalizado.',
      'Empieza el reloj: 10 segundos de preparación y pitidos. En un AMRAP pulsa «+1 ronda» al cerrar cada una. Tu mejor marca queda en Progreso → WOD.',
    ]],
    ['comer', 'Comer: raciones, menú y recetas', [
      'La dieta va por raciones, sin tener que pesar. Una ración de proteína (P) son 25 g de proteína, unos 120 g de pollo. Una de hidratos (HC) son 40 g, unos 55 g de arroz en crudo o 80 g de pan. Una de grasa (G) son 10 g, una cucharada de aceite.',
      'Comer → El día: cada comida tiene sus fichas de raciones. Toca una cuando la tomes. Si prefieres pesar, «+ Añadir alimento o receta».',
      'Comer → Mi menú: qué comer cada día de la semana, con las kcal y la proteína de cada comida. Cámbialo a tu gusto: toca los gramos de un alimento para cambiarlos y verás sus kcal y las de la comida al momento; con ✕ lo quitas y con «+ Añadir» pones otro. Si comes lo del menú, en El día pulsa «Tomado tal cual».',
      'Si ya sabes cuántas kcal quieres comer: Comer → Mi dieta → «Fijar mis kcal diarias». La proteína se queda igual y se ajustan los hidratos y la grasa, en la pauta y en los gramos del menú. Antes de aplicar ves cada cambio, y luego puedes deshacerlo.',
      'Comer → El día: toca una cifra del «Total del día» (kcal, proteína, hidratos o grasa) para ver de dónde sale, ordenado de más a menos, en ese día o en la media de los últimos 7. Las recetas se abren para ver qué aporta cada ingrediente. Así sabes qué recortar.',
      'Comer → Recetas: arriba tienes un buscador por palabras, que mira el nombre y los ingredientes («paella», «sepia», «avena»). Al abrir una, las cantidades se ajustan a tu comida y trae su protocolo con los trucos. Me gusta / No me gusta enseña a PARE qué proponerte.',
      'Comer → Raciones: cuánto es una ración de cada alimento.',
      'Comer → Suplementos: cuáles tienen respaldo (proteína, creatina) y cuáles solo según tu caso (cafeína, fibra, omega-3, sales, beta-alanina), con cuánto, cuándo, cómo, pros, contras y los estudios.',
      'Tu pauta, la hora a la que entrenas y si quieres más hidratos los días fuertes: Yo → Mi dieta.',
    ]],
    ['progreso', 'Ver tu progreso', [
      'Pésate 1-2 veces por semana, en ayunas: toca la tarjeta del peso en Hoy.',
      'Progreso → Ejercicios: si cada ejercicio progresa, está estable o estancado, con su gráfica y tus récords. También desde el propio ejercicio, con «Mi progreso».',
      'Progreso → Volumen: las series por grupo muscular de la semana, frente a la banda recomendada.',
      'Al anotar el peso, en «Más medidas» puedes apuntar cadera, pecho, brazo, muslo y lo que da tu báscula (grasa, músculo, visceral). Salen en Progreso → Cuerpo → Otras medidas, junto con la grasa estimada con cintura y cuello.',
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
      'Por qué PARE hace cada cosa (media serie para los secundarios, la progresión, las calorías…), con los estudios detrás: Yo → En qué se basa PARE.',
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
    <p class="sec peq">¿Por qué PARE cuenta media serie para los secundarios, o sube el peso así? <PorQue id="volumen" texto="En qué se basa PARE" /></p>
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
