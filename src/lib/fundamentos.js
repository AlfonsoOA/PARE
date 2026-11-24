// «En qué se basa PARE»: cada decisión de la app, explicada en llano y con su bibliografía (ids de datos/catalogo_pare.json → referencias).
// «criterio» = lo que es decisión práctica de PARE y no sale tal cual de los estudios.
import { SUPLEMENTOS, NIVELES } from './suplementos.js';

// Resumen de cada suplemento (la guía completa está en Comer → Suplementos)
const NIVEL_TXT = Object.fromEntries(NIVELES.map(([k, t]) => [k, t]));
const SUPL = SUPLEMENTOS.map((s) => ({
  id: 'supl-' + s.id, t: s.n,
  x: `${s.cond ? `Solo si: ${s.cond.charAt(0).toLowerCase()}${s.cond.slice(1)} ` : ''}${s.para}${s.dosis ? ` Cuánto: ${s.dosis.charAt(0).toLowerCase()}${s.dosis.slice(1)}` : ''}${s.cuando ? ` Cuándo: ${s.cuando.charAt(0).toLowerCase()}${s.cuando.slice(1)}` : ''}`,
  etiqueta: 'Nivel', criterio: `${NIVEL_TXT[s.nivel]}. En contra: ${s.contras.map((c) => c.charAt(0).toLowerCase() + c.slice(1).replace(/\.$/, '')).join('; ')}. Guía completa: Comer → Suplementos.`,
  refs: s.refs,
}));

