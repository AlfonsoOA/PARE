// Formato del recetario en Excel, sin dependencias de la app: lo usan la app (exportar) y el script del recetario maestro (Node).
export const ESTILOS = [['española', 'Española'], ['mediterránea', 'Mediterránea'], ['italiana', 'Italiana'], ['asiática', 'Asiática'], ['mexicana', 'Mexicana'], ['árabe', 'Árabe e india'], ['internacional', 'Desayunos del mundo']];
export const ESTILO_DE = { india: 'árabe' };
export const MOMENTOS = ['desayuno', 'comida', 'merienda', 'cena', 'postre'];
export const DIETA = (r) => ((r.etq || []).includes('vegano') ? 'Vegana' : (r.etq || []).includes('vegetariano') ? 'Vegetariana' : 'Omnívora');
export const CAB_REC = ['ID', 'Origen', 'Nombre', 'Tipo', 'Porciones', 'Momento', 'Tiempo (min)', 'Estilo', 'Dieta', 'Peso final cocinado (g)', 'Ingredientes', 'Protocolo', 'Notas', 'Borrar', 'Basada en'];

// ---------- La celda «Ingredientes»: un ingrediente por línea, «300 g Plátano (nota)» ----------
const N = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const fmtG = (g) => String(Math.round((+g || 0) * 10) / 10).replace('.', ',');
export const lineaIngrediente = (nombre, g, nota) => `${fmtG(g)} g ${nombre}${nota ? ` (${nota})` : ''}`;
const UNIDAD = '(?:g|gr|grs|gramos?|ml|cc)\\.?';
/** Lee la celda: devuelve [{ g, nombre, nota, texto }]. existe(nombre) dice si un nombre está tal cual en la lista de alimentos. */
export function leerCeldaIngredientes(celda, existe = () => false) {
  const out = [];
  for (const bruto of String(celda ?? '').split(/\r?\n/)) {
    const linea = bruto.replace(/^[\s•*·–-]+/, '').trim();
    if (!linea) continue;
    let g = null, resto = linea, m;
    if ((m = linea.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${UNIDAD}\\s+(?:de\\s+)?(.+)$`, 'i')))) { g = +m[1].replace(',', '.'); resto = m[2]; }
    else if ((m = linea.match(new RegExp(`^(.+?)[\\s:,–-]+(\\d+(?:[.,]\\d+)?)\\s*${UNIDAD}$`, 'i')))) { g = +m[2].replace(',', '.'); resto = m[1]; }
    resto = resto.trim();
    // el nombre más largo que exista tal cual; lo que sobra (tras «(» o «,») es la nota
    let nombre = null, nota = '';
    const cortes = [resto.length, ...[...resto.matchAll(/\s*[(,]/g)].map((x) => x.index).reverse()];
    for (const i of cortes) { const pre = resto.slice(0, i).trim(); if (pre && existe(pre)) { nombre = pre; nota = resto.slice(i).replace(/^[\s(,]+|\)\s*$/g, '').trim(); break; } }
    if (!nombre) { const p = resto.match(/^(.*?)\s*\(([^()]*)\)\s*$/); nombre = (p ? p[1] : resto).trim(); nota = p ? p[2].trim() : ''; }
    out.push({ g, nombre, nota, texto: linea });
  }
  return out;
}
/** Los nombres de la lista más parecidos a uno escrito a mano (para avisar «¿quisiste decir…?»). */
export function parecidos(nombre, nombres, n = 2) {
  const q = N(nombre).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return nombres.map((x) => { const w = N(x).split(/[^a-z0-9]+/); return [x, q.filter((p) => w.some((v) => v.startsWith(p.slice(0, 5)) || p.startsWith(v.slice(0, 5)) && v.length > 3)).length]; })
    .filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([x]) => x);
}
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
  'Ingredientes: uno por línea dentro de la celda (Alt+Intro en Excel; Ctrl+Intro en Google Sheets), con los gramos en crudo delante: «300 g Plátano». Una aclaración va entre paréntesis al final: «60 g Huevo entero (1 huevo L)».',
  'Copia el nombre del ingrediente de la hoja «Alimentos». Si escribes otro, la app busca el más parecido y te deja corregirlo.',
  'Protocolo: los pasos para hacerla, uno por línea dentro de la celda. Si empiezas un paso con «Título: …», el título sale en negrita en la app.',
  'Notas: un consejo corto («el feta ya es salado: no añadas sal»).',
  '',
  'Las calorías, los macros por porción y por 100 g y los alérgenos los calcula PARE. No hace falta ponerlos.',
];

export const INSTRUCCIONES_MAESTRO = [
  'PARE · Recetario maestro (el que ven todos)',
  'Este es el recetario de PARE tal como está publicado. Para cambiarlo para todos: edítalo y súbelo a GitHub, a la carpeta datos/recetario/entrada (Add file → Upload files → Commit). En unos minutos la app se actualiza sola.',
  'Solo cuentan las filas con Origen = PARE (o vacío). Para pasar al recetario de todos una receta tuya (Origen = Mía), cambia su Origen a PARE.',
  'Fila con ID de PARE: se actualiza esa receta. Fila sin ID: receta nueva (se le da un ID). Una receta tuya «mi versión» con «Basada en» y Origen = PARE sustituye a la original. «sí» en Borrar: se retira del recetario.',
  'El precio por ración se estima solo con los precios de los ingredientes. Los ingredientes tienen que llamarse exactamente como en la hoja «Alimentos»: si alguno no existe, no se publica nada y GitHub te avisa por correo de qué fila falla (y te sugiere el nombre parecido). Si falta un alimento en la lista, pídelo y se añade.',
  '',
];

/** Hojas del libro: instrucciones, recetas (con sus ingredientes en una columna) y la lista de alimentos. recetas en formato de la app. */
export function libroRecetario(recetas, { nombreAlimento, alimentos, maestro = false }) {
  const momentos = (r) => (r.momentos?.length ? r.momentos : String(r.momento || '').split(';').map((x) => x.trim()).filter(Boolean));
  const filasRec = [CAB_REC, ...recetas.map((r) => [r.id, r.propia ? 'Mía' : 'PARE', r.n, r.tipo === 'lote' ? 'Lote' : 'Plato', +r.porciones || 1,
    momentos(r).join('; '), r.tiempo ?? null, nombreEstilo(r.estilo), DIETA(r), r.pesoFinal ?? null,
    r.ingredientes.map((i) => lineaIngrediente(nombreAlimento(i.id) ?? i.n ?? i.id, i.g, i.nota)).join('\n'), (r.pasos || []).join('\n'), r.notas ?? '', '', r.basadaEn ?? ''])];
  const ali = [...alimentos].sort((a, b) => a.localeCompare(b, 'es'));
  return [
    { nombre: 'Instrucciones', filas: [...(maestro ? INSTRUCCIONES_MAESTRO : []), ...INSTRUCCIONES].map((l) => [l]), anchos: [110], cabecera: false },
    { nombre: 'Recetas', filas: filasRec, anchos: [10, 8, 34, 8, 10, 18, 11, 16, 12, 12, 48, 70, 30, 8, 12],
      desplegables: [{ rango: 'B2:B2000', lista: '"PARE,Mía"' }, { rango: 'D2:D2000', lista: '"Plato,Lote"' },
        { rango: 'H2:H2000', lista: `"${ESTILOS.map(([, l]) => l).join(',')}"` }, { rango: 'I2:I2000', lista: '"Omnívora,Vegetariana,Vegana"' }, { rango: 'N2:N2000', lista: '"sí,no"' }] },
    { nombre: 'Alimentos', filas: [['Alimento'], ...ali.map((n) => [n])], anchos: [56] },
  ];
}
