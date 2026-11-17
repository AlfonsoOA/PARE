// Formato del recetario en Excel, sin dependencias de la app: lo usan la app (exportar) y el script del recetario maestro (Node).
export const ESTILOS = [['española', 'Española'], ['mediterránea', 'Mediterránea'], ['italiana', 'Italiana'], ['asiática', 'Asiática'], ['mexicana', 'Mexicana'], ['árabe', 'Árabe e india'], ['internacional', 'Desayunos del mundo']];
export const ESTILO_DE = { india: 'árabe' };
export const MOMENTOS = ['desayuno', 'comida', 'merienda', 'cena', 'postre'];
export const DIETA = (r) => ((r.etq || []).includes('vegano') ? 'Vegana' : (r.etq || []).includes('vegetariano') ? 'Vegetariana' : 'Omnívora');
export const CAB_REC = ['ID', 'Origen', 'Nombre', 'Tipo', 'Porciones', 'Momento', 'Tiempo (min)', 'Estilo', 'Dieta', 'Peso final cocinado (g)', 'Notas', 'Protocolo', 'Borrar', 'Basada en'];
export const CAB_ING = ['Receta (ID o nombre)', 'Ingrediente', 'Gramos', 'Nota'];
export const nombreEstilo = (e) => ESTILOS.find(([v]) => v === (ESTILO_DE[e] ?? e))?.[1] ?? (e === 'casera' ? 'Casera' : e ?? '');
export const INSTRUCCIONES = [
  'PARE · Recetario en Excel',
  'Este archivo es tu recetario: trae todas las recetas de PARE y las tuyas. Edítalo y súbelo en PARE: Yo → Archivo PARE → Importar (o Comer → Recetas → Recetario en Excel).',
  '',
  'CÓMO SE ACTUALIZA:',
  'Cada receta tiene un ID. Si cambias una fila con ID, se actualiza esa receta. Una fila sin ID es una receta nueva.',
  'Nada se borra por no estar en el archivo. Para quitar una receta tuya, pon «sí» en la columna Borrar. Una receta de PARE no se borra: se oculta para ti.',
  'Las recetas de PARE (Origen = PARE) no se modifican para todos: si cambias una, se guarda como receta tuya («mi versión»). Si crees que debería cambiar para todos, pásale el archivo a quien mantiene PARE.',
  '',
  'HOJA «RECETAS» (una fila por receta):',
  'Tipo: «Plato» = un plato para una persona; PARE ajusta las cantidades a tu comida. «Lote» = se hace entero (un pan, una tarta) y se come por porciones.',
  'Porciones: en un lote, en cuántas porciones se divide. En un plato, 1.',
  'Momento: desayuno, comida, merienda, cena o postre; varios separados por punto y coma (comida; cena).',
  'Dieta: Omnívora, Vegetariana o Vegana. Los alérgenos los calcula PARE con los ingredientes.',
  'Peso final cocinado (g): opcional. Lo que pesa el plato o el lote ya hecho. Con él, PARE da los macros por 100 g de lo cocinado; sin él, por 100 g de la mezcla en crudo.',
  'Protocolo: un paso por línea dentro de la celda (Alt+Intro en Excel; Ctrl+Intro en Google Sheets). Si empiezas un paso con «Título: …», el título sale en negrita en la app.',
  '',
  'HOJA «INGREDIENTES» (una fila por ingrediente):',
  'Receta: el ID o el nombre exacto de la receta. Ingrediente: cópialo de la hoja «Alimentos» o elígelo en el desplegable; si escribes otro, PARE busca el más parecido y te deja corregirlo.',
  'Gramos: en crudo. Nota: «escurrida», «molida en casa», «4 huevos L»…',
  '',
  'Las calorías, los macros por porción y por 100 g y los alérgenos los calcula PARE. No hace falta ponerlos.',
];

export const INSTRUCCIONES_MAESTRO = [
  'PARE · Recetario maestro (el que ven todos)',
  'Este es el recetario de PARE tal como está publicado. Para cambiarlo para todos: edítalo y súbelo a GitHub, a la carpeta datos/recetario/entrada (Add file → Upload files → Commit). En unos minutos la app se actualiza sola.',
  'Solo cuentan las filas con Origen = PARE (o vacío). Para pasar al recetario de todos una receta tuya (Origen = Mía), cambia su Origen a PARE.',
  'Fila con ID de PARE: se actualiza esa receta. Fila sin ID: receta nueva (se le da un ID). Una receta tuya «mi versión» con «Basada en» y Origen = PARE sustituye a la original. «sí» en Borrar: se retira del recetario.',
  'El precio por ración se estima solo con los precios de los ingredientes. Los ingredientes tienen que llamarse exactamente como en la hoja «Alimentos»: si alguno no existe, no se publica nada y GitHub te avisa por correo de qué fila falla.',
  '',
];

/** Hojas del libro: instrucciones, recetas, ingredientes y la lista de alimentos. recetas en formato de la app. */
export function libroRecetario(recetas, { nombreAlimento, alimentos, maestro = false }) {
  const momentos = (r) => (r.momentos?.length ? r.momentos : String(r.momento || '').split(';').map((x) => x.trim()).filter(Boolean));
  const filasRec = [CAB_REC, ...recetas.map((r) => [r.id, r.propia ? 'Mía' : 'PARE', r.n, r.tipo === 'lote' ? 'Lote' : 'Plato', +r.porciones || 1,
    momentos(r).join('; '), r.tiempo ?? null, nombreEstilo(r.estilo), DIETA(r), r.pesoFinal ?? null, r.notas ?? '', (r.pasos || []).join('\n'), '', r.basadaEn ?? ''])];
  const filasIng = [CAB_ING, ...recetas.flatMap((r) => r.ingredientes.map((i) => [r.id, nombreAlimento(i.id) ?? i.n ?? i.id, i.g, i.nota ?? '']))];
  const ali = [...alimentos].sort((a, b) => a.localeCompare(b, 'es'));
  return [
    { nombre: 'Instrucciones', filas: [...(maestro ? INSTRUCCIONES_MAESTRO : []), ...INSTRUCCIONES].map((l) => [l]), anchos: [110], cabecera: false },
    { nombre: 'Recetas', filas: filasRec, anchos: [14, 8, 40, 8, 10, 18, 11, 14, 12, 12, 30, 60, 8, 12],
      desplegables: [{ rango: 'B2:B2000', lista: '"PARE,Mía"' }, { rango: 'D2:D2000', lista: '"Plato,Lote"' }, { rango: 'I2:I2000', lista: '"Omnívora,Vegetariana,Vegana"' }, { rango: 'M2:M2000', lista: '"sí,no"' }] },
    { nombre: 'Ingredientes', filas: filasIng, anchos: [16, 46, 9, 30], desplegables: [{ rango: 'B2:B5000', lista: `Alimentos!$A$2:$A$${ali.length + 1}` }] },
    { nombre: 'Alimentos', filas: [['Alimento'], ...ali.map((n) => [n])], anchos: [56] },
  ];
}
