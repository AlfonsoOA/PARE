// Catálogo de PARE (ejercicios, alimentos, reglas). Se carga una vez desde data/pare.json.
export const cat = {
  listo: false,
  ejercicios: [],
  porId: new Map(),
  etiquetas: {},
  grupoDeMusculo: {},
  variantes: {},
  descansos: [],
  rangosVolumen: [],
  restricciones: [],
  alimentos: [],
  alimentoPorId: new Map(),
  recetas: [],
  recetaPorId: new Map(),
  actividades: [],
  suplementos: [],
};

export const GRUPOS = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'antebrazos', 'piernas', 'core', 'cuello'];
export const NOMBRE_GRUPO = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps',
  antebrazos: 'Antebrazos', piernas: 'Piernas', core: 'Core', cuello: 'Cuello',
};
export const ZONAS = [
  ['hombro', 'Hombro'], ['codo', 'Codo'], ['muneca', 'Muñeca'], ['lumbar', 'Zona lumbar'],
  ['rodilla', 'Rodilla'], ['cadera', 'Cadera e ingle'], ['tobillo', 'Tobillo y tendón de Aquiles'], ['cuello', 'Cuello'],
];

export async function cargarCatalogo() {
  const d = await fetch('./data/pare.json').then((r) => r.json());
  Object.assign(cat, d);
  cat.porId = new Map(d.ejercicios.map((e) => [e.id, e]));
  cat.alimentoPorId = new Map(d.alimentos.map((a) => [a.id, a]));
  cat.recetaPorId = new Map(d.recetas.map((r) => [r.id, r]));
  cat.listo = true;
}

export const ej = (id) => cat.porId.get(id);
export const etiqueta = (voc, cod) => cat.etiquetas[voc]?.[cod] ?? cod;
export const imagenes = (id) => (ej(id)?.img ? [`./img/${id}_1.webp`, `./img/${id}_2.webp`] : null);

/** Quita tildes y pasa a minúsculas para buscar. */
export const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
