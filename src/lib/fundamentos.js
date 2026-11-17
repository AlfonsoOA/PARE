// «En qué se basa PARE»: cada decisión de la app, explicada en llano y con su bibliografía (ids de datos/catalogo_pare.json → referencias).
// «criterio» = lo que es decisión práctica de PARE y no sale tal cual de los estudios.
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
      id: 'e1rm', t: 'El 1RM estimado',
      x: 'Para comparar series con pesos y repeticiones distintos, PARE estima tu máximo a una repetición con la fórmula de Epley. Es una estimación: pierde precisión por encima de unas 10 repeticiones.',
      refs: ['REF12'],
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
      id: 'adherencia', t: 'La revisión de cada dos semanas',
      x: 'Las preguntas están adaptadas de tres cuestionarios validados: el de adherencia percibida a la dieta (PDAQ), el de adherencia al ejercicio prescrito (EARS) y el de automaticidad del hábito (SRBAI). Se han acortado y pasado a respuestas de tocar.',
      criterio: 'Al adaptarlas, la validación original no se traslada tal cual. El reparto de la nota de entreno (60 % sesiones hechas, 40 % respuestas) es criterio de PARE: pesa más lo que se mide que lo que se recuerda.',
      refs: ['REF24', 'REF25', 'REF26'],
    },
  ]],
  ['Datos', [
    {
      id: 'datos', t: 'De dónde salen los ejercicios y los alimentos',
      x: 'Ejercicios: base abierta free-exercise-db (dominio público), revisada y traducida. Alimentos: USDA FoodData Central y etiquetas típicas. Gasto de actividades: Compendio de Actividades Físicas 2024.',
      refs: ['REF10', 'REF17', 'REF16'],
    },
  ]],
];