export const FUNDAMENTOS = [
  ['Entrenamiento', [
    {
      id: 'volumen', t: 'Las series semanales por grupo muscular',
      x: 'Lo que más se relaciona con ganar músculo, dentro de lo razonable, es cuántas series duras haces a la semana para cada músculo. Por eso PARE cuenta tus series de trabajo por grupo (los calentamientos no cuentan) y las compara con una banda: por lo general, 10-20 series semanales por grupo; en piernas, que junta cuádriceps, isquios, glúteos y gemelos, 16-40.',
      criterio: 'Las bandas son un punto de partida, no un límite. Con 2-3 días a la semana el mínimo baja, porque 10 series por grupo no caben.',
      refs: ['REF02', 'REF04', 'REF01'],
    },
    {
      id: 'medias', t: 'Los músculos secundarios cuentan media serie',
      x: 'En un press de banca trabaja sobre todo el pecho, pero también el tríceps. PARE cuenta 1 serie para el músculo principal y 0,5 para los secundarios. Las meta-regresiones que comparan formas de contar encuentran que este «conteo fraccional» es el que mejor predice la hipertrofia.',
      criterio: 'Una serie cuenta como máximo una vez por grupo (una sentadilla es 1 serie de piernas, no 2). Las ponderaciones son una convención de análisis, no una medida fisiológica.',
      refs: ['REF01', 'REF03'],
    },
    {
      id: 'progresion', t: 'Doble progresión, serie a serie',
      x: 'Primero subes repeticiones dentro del rango (por ejemplo, de 10 a 12) y, cuando una serie llega al tope, sube su peso. Se hace serie a serie para respetar las pirámides: suben antes las series que ya llegan, no todas a la vez.',
      criterio: 'El escalón de peso (2,5 kg en barra, por ejemplo) es configurable en Ajustes.',
      refs: ['REF07'],
    },
    {
      id: 'tope', t: 'Al tope de la máquina: más repeticiones en vez de más peso',
      x: 'Si haces las series cerca del fallo, el músculo crece de forma parecida con cargas altas y con cargas bajas a más repeticiones. Por eso, cuando una máquina no tiene más peso, PARE te sube las repeticiones.',
      criterio: 'El techo de 20 repeticiones (15 en multiarticulares) es práctico: a partir de ahí suele parar antes el ahogo o el ardor que el músculo, y conviene una variante más dura.',
      refs: ['REF20'],
    },
    {
      id: 'mantenimiento', t: 'Mantenerse cuesta menos que ganar',
      x: 'Si lo que buscas es conservar la fuerza y el músculo que ya tienes, hace falta mucho menos entrenamiento que para ganarlos. En un ensayo, con un tercio del volumen semanal (y en jóvenes, hasta con un noveno) se conservó el músculo ganado durante 8 meses; los mayores necesitaron más. Las revisiones coinciden: lo que no se puede bajar es la intensidad (series exigentes, cerca del fallo). En jóvenes puede bastar 1 sesión y 1 serie por ejercicio a la semana; en mayores, unas 2 sesiones y 2-3 series.',
      criterio: 'Por eso el objetivo «Salud y sentirme mejor (mantenimiento)» lleva menos series, calorías de mantenimiento y una progresión suave: sin ningún estímulo, con los años la fuerza y el músculo bajan.',
      refs: ['REF51', 'REF52'],
    },
    {
      id: 'bilateral', t: 'Con una pierna (o un brazo) mueves más de la mitad',
      x: 'Lo que suma cada lado por separado suele ser más que lo que hacen los dos a la vez: es el «déficit bilateral». La explicación con más apoyo es neural (inhibición entre hemisferios). Varía mucho entre personas y tareas, y es más constante en ejercicios dinámicos.',
      criterio: 'Por eso un ejercicio a una pierna y su versión a dos son ejercicios distintos en PARE, y su progreso no se mezcla.',
      refs: ['REF19'],
    },
    {
      id: 'rir', t: 'RPE, RIR y top set',
      x: 'RIR son las repeticiones que te quedaban en reserva; RPE es lo mismo en una escala de 1 a 10 (RPE 9 = RIR 1). Es una forma validada de ajustar la intensidad sin buscar el fallo en cada serie.',
      criterio: 'En PARE son opcionales: si tu rutina los lleva, se muestran; nunca son obligatorios.',
      refs: ['REF08', 'REF09'],
    },
    {
      id: 'descansos', t: 'Descansos entre series',
      x: 'Para ganar músculo, descansar menos de un minuto rinde algo peor; por encima de unos 90 segundos apenas hay diferencias. En los ejercicios grandes y pesados, descansos más largos (2-3 minutos) ayudan a mantener el rendimiento.',
      refs: ['REF05', 'REF06', 'REF07'],
    },
    {
      id: 'wod', t: 'Los WOD de la biblioteca',
      x: 'Los entrenamientos de referencia (Fran, Grace, Murph, Cindy…) y sus estándares RX vienen de la metodología CrossFit, recogida en su guía oficial de nivel 1. Escalar es ajustar el peso, las repeticiones o el movimiento manteniendo el estímulo del entrenamiento. Repetir el mismo WOD y comparar tu tiempo o tus rondas es la forma de ver si mejoras.',
      criterio: 'Las versiones escaladas que propone PARE son criterio propio.',
      refs: ['REF11'],
    },
    {
      id: 'e1rm', t: 'El 1RM estimado',
      x: 'Para comparar series con pesos y repeticiones distintos, PARE estima tu máximo a una repetición con la fórmula de Epley. Es una estimación: las ecuaciones de 1RM aciertan razonablemente en ejercicios como el press de banca o la sentadilla, pero ninguna es exacta en todos los ejercicios ni para todo el mundo, y pierden precisión por encima de unas 10 repeticiones.',
      criterio: 'PARE usa el 1RM estimado para comparar tus series entre sí (si progresas), no como tu máximo real.',
      refs: ['REF12', 'REF46'],
    },
    {
      id: 'estiramientos', t: 'Estiramientos y rodillo: para qué sirven (y para qué no)',
      x: 'Estirar de forma regular mejora la flexibilidad, y eso es lo que justifica hacerlo. Lo que no hace, según las revisiones, es recuperarte antes: después de entrenar no devuelve antes la fuerza ni quita las agujetas, y tampoco reduce las lesiones de forma clara. Antes de entrenar, el estiramiento estático largo baja algo el rendimiento inmediato; para calentar es mejor el movimiento dinámico. El rodillo de espuma tiene efectos pequeños: algo más de flexibilidad y algo menos de dolor percibido. Y entrenar fuerza con recorrido completo mejora la movilidad tanto como estirar.',
      criterio: 'Por eso en PARE los estiramientos se anotan por segundos (30 s por lado, por defecto), no cuentan en tus series semanales ni tienen progresión. Si te sientan bien, al final de la sesión o en casa, adelante.',
      refs: ['REF48', 'REF47', 'REF49', 'REF50'],
    },
    {
      id: 'pc', t: 'Ejercicios con tu peso corporal',
      x: 'En dominadas, fondos o flexiones mueves una parte de tu peso, más el lastre o menos la asistencia. Para las flexiones se usan fracciones medidas en plataforma de fuerzas (unos 2/3 del peso corporal en la flexión estándar).',
      refs: ['REF13'],
    },
  ]],
  ['Dieta', [
    {
      id: 'calorias', t: 'Cómo calcula PARE tus calorías',
      x: 'Metabolismo basal con la ecuación de Mifflin-St Jeor, multiplicado por un factor de actividad (trabajo, pasos, días de entreno y otros deportes). Según el objetivo, se resta un 10-20 % o se suma un 10 %.',
      criterio: 'Es una estimación de partida: la báscula de las semanas siguientes dice si hay que ajustarla.',
      refs: ['REF22', 'REF16'],
    },
    {
      id: 'proteina', t: 'Proteína: 1,8 g por kilo',
      x: 'En las meta-regresiones, el beneficio de la proteína sobre el músculo deja de crecer en torno a 1,6 g por kilo y día, con un margen de incertidumbre que llega a unos 2,2 g. PARE usa 1,8 g/kg, repartida en 3-5 comidas.',
      refs: ['REF21', 'REF15'],
    },
    {
      id: 'hidratos', t: 'Los días de más hidratos',
      x: 'El entrenamiento de fuerza tira de glucógeno muscular. Por eso PARE puede poner más hidratos en la comida de alrededor del entreno los días de sesión dura.',
      refs: ['REF18'],
    },
    {
      id: 'bascula', t: 'La báscula frente a lo que comes',
      x: 'PARE compara lo que deberías estar cambiando de peso según tu ingesta con la tendencia real de la báscula (regresión de las últimas 4 semanas). Usa unas 7700 kcal por kilo, que es una aproximación: al principio de una dieta se pierde más agua y glucógeno, y el gasto se adapta con el tiempo.',
      criterio: 'Por eso hace falta un mínimo de 3 pesadas en 10 días y se mira la tendencia, nunca un día suelto.',
      refs: ['REF23'],
    },
  ]],
  ['Seguimiento', [
    {
      id: 'medidas', t: 'Cómo lee PARE tus medidas',
      x: 'Mira la tendencia del peso de las últimas 4 semanas (regresión, no días sueltos), el cambio de cintura en 3-9 semanas y si tu fuerza sube o baja, y lo compara con tu fase. En déficit, el ritmo recomendado para perder grasa conservando el músculo es del 0,5-1 % del peso a la semana; más rápido se pierde más masa magra. En superávit, del 0,25-0,5 % semanal (algo menos si llevas años entrenando). En mantenimiento, el peso estable con la cintura bajando y la fuerza subiendo es la señal de recomposición. La relación cintura/altura por debajo de 0,5 es la referencia de grasa abdominal saludable.',
      criterio: 'Los umbrales de «estable» (±0,25 % semanal) y de error de la cinta (1 cm) son de PARE. Es una lectura orientativa, no un diagnóstico.',
      refs: ['REF27', 'REF28', 'REF29', 'REF30', 'REF31', 'REF32'],
    },
    {
      id: 'adherencia', t: 'La revisión de cada dos semanas',
      x: 'Las preguntas están adaptadas de tres cuestionarios validados: el de adherencia percibida a la dieta (PDAQ), el de adherencia al ejercicio prescrito (EARS) y el de automaticidad del hábito (SRBAI). Se han acortado y pasado a respuestas de tocar.',
      criterio: 'Al adaptarlas, la validación original no se traslada tal cual. El reparto de la nota de entreno (60 % sesiones hechas, 40 % respuestas) es criterio de PARE: pesa más lo que se mide que lo que se recuerda.',
      refs: ['REF24', 'REF25', 'REF26'],
    },
  ]],
  ['Suplementos', SUPL],
  ['Datos', [
    {
      id: 'datos', t: 'De dónde salen los ejercicios y los alimentos',
      x: 'Ejercicios: base abierta free-exercise-db (dominio público), revisada y traducida. Alimentos: USDA FoodData Central y etiquetas típicas. Gasto de actividades: Compendio de Actividades Físicas 2024. Dibujo del mapa muscular: react-body-highlighter (licencia MIT).',
      refs: ['REF10', 'REF17', 'REF16'],
    },
  ]],
];
